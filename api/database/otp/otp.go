package otp

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"crypto/tls"
	"encoding/hex"
	"fmt"
	"math/big"
	"net"
	"net/mail"
	"net/smtp"
	"os"
	"time"

	"github.com/redis/go-redis/v9"
)

// OtpService handles OTP operations with Redis
type OtpService struct {
	redisClient     *redis.Client
	expiration      time.Duration
	prefix          string
	maxAttempts     int
	rateLimit       int
	rateLimitWindow time.Duration
}

// OTPConfig represents the configuration for the OTP service
type OTPConfig struct {
	// Redis configuration
	RedisClient *redis.Client

	// OTP expiration duration
	Expiration time.Duration

	// Redis key prefix
	Prefix string

	// Maximum number of attempts allowed for a single OTP
	MaxAttempts int

	// Rate limit: maximum number of OTPs that can be generated per identifier per time window
	RateLimit int
	
	// Rate limit time window
	RateLimitWindow time.Duration
}

// DefaultConfig returns a default configuration for OTP service
func DefaultConfig(redisClient *redis.Client) *OTPConfig {
	return &OTPConfig{
		RedisClient:     redisClient,
		Expiration:      3 * time.Minute,
		Prefix:          "otp:",
		MaxAttempts:     5,
		RateLimit:       3,
		RateLimitWindow: 15 * time.Minute,
	}
}

// NewOtpService creates a new OTP service with default configuration
func NewOtpService(redisClient *redis.Client) *OtpService {
	config := DefaultConfig(redisClient)
	return NewOtpServiceWithConfig(config)
}

// NewOtpServiceWithConfig creates a new OTP service with the given configuration
func NewOtpServiceWithConfig(config *OTPConfig) *OtpService {
	return &OtpService{
		redisClient:     config.RedisClient,
		expiration:      config.Expiration,
		prefix:          config.Prefix,
		maxAttempts:     config.MaxAttempts,
		rateLimit:       config.RateLimit,
		rateLimitWindow: config.RateLimitWindow,
	}
}

// generateHash creates a secure, deterministic hash from an identifier
// This prevents using raw emails as keys in the datastore
func (s *OtpService) generateHash(identifier string) string {
	// Create a SHA-256 hash of the identifier
	hasher := sha256.New()
	hasher.Write([]byte(identifier))
	return hex.EncodeToString(hasher.Sum(nil))
}

// getRedisKey returns the full Redis key for an identifier
func (s *OtpService) getRedisKey(identifier string) string {
	// Use a hash of the identifier as the key
	hashedID := s.generateHash(identifier)
	return fmt.Sprintf("%s%s", s.prefix, hashedID)
}

// getRateLimitKey returns the Redis key for rate limiting
func (s *OtpService) getRateLimitKey(identifier string) string {
	hashedID := s.generateHash(identifier)
	return fmt.Sprintf("%srl:%s", s.prefix, hashedID)
}

// getAttemptsKey returns the Redis key for tracking verification attempts
func (s *OtpService) getAttemptsKey(identifier string) string {
	hashedID := s.generateHash(identifier)
	return fmt.Sprintf("%sattempts:%s", s.prefix, hashedID)
}

// GenerateOTP creates a new 6-digit OTP and stores it in Redis
func (s *OtpService) GenerateOTP(ctx context.Context, identifier string) (string, error) {
	// Check rate limiting first
	isLimited, _, err := s.IsRateLimited(ctx, identifier)
	if err != nil {
		return "", fmt.Errorf("failed to check rate limit: %w", err)
	}
	
	if isLimited {
		return "", fmt.Errorf("rate limit exceeded for this identifier")
	}
	
	// Generate a random 6-digit number
	max := big.NewInt(1000000)
	n, err := rand.Int(rand.Reader, max)
	if err != nil {
		return "", err
	}

	// Format as 6 digits with leading zeros if needed
	otp := fmt.Sprintf("%06d", n)

	// Store in Redis with expiration using hashed key
	key := s.getRedisKey(identifier)
	err = s.redisClient.Set(ctx, key, otp, s.expiration).Err()
	if err != nil {
		return "", fmt.Errorf("failed to store OTP: %w", err)
	}
	
	// Reset attempts counter for this OTP
	attemptsKey := s.getAttemptsKey(identifier)
	err = s.redisClient.Set(ctx, attemptsKey, 0, s.expiration).Err()
	if err != nil {
		// Non-critical error, just log and continue
		fmt.Printf("Warning: Failed to reset attempts counter: %v\n", err)
	}
	
	// Increment rate limit counter
	rateLimitKey := s.getRateLimitKey(identifier)
	count, err := s.redisClient.Incr(ctx, rateLimitKey).Result()
	if err != nil {
		// Non-critical error, just log and continue
		fmt.Printf("Warning: Failed to increment rate limit counter: %v\n", err)
	}
	
	// Set expiration on rate limit key if it's the first attempt in this window
	if count == 1 {
		s.redisClient.Expire(ctx, rateLimitKey, s.rateLimitWindow)
	}

	return otp, nil
}

// VerifyOTP checks if the provided OTP is valid
func (s *OtpService) VerifyOTP(ctx context.Context, identifier, otp string) (bool, error) {
	// Get hashed key
	key := s.getRedisKey(identifier)
	attemptsKey := s.getAttemptsKey(identifier)
	
	// Check if too many attempts
	attempts, err := s.redisClient.Get(ctx, attemptsKey).Int()
	if err == nil && attempts >= s.maxAttempts {
		return false, fmt.Errorf("maximum verification attempts exceeded")
	}
	
	// Increment attempt counter
	s.redisClient.Incr(ctx, attemptsKey)
	
	// Get OTP from Redis
	storedOTP, err := s.redisClient.Get(ctx, key).Result()
	if err != nil {
		// OTP not found or expired
		if err == redis.Nil {
			return false, fmt.Errorf("OTP expired or not found")
		}
		return false, fmt.Errorf("error retrieving OTP: %w", err)
	}

	// Check if OTP matches
	if storedOTP == otp {
		// OTP is valid, delete it to prevent reuse
		s.redisClient.Del(ctx, key)
		s.redisClient.Del(ctx, attemptsKey)
		return true, nil
	}

	return false, nil
}

// IsRateLimited checks if the identifier has exceeded the rate limit
func (s *OtpService) IsRateLimited(ctx context.Context, identifier string) (bool, time.Duration, error) {
	rateLimitKey := s.getRateLimitKey(identifier)
	
	// Get current count
	count, err := s.redisClient.Get(ctx, rateLimitKey).Int64()
	if err == redis.Nil {
		// Key doesn't exist, not rate limited
		return false, 0, nil
	}
	if err != nil {
		return false, 0, err
	}
	
	// Check if over limit
	if count >= int64(s.rateLimit) {
		// Get remaining time
		ttl, err := s.redisClient.TTL(ctx, rateLimitKey).Result()
		if err != nil {
			return true, 0, err
		}
		return true, ttl, nil
	}
	
	return false, 0, nil
}

// SendOTPEmail sends OTP via Gmail
func SendOTPEmail(email, otp string) error {
	from := os.Getenv("EMAIL_ADDRESS")
	password := os.Getenv("EMAIL_PASSWORD")

	if from == "" || password == "" {
		return fmt.Errorf("environment variables EMAIL_ADDRESS or EMAIL_PASSWORD are not set")
	}

	// Parse email addresses
	fromAddr := mail.Address{Address: from}
	toAddr := mail.Address{Address: email}

	// Setup headers
	headers := make(map[string]string)
	headers["From"] = fromAddr.String()
	headers["To"] = toAddr.String()
	headers["Subject"] = "Your OTP for Authentication"
	headers["MIME-Version"] = "1.0"
	headers["Content-Type"] = "text/html; charset=\"utf-8\""

	// Setup message body
	body := fmt.Sprintf(`
	<html>
	  <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f9fafb; padding: 0; margin: 0;">
		<div style="max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 10px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1); overflow: hidden;">
		  <div style="background: #4f46e5; color: white; padding: 20px 30px;">
			<h1 style="margin: 0; font-size: 24px;">winnemart</h1>
		  </div>
		  <div style="padding: 30px;">
			<h2 style="color: #111827; font-size: 20px;">Your One-Time Password (OTP)</h2>
			<p style="color: #4b5563; margin: 10px 0 20px;">Use the code below to verify your identity. This code is valid for 3 minutes.</p>
			<div style="background-color: #f3f4f6; padding: 16px; text-align: center; font-size: 28px; font-weight: 600; color: #1f2937; border-radius: 8px; letter-spacing: 4px; border: 1px dashed #d1d5db;">
			  %s
			</div>
			<p style="color: #6b7280; font-size: 12px; margin-top: 20px;">Right-click or long-press the code above to copy it.</p>
			<p style="color: #9ca3af; font-size: 12px;">If you didn't request this, you can safely ignore this email.</p>
		  </div>
		  <div style="text-align: center; padding: 20px; font-size: 12px; color: #9ca3af;">
			&copy; %d winnemart Inc. All rights reserved.
		  </div>
		</div>
	  </body>
	</html>
	`, otp, time.Now().Year())

	// Construct message
	message := ""
	for k, v := range headers {
		message += fmt.Sprintf("%s: %s\r\n", k, v)
	}
	message += "\r\n" + body

	// Connect to the SMTP Server
	servername := "smtp.gmail.com:465"
	host, _, _ := net.SplitHostPort(servername)
	auth := smtp.PlainAuth("", from, password, host)

	// TLS config
	tlsconfig := &tls.Config{
		InsecureSkipVerify: false,
		ServerName:         host,
	}

	conn, err := tls.Dial("tcp", servername, tlsconfig)
	if err != nil {
		return err
	}

	c, err := smtp.NewClient(conn, host)
	if err != nil {
		return err
	}

	// Auth
	if err = c.Auth(auth); err != nil {
		return err
	}

	// To && From
	if err = c.Mail(from); err != nil {
		return err
	}

	if err = c.Rcpt(email); err != nil {
		return err
	}

	// Data
	w, err := c.Data()
	if err != nil {
		return err
	}

	_, err = w.Write([]byte(message))
	if err != nil {
		return err
	}

	err = w.Close()
	if err != nil {
		return err
	}

	c.Quit()
	return nil
}
func SendOTPEmailNew(email, otp string) error {
	from := "noreply@winnemart.com" // Use your verified SES sender
	smtpUsername := os.Getenv("SES_SMTP_USERNAME")
	smtpPassword := os.Getenv("SES_SMTP_PASSWORD")

	if smtpUsername == "" || smtpPassword == "" {
		return fmt.Errorf("SES SMTP credentials are not set in environment")
	}

	fromAddr := mail.Address{Address: from}
	toAddr := mail.Address{Address: email}

	headers := map[string]string{
		"From":         fromAddr.String(),
		"To":           toAddr.String(),
		"Subject":      "Your OTP for Authentication",
		"MIME-Version": "1.0",
		"Content-Type": "text/html; charset=\"utf-8\"",
	}

	body := fmt.Sprintf(`
	<html>
	  <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f9fafb; padding: 0; margin: 0;">
		<div style="max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 10px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1); overflow: hidden;">
		  <div style="background: #4f46e5; color: white; padding: 20px 30px;">
			<h1 style="margin: 0; font-size: 24px;">winnemart</h1>
		  </div>
		  <div style="padding: 30px;">
			<h2 style="color: #111827; font-size: 20px;">Your One-Time Password (OTP)</h2>
			<p style="color: #4b5563; margin: 10px 0 20px;">Use the code below to verify your identity. This code is valid for 3 minutes.</p>
			<div style="background-color: #f3f4f6; padding: 16px; text-align: center; font-size: 28px; font-weight: 600; color: #1f2937; border-radius: 8px; letter-spacing: 4px; border: 1px dashed #d1d5db;">
			  %s
			</div>
			<p style="color: #6b7280; font-size: 12px; margin-top: 20px;">Right-click or long-press the code above to copy it.</p>
			<p style="color: #9ca3af; font-size: 12px;">If you didn't request this, you can safely ignore this email.</p>
		  </div>
		  <div style="text-align: center; padding: 20px; font-size: 12px; color: #9ca3af;">
			&copy; %d winnemart Inc. All rights reserved.
		  </div>
		</div>
	  </body>
	</html>
	`, otp, time.Now().Year())

	// Build email message
	message := ""
	for k, v := range headers {
		message += fmt.Sprintf("%s: %s\r\n", k, v)
	}
	message += "\r\n" + body

	// Connect to Amazon SES SMTP endpoint (TLS)
	servername := "email-smtp.eu-north-1.amazonaws.com:465" // Change region if needed
	host := "email-smtp.eu-north-1.amazonaws.com"

	tlsconfig := &tls.Config{
		InsecureSkipVerify: false,
		ServerName:         host,
	}

	conn, err := tls.Dial("tcp", servername, tlsconfig)
	if err != nil {
		return err
	}

	c, err := smtp.NewClient(conn, host)
	if err != nil {
		return err
	}

	auth := smtp.PlainAuth("", smtpUsername, smtpPassword, host)

	if err = c.Auth(auth); err != nil {
		return err
	}

	if err = c.Mail(from); err != nil {
		return err
	}
	if err = c.Rcpt(email); err != nil {
		return err
	}

	w, err := c.Data()
	if err != nil {
		return err
	}
	_, err = w.Write([]byte(message))
	if err != nil {
		return err
	}
	err = w.Close()
	if err != nil {
		return err
	}

	c.Quit()
	return nil
}

// SendPasswordResetOTPEmail sends OTP via Gmail for password reset
func SendPasswordResetOTPEmail(email, otp string) error {
	from := os.Getenv("EMAIL_ADDRESS")
	password := os.Getenv("EMAIL_PASSWORD")

	if from == "" || password == "" {
		return fmt.Errorf("environment variables EMAIL_ADDRESS or EMAIL_PASSWORD are not set")
	}

	// Parse email addresses
	fromAddr := mail.Address{Address: from}
	toAddr := mail.Address{Address: email}

	// Setup headers
	headers := make(map[string]string)
	headers["From"] = fromAddr.String()
	headers["To"] = toAddr.String()
	headers["Subject"] = "Password Reset OTP"
	headers["MIME-Version"] = "1.0"
	headers["Content-Type"] = "text/html; charset=\"utf-8\""

	// Setup message body
	body := fmt.Sprintf(`
	<html>
	  <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f9fafb; padding: 0; margin: 0;">
		<div style="max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 10px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1); overflow: hidden;">
		  <div style="background: #4f46e5; color: white; padding: 20px 30px;">
			<h1 style="margin: 0; font-size: 24px;">winnemart</h1>
		  </div>
		  <div style="padding: 30px;">
			<h2 style="color: #111827; font-size: 20px;">Password Reset Request</h2>
			<p style="color: #4b5563; margin: 10px 0 20px;">You requested to reset your password. Use the code below to verify your identity. This code is valid for 3 minutes.</p>
			<div style="background-color: #f3f4f6; padding: 16px; text-align: center; font-size: 28px; font-weight: 600; color: #1f2937; border-radius: 8px; letter-spacing: 4px; border: 1px dashed #d1d5db;">
			  %s
			</div>
			<p style="color: #6b7280; font-size: 12px; margin-top: 20px;">Right-click or long-press the code above to copy it.</p>
			<p style="color: #9ca3af; font-size: 12px;">If you didn't request this password reset, please secure your account immediately.</p>
		  </div>
		  <div style="text-align: center; padding: 20px; font-size: 12px; color: #9ca3af;">
			&copy; %d winnemart Inc. All rights reserved.
		  </div>
		</div>
	  </body>
	</html>
	`, otp, time.Now().Year())

	// Construct message
	message := ""
	for k, v := range headers {
		message += fmt.Sprintf("%s: %s\r\n", k, v)
	}
	message += "\r\n" + body

	// Connect to the SMTP Server
	servername := "smtp.gmail.com:465"
	host, _, _ := net.SplitHostPort(servername)
	auth := smtp.PlainAuth("", from, password, host)

	// TLS config
	tlsconfig := &tls.Config{
		InsecureSkipVerify: false,
		ServerName:         host,
	}

	conn, err := tls.Dial("tcp", servername, tlsconfig)
	if err != nil {
		return err
	}

	c, err := smtp.NewClient(conn, host)
	if err != nil {
		return err
	}

	// Auth
	if err = c.Auth(auth); err != nil {
		return err
	}

	// To && From
	if err = c.Mail(from); err != nil {
		return err
	}

	if err = c.Rcpt(email); err != nil {
		return err
	}

	// Data
	w, err := c.Data()
	if err != nil {
		return err
	}

	_, err = w.Write([]byte(message))
	if err != nil {
		return err
	}

	err = w.Close()
	if err != nil {
		return err
	}

	c.Quit()
	return nil
}