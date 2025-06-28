package middleware

import (
	"context"
	"errors"
	"fmt"
	"log"
	"net/http"
	"strings"
	"time"

	"github.com/dgrijalva/jwt-go"
)

// JwtSecret is the secret key used for signing JWT tokens.
// Replace this with your own secret key and keep it secure.
var JwtSecret = []byte("SecretInHere")

// TokenStruct defines the structure of the JWT token claims.
type TokenStruct struct {
	ID    string `json:"id"`
	Type  string `json:"type"`
	jwt.StandardClaims
}

// Define context keys as custom types to avoid conflicts.
type contextKey string

const (
	IDContextKey         contextKey = "ID"
	UserTypeContextKey   contextKey = "userType"
	CookieAccessKeyCtx   contextKey = "cookieAccessKeyCtx"
	CookieName           contextKey = "SetloginToken"
)
var SecureValue = false
// CookieAccess struct for managing cookies.
type CookieAccess struct {
	Writer     http.ResponseWriter
	UserID     string
	IsLoggedIn bool
}

// SetToken writes a token to the cookie with a specified expiration time.
func (ca *CookieAccess) SetToken(token string) {
	http.SetCookie(ca.Writer, &http.Cookie{
		Name:     string(CookieName),             // Name of the cookie
		Value:    token,                          // Value of the cookie, which is the authentication token
		HttpOnly: true,                           // Indicates that the cookie is not accessible via JavaScript
		Secure:   SecureValue,                          // Allows the cookie to be sent over both HTTP and HTTPS
		Path:     "/",                            // Path for which the cookie is valid
		Expires:  time.Now().Add(24 * time.Hour), // Cookie expiration time set to 24 hours from now
		SameSite: http.SameSiteLaxMode,           // Helps mitigate CSRF attacks by ensuring the cookie is only sent for same-site requests
	})
}

// Logout removes the cookie by setting an expired cookie.
// This effectively logs the user out by invalidating the authentication token cookie.
func (ca *CookieAccess) Logout() error {
	// Create a cookie with the same name but with an empty value and an expiration time in the past.
	cookie := &http.Cookie{
		Name:     string(CookieName),      // Name of the cookie
		Value:    "",                      // Empty value to clear the token
		Path:     "/",                     // Path for which the cookie is valid
		HttpOnly: true,                    // Indicates that the cookie is not accessible via JavaScript
		Secure:   SecureValue,                    // Ensures the cookie is only sent over HTTPS
		Expires:  time.Unix(0, 0),         // Expiration time set to the Unix epoch, effectively expiring the cookie immediately
		SameSite: http.SameSiteLaxMode, // Helps mitigate CSRF attacks by ensuring the cookie is only sent for same-site requests
	}

	// Set the expired cookie in the response to invalidate it.
	http.SetCookie(ca.Writer, cookie)

	return nil // Return nil as there are no errors to handle in this case.
}

// setValInCtx sets the CookieAccess object in the request context.
func setValInCtx(ctx context.Context, val interface{}) context.Context {
	return context.WithValue(ctx, CookieAccessKeyCtx, val)
}

// GetCookieAccess retrieves the CookieAccess object from the context.
func GetCookieAccess(ctx context.Context) *CookieAccess {
	return ctx.Value(CookieAccessKeyCtx).(*CookieAccess)
}

// Middleware function for handling authentication and setting context values.
func Middleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		ctx := r.Context()
		cookieA := &CookieAccess{Writer: w}

		// Extract and parse the token here
		tokenCookie, err := r.Cookie(string(CookieName))
		if err == nil {
			token := tokenCookie.Value
			userID, userType, _, err := ParseToken(token)
			if err == nil {
				ctx = context.WithValue(ctx, IDContextKey, userID)
				ctx = context.WithValue(ctx, UserTypeContextKey, userType)
			}
		}

		ctx = setValInCtx(ctx, cookieA)

		// Pass the request to the next handler with the updated context
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

// ParseToken parses the provided JWT token and returns the claims if valid.
func ParseToken(tokenStr string) (string, string, map[string]interface{}, error) {
	token, err := jwt.Parse(tokenStr, func(token *jwt.Token) (interface{}, error) {
		return JwtSecret, nil
	})
	if err != nil {
		return "", "", nil, err
	}

	if claims, ok := token.Claims.(jwt.MapClaims); ok && token.Valid {
		ID, ok := claims["id"].(string)
		if !ok {
			return "", "", nil, fmt.Errorf("ID not found in the token claims or has an unexpected type")
		}

		Type, ok := claims["type"].(string)
		if !ok {
			return "", "", nil, fmt.Errorf("type not found in the token claims or has an unexpected type")
		}

		// Extract optional claims, if they exist.
		optionalClaims := make(map[string]interface{})
		for key, value := range claims {
			if key != "id" && key != "type" {
				optionalClaims[key] = value
			}
		}

		return ID, Type, optionalClaims, nil
	} else {
		return "", "", nil, fmt.Errorf("invalid token")
	}
}

// ExtractCtxInfoForAllAccess extracts and validates information from the request context.
func ExtractCtxInfoForAllAccess(ctx context.Context) error {
	_, ok := ctx.Value(IDContextKey).(string)
	if !ok {
		return fmt.Errorf("token expired or you don't have access to the request context, try logging in again")
	}

	userType, ok := ctx.Value(UserTypeContextKey).(string)
	if !ok {
		return fmt.Errorf("userType not found in request context")
	}

	userType = strings.ToLower(userType) // Convert userType to lowercase

	// Check if the userType is not one of the allowed values.
	if userType != "Vendor" && userType != "driver" {
		return fmt.Errorf("%s is not allowed", userType)
	}

	return nil
}

// ValidateTokens validates the provided JWT token and returns the claims if the token is valid.
func ValidateTokens(signedToken string) (*TokenStruct, error) {
	// Parse the JWT token with claims and validation function.
	token, err := jwt.ParseWithClaims(
		signedToken,
		&TokenStruct{},
		func(token *jwt.Token) (interface{}, error) {
			// Validate the signing method used in the token.
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
			}
			return JwtSecret, nil
		},
	)

	if err != nil {
		return nil, err
	}

	// Verify if the token is valid and not expired.
	if !token.Valid {
		return nil, errors.New("invalid token")
	}

	// Extract and type-assert the claims.
	claims, ok := token.Claims.(*TokenStruct)
	if !ok {
		return nil, errors.New("invalid token claims")
	}

	// Verify if the token has expired.
	if claims.ExpiresAt < time.Now().UTC().Unix() {
		return nil, errors.New("token has expired")
	}

	// Token is valid, return the claims.
	return claims, nil
}

// GenerateToken creates a new JWT token with the specified type, ID, and optional claims.
func GenerateToken(userType string, ID string, optionalClaims ...jwt.MapClaims) (string, error) {
	// Create a new JWT token with the signing method HS256 (HMAC SHA-256)
	token := jwt.New(jwt.SigningMethodHS256)

	// Convert the token's claims to a map
	claims := token.Claims.(jwt.MapClaims)

	// Set the "type" and "ID" claims in the token
	claims["type"] = userType
	claims["id"] = ID

	// Set the "exp" (expiration) claim to the current time + 24 hours
	claims["exp"] = time.Now().Add(time.Hour * 24).Unix()

	// Set optional claims if provided
	for _, optionalClaim := range optionalClaims {
		for key, value := range optionalClaim {
			claims[key] = value
		}
	}

	// Sign the token using a secret key
	tokenString, err := token.SignedString(JwtSecret)
	if err != nil {
		log.Fatal("Error in generating token")
		return "", err
	}

	// Return the signed token as a string
	return tokenString, nil
}

// SetTokenForContext generates a new token and sets it in the context’s cookie.
func SetTokenForContext(ctx context.Context, userType, id string) error {
	// Generate a new token
	token, err := GenerateToken(userType, id)
	if err != nil {
		return fmt.Errorf("failed to generate token: %w", err)
	}

	// Retrieve the CookieAccess object from the context
	ca, ok := ctx.Value(CookieAccessKeyCtx).(*CookieAccess)
	if !ok {
		return fmt.Errorf("failed to retrieve CookieAccess from context")
	}

	// Set the generated token as a cookie using the CookieAccess object
	ca.SetToken(token)
	return nil
}

// GetIDFromContext retrieves the ID from the context.
func GetIDFromContext(ctx context.Context) (string, error) {
	id, ok := ctx.Value(IDContextKey).(string)
	if !ok {
		return "", errors.New("ID not found in context")
	}
	return id, nil
}

// RequireAuth is a wrapper function that checks if the user is authenticated
// before executing the resolver function
func RequireAuth(ctx context.Context) error {
    // Use the existing ExtractCtxInfoForAllAccess to check authentication
    if err := ExtractCtxInfoForAllAccess(ctx); err != nil {
        return fmt.Errorf("authentication required: %w", err)
    }
    return nil
}

// RequireAuthWithUserType checks both authentication and specific user type
func RequireAuthWithType(ctx context.Context, allowedTypes []string) error {
    // First check basic authentication
    if err := RequireAuth(ctx); err != nil {
        return err
    }

    // Then check user type
    userType, ok := ctx.Value(UserTypeContextKey).(string)
    if !ok {
        return fmt.Errorf("user type not found in context")
    }

    // Verify user type is allowed
    for _, allowedType := range allowedTypes {
        if userType == allowedType {
            return nil
        }
    }

    return fmt.Errorf("unauthorized: user type %s not allowed", userType)
}