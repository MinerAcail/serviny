package helper

import (
	"context"
	"errors"
	"fmt"
	"io"
	"log"
	"math/rand"
	"os"
	"reflect"
	"regexp"
	"strings"
	"time"

	"github.com/99designs/gqlgen/graphql"
	"github.com/google/uuid"
	"github.com/gosimple/slug"
	"github.com/lehxees/serviny/graph/model"

	"github.com/minio/minio-go/v7"
	"gorm.io/gorm"
)

var IsTrue bool = true
var IsFalse bool = false

func ReadFile(filePath string) ([]byte, error) {
	content, err := os.ReadFile(filePath)
	if err != nil {
		return nil, fmt.Errorf("failed to read the sql file %s %w", filePath, err)
	}
	return content, nil
}
func GetKeys(m map[string]interface{}) []string {
	keys := make([]string, 0, len(m))
	for k := range m {
		keys = append(keys, k)
	}
	return keys
}
func DeleteByID(db *gorm.DB, model interface{}, id string) error {
	// Find the model instance by ID
	if err := db.Where("id = ?", id).First(model).Error; err != nil {
		return fmt.Errorf("%s not found: %v", reflect.TypeOf(model), err)
	}

	// Delete the model instance from the database
	if err := db.Delete(model).Error; err != nil {
		return fmt.Errorf("failed to delete %s: %v", reflect.TypeOf(model), err)
	}

	return nil
}

func GetAllByModel(db *gorm.DB, model interface{}, preloads ...string) error {
	query := db.Order("created_at DESC")

	for _, preload := range preloads {
		query = query.Preload(preload)
	}

	if err := query.Find(model).Error; err != nil {
		return fmt.Errorf("failed to get response for %s: %v", reflect.TypeOf(model), err)
	}

	return nil
}
func GenerateRandomString(length int) string {
	const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
	result := make([]byte, length)
	for i := range result {
		result[i] = charset[rand.Intn(len(charset))]
	}
	return string(result)
}
func CheckDuplicateRecords(db *gorm.DB, model interface{}, inputName, inputPhoneNumber string) error {
	// Check if a user with the same name and number already exists
	err := db.Where("name = ? AND number = ?", inputName, inputPhoneNumber).First(model).Error
	if err == nil {
		return fmt.Errorf(" A member with the number already exists")
	}
	if err != gorm.ErrRecordNotFound {
		return fmt.Errorf("failed to query for duplicates: %w", err)
	}

	// Check if a user with the same number already exists
	err = db.Where("number = ?", inputPhoneNumber).First(model).Error
	if err == nil {
		return fmt.Errorf(" A member with the same number already exists")
	}
	if err != gorm.ErrRecordNotFound {
		return fmt.Errorf("failed to query for duplicates: %w", err)
	}

	return nil
}
func CheckDuplicateRecordsEmailNumber(db *gorm.DB, model interface{}, inputEmail, inputPhoneNumber string) error {
	// Check if a user with the same email and number already exists
	err := db.Where("email = ? AND number = ?", inputEmail, inputPhoneNumber).First(model).Error
	if err == nil {
		return fmt.Errorf(" A member with the number already exists")
	}
	if err != gorm.ErrRecordNotFound {
		return fmt.Errorf("failed to query for duplicates: %w", err)
	}

	// Check if a user with the same number already exists
	err = db.Where("number = ?", inputPhoneNumber).First(model).Error
	if err == nil {
		return fmt.Errorf(" A member with the same number already exists")
	}
	if err != gorm.ErrRecordNotFound {
		return fmt.Errorf("failed to query for duplicates: %w", err)
	}

	return nil
}

func CheckAllDuplicateRecords(db *gorm.DB, model interface{}, inputName, email, inputPhoneNumber string) error {

	// Check if a user with the same name and number already exists
	err := db.Where("name = ? AND number = ?", inputName, inputPhoneNumber).First(model).Error
	if err == nil {
		return fmt.Errorf(" A member with the number already exists")
	}
	if err != gorm.ErrRecordNotFound {
		return fmt.Errorf("failed to query for duplicates: %w", err)
	}

	// Check if a user with the same number already exists
	err = db.Where("number = ?", inputPhoneNumber).First(model).Error
	if err == nil {
		return fmt.Errorf(" A member with the same number already exists")
	}
	// Skip the check for the specific email "winnemart360@gmail.com"
	if email == "winnemart360@gmail.com" {
		return nil
	}
	// Check if a user with the same email already exists
	err = db.Where("email = ?", email).First(model).Error
	if err == nil {
		return fmt.Errorf(" A member with the same number already exists")
	}
	if err != gorm.ErrRecordNotFound {
		return fmt.Errorf("failed to query for duplicates: %w", err)
	}

	return nil
}
func CleanPhoneNumber(phoneNumber string) string {
	// Remove all non-digit characters (e.g. "+233", spaces, dashes)
	re := regexp.MustCompile(`\D`)
	digitsOnly := re.ReplaceAllString(phoneNumber, "")

	// Remove Ghana country code if present
	if strings.HasPrefix(digitsOnly, "233") {
		digitsOnly = digitsOnly[3:]
	}

	// Remove leading zero if present
	if strings.HasPrefix(digitsOnly, "0") {
		digitsOnly = digitsOnly[1:]
	}

	// Ensure we now have exactly 9 digits
	if len(digitsOnly) != 9 {
		return ""
	}

	// Return in international format
	return "233" + digitsOnly
}
func CleanPhoneNumber1(phoneNumber string) string {
	// Get country code from environment variable, fallback to "233" if not set
	countryCode := os.Getenv("JUS1")
	if countryCode == "" {
		countryCode = "233" // Default fallback
	}
	
	// Return in international format
	return countryCode + phoneNumber
}

func UploadFileToMinio(ctx context.Context, minioClient *minio.Client, bucketName, fileType string, file *graphql.Upload) (string, error) {
	uniqueID := uuid.New().String()
	fileName := fmt.Sprintf("%s-%s-%s", bucketName, fileType, uniqueID)

	// Ensure bucket exists before uploading
	exists, err := minioClient.BucketExists(ctx, bucketName)
	if err != nil {
		return "", fmt.Errorf("failed to check if bucket exists: %v", err)
	}
	if !exists {
		return "", fmt.Errorf("bucket %s does not exist", bucketName)
	}

	// Upload the file to MinIO
	_, err = minioClient.PutObject(ctx, bucketName, fileName, file.File, file.Size, minio.PutObjectOptions{ContentType: file.ContentType})
	if err != nil {
		return "", fmt.Errorf("failed to upload file to MinIO: %v", err)
	}

	// Generate and return the file URL
	fileURL := fmt.Sprintf("/minio/%s/%s", bucketName, fileName)

	return fileURL, nil
}

// DeleteBucketFromMinio removes a bucket from MinIO
func DeleteBucketFromMinio(ctx context.Context, client *minio.Client, bucketName string) error {
	// List all objects in the bucket
	objectCh := client.ListObjects(ctx, bucketName, minio.ListObjectsOptions{Recursive: true})

	// Delete all objects before removing the bucket
	for object := range objectCh {
		if object.Err != nil {
			return fmt.Errorf("failed to list objects in bucket %s: %v", bucketName, object.Err)
		}

		err := client.RemoveObject(ctx, bucketName, object.Key, minio.RemoveObjectOptions{})
		if err != nil {
			return fmt.Errorf("failed to delete object %s in bucket %s: %v", object.Key, bucketName, err)
		}
	}

	// Now, delete the bucket
	err := client.RemoveBucket(ctx, bucketName)
	if err != nil {
		return fmt.Errorf("failed to delete bucket %s from MinIO: %v", bucketName, err)
	}

	return nil
}
// DeleteObjectsFromMinio removes a list of objects from a given MinIO bucket.
func DeleteObjectsFromMinio(ctx context.Context, client *minio.Client, bucket string, urls []string) {
	for _, url := range urls {
		object := ExtractObjectNameFromMinioURL(url, bucket)
		if object == "" {
			log.Printf("skipping empty object from url: %s", url)
			continue
		}
		if err := client.RemoveObject(ctx, bucket, object, minio.RemoveObjectOptions{}); err != nil {
			log.Printf("failed to delete object %q: %v", object, err)
		}
	}
}

// ExtractObjectNameFromMinioURL extracts the object name from a MinIO URL.
func ExtractObjectNameFromMinioURL(url, bucket string) string {
	prefix := "/minio/" + bucket + "/"
	return strings.TrimPrefix(url, prefix)
}

// fileURL := fmt.Sprintf("/minio/%s/%s", bucketName, fileName)
// bucketName := fmt.Sprintf("vendor-%s-bucket", vendorIDStr)

func ImageFromMinIOURL(ctx context.Context, minioClient *minio.Client, fileURL string) ([]byte, error) {
	// Extract bucketName and fileName from the URL
	parts := strings.SplitN(fileURL, "/", 4)
	if len(parts) != 4 {
		return nil, fmt.Errorf("invalid file URL format: %s", fileURL)
	}
	bucketName := parts[2]
	fileName := parts[3]

	object, err := minioClient.GetObject(ctx, bucketName, fileName, minio.GetObjectOptions{})
	if err != nil {
		return nil, fmt.Errorf("error fetching file from MinIO: %w", err)
	}
	defer object.Close()

	imageData, err := io.ReadAll(object)
	if err != nil {
		return nil, fmt.Errorf("error reading file from MinIO: %w", err)
	}
	return imageData, nil
}

func GenerateOrderCartID(cartID string) (string, error) {
	// Create a new random generator seeded with the current time
	r := rand.New(rand.NewSource(time.Now().UnixNano()))

	// Generate three random lowercase letters
	randomLetters := fmt.Sprintf("%c%c%c", 'a'+r.Intn(26), 'a'+r.Intn(26), 'a'+r.Intn(26))
	prefix := cartID[:3]
	if len(cartID) < 3 {
		return "", errors.New("cartID must be at least 3 characters long")
	}

	// Return the formatted string
	return fmt.Sprintf("%s%s", prefix, randomLetters), nil
}

// CalculateEstimatedDelivery returns a delivery time estimate between 30-60 minutes
// from the current time, formatted as "HH:MM PM/AM"
func CalculateEstimatedDelivery(orderTime time.Time) string {
	// Generate random minutes between 30 and 60
	extraMinutes := rand.Intn(31) + 30 // 30-60 minutes

	// Add the random duration to order time
	estimatedTime := orderTime.Add(time.Duration(extraMinutes) * time.Minute)

	// Format the time as "3:04 PM"
	return estimatedTime.Format("3:04 PM")
}

// CalculateDeliveryRange returns both the earliest and latest possible delivery times
// formatted as "1:30 PM - 2:00 PM"
func CalculateDeliveryRange(orderTime time.Time) string {
	// Calculate earliest (orderTime + 30 minutes)
	earliestDelivery := orderTime.Add(30 * time.Minute)

	// Calculate latest (orderTime + 60 minutes)
	latestDelivery := orderTime.Add(60 * time.Minute)

	// Format the range
	return fmt.Sprintf("%s - %s",
		earliestDelivery.Format("3:04 PM"),
		latestDelivery.Format("3:04 PM"))
}

const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"

func GeneratePassword() string {
	src := rand.NewSource(time.Now().UnixNano())
	r := rand.New(src)

	password := make([]byte, 5)
	for i := range password {
		password[i] = charset[r.Intn(len(charset))]
	}
	return string(password)
}

// Validate email format
func IsValidEmail(email string) bool {
	re := regexp.MustCompile(`^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$`)
	return re.MatchString(email)
}

// Validate phone number (basic check for digits)
func IsValidPhone(number string) bool {
	re := regexp.MustCompile(`^\d{7,15}$`) // Accepts numbers with 7 to 15 digits
	return re.MatchString(number)
}

// Helper function to check if two time ranges overlap
func IsTimeOverlap(start1, end1, start2, end2 string) bool {
	// If one range ends before or at the same time the other starts, they don't overlap
	return !(end1 <= start2 || end2 <= start1)
}

// Helper function to handle nil string pointers
func GetStringValue(s *string) string {
	if s == nil {
		return ""
	}
	return *s
}
func BoolPtr(b bool) *bool {
	if !b {
		return nil
	}
	return &b
}
// Helper function to remove duplicate strings from a slice
func RemoveDuplicates(strSlice []string) []string {
	keys := make(map[string]bool)
	list := []string{}

	for _, entry := range strSlice {
		if _, value := keys[entry]; !value {
			keys[entry] = true
			list = append(list, entry)
		}
	}
	return list
}

func FetchAllProducts(db *gorm.DB, limit int, offset int, vendorID string) ([]*model.Product, error) {
	var products []*model.Product

	query := db.
		Where("state != ?", "INACTIVE").
		Where("vendor_id = ?", vendorID) // ✅ filter by vendor ID

	if err := query.
		Order(`
            FLOOR(CAST(price AS NUMERIC) / 10) ASC,
            MD5(array_to_string(categories, ',')) ASC,
            gen_random_uuid()
        `).
		Limit(limit).
		Offset(offset).
		Find(&products).Error; err != nil {
		return nil, fmt.Errorf("failed to fetch products: %v", err)
	}

	return products, nil
}
func CleanSearchQuery(query string) string {
	return strings.TrimSpace(query)
}

func FetchAllProduct(db *gorm.DB) ([]*model.Product, error) {
	var products []*model.Product
	if err := db.Where("state != ?", "INACTIVE").Order("created_at DESC").Find(&products).Error; err != nil {
		return nil, fmt.Errorf("failed to fetch products: %v", err)
	}
	return products, nil
}

func ExecuteSearchQueryWithVendorPriority(db *gorm.DB, query string, vendorID string) ([]*model.Product, error) {
	var products []*model.Product
	similarityThreshold := 0.12

	err := db.Raw(`
        WITH ranked_products AS (
            SELECT 
                *,
                (CASE WHEN vendor_id = ? THEN 1 ELSE 0 END) AS is_vendor_match,
                ts_rank_cd(search_vector, plainto_tsquery('english', ?)) AS ts_rank_val,
                similarity(LOWER(name), LOWER(?)) AS name_sim,
                word_similarity(name, ?) AS word_sim,
                GREATEST(
                    similarity(LOWER(name), LOWER(?)),
                    similarity(LOWER(?), LOWER(name))
                ) AS bidirectional_sim,
                levenshtein(LOWER(name), LOWER(?)) AS typo_distance
            FROM products
            WHERE 
                state != 'INACTIVE' AND 
                (search_vector @@ plainto_tsquery('english', ?) OR 
                (similarity(LOWER(name), LOWER(?)) > CAST(? AS NUMERIC)) OR 
                (name ILIKE '%' || ? || '%') OR 
                (name ILIKE ? || '%') OR 
                (levenshtein(LOWER(name), LOWER(?)) <= 2))
        )
        SELECT * FROM ranked_products
        ORDER BY
            is_vendor_match DESC,
            CASE 
                WHEN LOWER(name) = LOWER(?) THEN 10.0
                WHEN name ILIKE ? THEN 8.0
                WHEN name ILIKE ? || '%' THEN 6.0
                WHEN name ILIKE '%' || ? || '%' THEN 4.0
                ELSE 0 
            END +
            (bidirectional_sim * 10.0) +
            (name_sim * 5.0) +
            (ts_rank_val * 2.0) +
            (word_sim * 3.0) +
            (CASE WHEN typo_distance <= 2 THEN (5 - typo_distance) * 2 ELSE 0 END)
        DESC LIMIT 50
    `, vendorID, query, query, query, query, query, query, query, query, fmt.Sprintf("%f", similarityThreshold),
		query, query, query, query, query, query, query, query).Find(&products).Error

	if err != nil {
		return nil, fmt.Errorf("failed to search products: %v", err)
	}

	return products, nil
}
// Helper functions
func ValidateSubdomain(subdomain string) error {
	if len(subdomain) < 3 {
		return fmt.Errorf("subdomain must be at least 3 characters long")
	}
	if len(subdomain) > 63 {
		return fmt.Errorf("subdomain must be no more than 63 characters long")
	}

	// DNS-compliant subdomain validation
	validSubdomain := regexp.MustCompile(`^[a-z0-9]([a-z0-9-]*[a-z0-9])?$`)
	if !validSubdomain.MatchString(subdomain) {
		return fmt.Errorf("subdomain can only contain lowercase letters, numbers, and hyphens, and cannot start or end with a hyphen")
	}

	// Reserved subdomains
	reserved := []string{"www", "mail", "ftp", "api", "admin", "root", "support", "help", "ssr", "cdn", "assets", "static"}
	for _, r := range reserved {
		if subdomain == r {
			return fmt.Errorf("subdomain '%s' is reserved", subdomain)
		}
	}

	return nil
}

func GenerateCleanSubdomain1(name string) string {
	if name == "" {
		return "app"
	}

	// Convert to lowercase and clean
	clean := strings.ToLower(name)
	
	// Remove special characters except spaces and hyphens
	clean = regexp.MustCompile(`[^a-z0-9\s-]`).ReplaceAllString(clean, "")
	
	// Replace spaces with hyphens
	clean = strings.ReplaceAll(clean, " ", "-")
	
	// Remove multiple consecutive hyphens
	clean = regexp.MustCompile(`-+`).ReplaceAllString(clean, "-")
	
	// Trim hyphens from start and end
	clean = strings.Trim(clean, "-")

	// Use slug for additional cleaning if available
	if clean != "" {
		subdomain := slug.Make(clean)
		if subdomain != "" {
			clean = subdomain
		}
	}

	// Ensure minimum length
	if len(clean) < 3 {
		if clean == "" {
			clean = "app"
		} else {
			clean = clean + "app"
		}
	}

	// Ensure maximum length (keep it reasonable for UI)
	if len(clean) > 20 {
		clean = clean[:20]
	}

	// Ensure it doesn't end with hyphen after truncation
	clean = strings.TrimRight(clean, "-")

	return clean
}
func GenerateCleanSubdomain(name string) string {
	if name == "" {
		return "app"
	}

	// Convert to lowercase
	clean := strings.ToLower(strings.TrimSpace(name))
	
	// First remove all spaces and hyphens
	clean = strings.ReplaceAll(clean, " ", "")
	clean = strings.ReplaceAll(clean, "-", "")
	
	// Use slug for better Unicode handling and special character cleanup
	clean = slug.Make(clean)
	
	// If slug.Make() resulted in empty string, fallback to manual cleaning
	if clean == "" {
		clean = strings.ToLower(strings.TrimSpace(name))
		// Remove spaces and hyphens
		clean = strings.ReplaceAll(clean, " ", "")
		clean = strings.ReplaceAll(clean, "-", "")
		// Remove all special characters, keep only alphanumeric
		clean = regexp.MustCompile(`[^a-z0-9]`).ReplaceAllString(clean, "")
	}
	
	// Remove any hyphens that might have been added by slug.Make()
	clean = strings.ReplaceAll(clean, "-", "")

	// Ensure minimum length
	if len(clean) < 3 {
		if clean == "" {
			clean = "app"
		} else {
			clean = clean + "app"
		}
	}

	// Ensure maximum length (keep it reasonable for subdomains)
	if len(clean) > 30 {
		clean = clean[:30]
		// Ensure it doesn't end with hyphen after truncation
		clean = strings.TrimRight(clean, "-")
	}

	// Final check - ensure it's not empty after cleaning
	if clean == "" {
		clean = "app"
	}

	return clean
}
func GenerateSuggestions(db *gorm.DB, baseSubdomain string) []string {
	suggestions := make([]string, 0, 5)

	// Try with numbers
	for i := 1; i <= 99 && len(suggestions) < 3; i++ {
		suggestion := fmt.Sprintf("%s%d", baseSubdomain, i)
		if len(suggestion) <= 63 && ValidateSubdomain(suggestion) == nil && IsSubdomainAvailable(db, suggestion) {
			suggestions = append(suggestions, suggestion)
		}
	}

	// Try with common suffixes
	suffixes := []string{"app", "site", "web", "dev", "pro"}
	for _, suffix := range suffixes {
		if len(suggestions) >= 5 {
			break
		}
		suggestion := baseSubdomain + suffix
		if len(suggestion) <= 63 && ValidateSubdomain(suggestion) == nil && IsSubdomainAvailable(db, suggestion) {
			suggestions = append(suggestions, suggestion)
		}
	}

	// Try with prefixes if we still need more
	prefixes := []string{"my", "new", "the"}
	for _, prefix := range prefixes {
		if len(suggestions) >= 5 {
			break
		}
		suggestion := prefix + baseSubdomain
		if len(suggestion) <= 63 && ValidateSubdomain(suggestion) == nil && IsSubdomainAvailable(db, suggestion) {
			suggestions = append(suggestions, suggestion)
		}
	}

	return suggestions
}

func IsSubdomainAvailable(db *gorm.DB, subdomain string) bool {
	var count int64
	db.Model(&model.Service{}).Where("sub_domain = ?", subdomain).Count(&count)
	return count == 0
}

// Helper functions
func IsVideoFile(contentType string) bool {
	videoTypes := []string{
		"video/mp4",
		"video/webm",
		"video/ogg",
		"video/avi",
		"video/mov",
		"video/quicktime",
	}
	
	for _, vType := range videoTypes {
		if contentType == vType {
			return true
		}
	}
	return false
}
func IsImageFile(contentType string) bool {
	imageTypes := []string{
		"image/jpeg",
		"image/jpg",
		"image/png",
		"image/webp",
		"image/gif",
		
	}
	
	for _, iType := range imageTypes {
		if contentType == iType {
			return true
		}
	}
	return false
}