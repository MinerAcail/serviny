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