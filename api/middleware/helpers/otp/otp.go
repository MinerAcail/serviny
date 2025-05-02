package otp

import (
	"crypto/rand"
	"crypto/tls"
	"fmt"
	"math/big"
	"net"
	"net/mail"
	"net/smtp"
	"os"
	"sync"
	"time"
)

// OtpStore stores OTPs with expiration times
type OtpStore struct {
	otps      map[string]string
	expiresAt map[string]time.Time
	mu        sync.Mutex
}

// NewOtpStore creates a new OTP store
func NewOtpStore() *OtpStore {
	store := &OtpStore{
		otps:      make(map[string]string),
		expiresAt: make(map[string]time.Time),
	}

	// Start a cleanup goroutine
	go store.cleanupExpiredOtps()
	return store
}

// cleanupExpiredOtps removes expired OTPs every minute
func (s *OtpStore) cleanupExpiredOtps() {
	ticker := time.NewTicker(1 * time.Minute)
	defer ticker.Stop()

	for range ticker.C {
		s.mu.Lock()
		now := time.Now()
		for email, expiresAt := range s.expiresAt {
			if now.After(expiresAt) {
				delete(s.otps, email)
				delete(s.expiresAt, email)
			}
		}
		s.mu.Unlock()
	}
}

// GenerateOTP creates a new 6-digit OTP
func (s *OtpStore) GenerateOTP(email string) (string, error) {
	// Generate a random 6-digit number
	max := big.NewInt(1000000)
	n, err := rand.Int(rand.Reader, max)
	if err != nil {
		return "", err
	}

	// Format as 6 digits with leading zeros if needed
	otp := fmt.Sprintf("%06d", n)

	s.mu.Lock()
	defer s.mu.Unlock()

	// Store OTP with 10-minute expiration
	s.otps[email] = otp
	s.expiresAt[email] = time.Now().Add(10 * time.Minute)

	return otp, nil
}

// VerifyOTP checks if the provided OTP is valid
func (s *OtpStore) VerifyOTP(email, otp string) bool {
	s.mu.Lock()
	defer s.mu.Unlock()

	storedOTP, exists := s.otps[email]
	if !exists {
		return false
	}

	expiresAt, _ := s.expiresAt[email]
	if time.Now().After(expiresAt) {
		delete(s.otps, email)
		delete(s.expiresAt, email)
		return false
	}

	if storedOTP == otp {
		// OTP used, invalidate it
		delete(s.otps, email)
		delete(s.expiresAt, email)
		return true
	}

	return false
}
// tovk caub iwpn bnuo

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
			<h1 style="margin: 0; font-size: 24px;">Serviny</h1>
		  </div>
		  <div style="padding: 30px;">
			<h2 style="color: #111827; font-size: 20px;">Your One-Time Password (OTP)</h2>
			<p style="color: #4b5563; margin: 10px 0 20px;">Use the code below to verify your identity. This code is valid for 2 minutes.</p>
			<div style="background-color: #f3f4f6; padding: 16px; text-align: center; font-size: 28px; font-weight: 600; color: #1f2937; border-radius: 8px; letter-spacing: 4px; border: 1px dashed #d1d5db;">
			  %s
			</div>
			<p style="color: #6b7280; font-size: 12px; margin-top: 20px;">Right-click or long-press the code above to copy it.</p>
			<p style="color: #9ca3af; font-size: 12px;">If you didn’t request this, you can safely ignore this email.</p>
		  </div>
		  <div style="text-align: center; padding: 20px; font-size: 12px; color: #9ca3af;">
			&copy; %d Serviny Inc. All rights reserved.
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
	// servername := "smtp.gmail.com:587"
	servername := "smtp.gmail.com:465"

	host, _, _ := net.SplitHostPort(servername)

	auth := smtp.PlainAuth("", from, password, host)

	// TLS config
	tlsconfig := &tls.Config{
		InsecureSkipVerify: false,
		ServerName:         host,
	}

	// Here is the key, you need to call tls.Dial instead of smtp.Dial
	// for smtp servers running on 465 that require an ssl connection
	// from the very beginning (no starttls)
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
