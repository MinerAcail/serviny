package helper

import (
	"context"
	"errors"
	"fmt"
	"io"
	"math/rand"
	"os"
	"reflect"
	"regexp"
	"strings"
	"time"

	"github.com/99designs/gqlgen/graphql"
	"github.com/google/uuid"
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
	// Skip the check for the specific email "serviny360@gmail.com"
	if email == "serviny360@gmail.com" {
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
	cleanedPhoneNumber := strings.ReplaceAll(phoneNumber, " ", "")
	cleanedPhoneNumber = strings.TrimPrefix(cleanedPhoneNumber, "+233")
	cleanedPhoneNumber = strings.TrimPrefix(cleanedPhoneNumber, "233")

	// Check if the cleaned phone number has fewer than 10 digits
	if len(cleanedPhoneNumber) < 10 {
		// Add a leading "0" to make it 10 digits
		cleanedPhoneNumber = "0" + cleanedPhoneNumber
	}

	return cleanedPhoneNumber
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


func FetchAllProducts(db *gorm.DB, limit int, offset int,vendorID string) ([]*model.Product, error) {
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