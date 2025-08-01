// File: helpers/range_validator.go
package riderrange

import (
	"fmt"

	"github.com/lehxees/serviny/graph/model"
	"gorm.io/gorm"
)

// RangeValidationResult represents the result of range validation
type RangeValidationResult struct {
	IsValid          bool    `json:"isValid"`
	SanitizedStart   float64 `json:"sanitizedStart"`
	SanitizedEnd     float64 `json:"sanitizedEnd"`
	HasGap           bool    `json:"hasGap"`
	GapSize          float64 `json:"gapSize"`
	WasStartAdjusted bool    `json:"wasStartAdjusted"`
	Message          string  `json:"message"`
}

// RangeInput represents input for range validation
type RangeInput struct {
	StartKm float64 `json:"startKm"`
	EndKm   float64 `json:"endKm"`
	Price   float64 `json:"price"`
}

// RangeStats provides statistics about a rider's ranges
type RangeStats struct {
	TotalRanges   int     `json:"totalRanges"`
	TotalCoverage float64 `json:"totalCoverage"`
	Gaps          []Gap   `json:"gaps"`
	MaxPrice      float64 `json:"maxPrice"`
	MinPrice      float64 `json:"minPrice"`
	AveragePrice  float64 `json:"averagePrice"`
}

// Gap represents a gap between ranges
type Gap struct {
	StartKm float64 `json:"startKm"`
	EndKm   float64 `json:"endKm"`
	Size    float64 `json:"size"`
}

// RangeValidator handles all range validation and sanitization logic
type RangeValidator struct {
	db *gorm.DB
}

// NewRangeValidator creates a new range validator instance
func NewRangeValidator(db *gorm.DB) *RangeValidator {
	return &RangeValidator{
		db: db,
	}
}

// ValidateAndSanitizeRange validates and sanitizes a new rider range
// This function implements the business logic for range validation:
// - Prevents overlaps by adjusting start values
// - Allows intentional gaps
// - Ensures end > start
// - Provides detailed feedback on adjustments

func (rv *RangeValidator) ValidateAndSanitizeRange(riderID string, input RangeInput, excludeRangeID *string) (*RangeValidationResult, error) {
	result := &RangeValidationResult{
		IsValid:          true,
		SanitizedStart:   input.StartKm,
		SanitizedEnd:     input.EndKm,
		HasGap:           false,
		GapSize:          0,
		WasStartAdjusted: false,
		Message:          "Range is valid",
	}

	// Step 1: Basic validation - ensure end > start
	if input.EndKm <= input.StartKm {
		result.IsValid = false
		result.Message = "End value must be greater than start value"
		return result, nil
	}

	// Step 2: Basic validation - ensure positive values
	if input.StartKm < 0 || input.EndKm < 0 {
		result.IsValid = false
		result.Message = "Range values must be non-negative"
		return result, nil
	}

	// Step 3: Basic validation - ensure reasonable price
	if input.Price <= 0 {
		result.IsValid = false
		result.Message = "Price must be greater than 0"
		return result, nil
	}

	// Step 4: Get the last saved range for this rider
	var lastRange model.RiderRange
	query := rv.db.Where("rider_id = ?", riderID)
	
	// If we're updating an existing range, exclude it from the query
	if excludeRangeID != nil {
		query = query.Where("id != ?", *excludeRangeID)
	}
	
	err := query.Order("end_km DESC").First(&lastRange).Error
	
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			// This is the first range for this rider - no validation needed
			result.Message = "First range created successfully"
			return result, nil
		}
		return nil, fmt.Errorf("failed to get last range: %w", err)
	}

	lastEnd := lastRange.EndKm
	
	// Step 5: Check for overlap and sanitize if necessary
	if input.StartKm < lastEnd {
		// Overlap detected - sanitize by setting start to lastEnd
		result.SanitizedStart = lastEnd
		result.WasStartAdjusted = true
		result.Message = fmt.Sprintf("Start value adjusted from %.2f to %.2f to prevent overlap", input.StartKm, lastEnd)
		
		// Re-validate that end > sanitized start
		if input.EndKm <= result.SanitizedStart {
			result.IsValid = false
			result.Message = fmt.Sprintf("After adjusting start to %.2f, end value %.2f is not greater than start", result.SanitizedStart, input.EndKm)
			return result, nil
		}
	} else if input.StartKm > lastEnd {
		// Gap detected - this is allowed but we'll note it
		result.HasGap = true
		result.GapSize = input.StartKm - lastEnd
		result.Message = fmt.Sprintf("Range created with intentional gap of %.2f km (%.2f to %.2f)", result.GapSize, lastEnd, input.StartKm)
	} else {
		// Perfect continuation - start equals last end
		result.Message = "Range continues seamlessly from previous range"
	}

	// Step 6: Check for overlaps with any existing ranges (not just the last one)
	var overlappingRanges []model.RiderRange
	overlapQuery := rv.db.Where("rider_id = ?", riderID).
		Where("(start_km < ? AND end_km > ?) OR (start_km < ? AND end_km > ?)", 
			result.SanitizedEnd, result.SanitizedStart,
			result.SanitizedStart, result.SanitizedEnd)
	
	if excludeRangeID != nil {
		overlapQuery = overlapQuery.Where("id != ?", *excludeRangeID)
	}
	
	if err := overlapQuery.Find(&overlappingRanges).Error; err != nil {
		return nil, fmt.Errorf("failed to check for overlapping ranges: %w", err)
	}

	if len(overlappingRanges) > 0 {
		result.IsValid = false
		result.Message = fmt.Sprintf("Range conflicts with %d existing range(s)", len(overlappingRanges))
		return result, nil
	}

	return result, nil
}

// ValidateRangeBatch validates multiple ranges at once
func (rv *RangeValidator) ValidateRangeBatch(riderID string, ranges []RangeInput) ([]RangeValidationResult, error) {
	results := make([]RangeValidationResult, len(ranges))
	
	for i, rangeInput := range ranges {
		result, err := rv.ValidateAndSanitizeRange(riderID, rangeInput, nil)
		if err != nil {
			return nil, fmt.Errorf("failed to validate range %d: %w", i, err)
		}
		results[i] = *result
	}
	
	return results, nil
}

// GetRiderRangeStats calculates comprehensive statistics for a rider's ranges
func (rv *RangeValidator) GetRiderRangeStats(riderID string) (*RangeStats, error) {
	var ranges []model.RiderRange
	if err := rv.db.Where("rider_id = ?", riderID).Order("start_km ASC").Find(&ranges).Error; err != nil {
		return nil, fmt.Errorf("failed to get rider ranges: %w", err)
	}

	stats := &RangeStats{
		TotalRanges:   len(ranges),
		TotalCoverage: 0,
		Gaps:          []Gap{},
		MaxPrice:      0,
		MinPrice:      0,
		AveragePrice:  0,
	}

	if len(ranges) == 0 {
		return stats, nil
	}

	// Calculate statistics
	var totalPrice float64
	stats.MinPrice = ranges[0].Price
	stats.MaxPrice = ranges[0].Price

	for i, r := range ranges {
		totalPrice += r.Price
		
		if r.Price > stats.MaxPrice {
			stats.MaxPrice = r.Price
		}
		if r.Price < stats.MinPrice {
			stats.MinPrice = r.Price
		}

		// Check for gaps
		if i > 0 {
			previousEnd := ranges[i-1].EndKm
			currentStart := r.StartKm
			
			if currentStart > previousEnd {
				stats.Gaps = append(stats.Gaps, Gap{
					StartKm: previousEnd,
					EndKm:   currentStart,
					Size:    currentStart - previousEnd,
				})
			}
		}
	}

	stats.AveragePrice = totalPrice / float64(len(ranges))
	if len(ranges) > 0 {
		stats.TotalCoverage = ranges[len(ranges)-1].EndKm - ranges[0].StartKm
	}

	return stats, nil
}

// ValidateRangeOrder ensures ranges are in proper sequence
func (rv *RangeValidator) ValidateRangeOrder(riderID string) ([]string, error) {
	var ranges []model.RiderRange
	if err := rv.db.Where("rider_id = ?", riderID).Order("start_km ASC").Find(&ranges).Error; err != nil {
		return nil, fmt.Errorf("failed to get rider ranges: %w", err)
	}

	var issues []string
	
	for i := 1; i < len(ranges); i++ {
		prev := ranges[i-1]
		curr := ranges[i]
		
		// Check for overlaps
		if curr.StartKm < prev.EndKm {
			issues = append(issues, fmt.Sprintf("Range %s (%.2f-%.2f) overlaps with range %s (%.2f-%.2f)", 
				curr.ID, curr.StartKm, curr.EndKm, prev.ID, prev.StartKm, prev.EndKm))
		}
		
		// Check for invalid range (start >= end)
		if curr.StartKm >= curr.EndKm {
			issues = append(issues, fmt.Sprintf("Range %s has invalid bounds: start %.2f >= end %.2f", 
				curr.ID, curr.StartKm, curr.EndKm))
		}
	}
	
	return issues, nil
}

// SanitizeAllRanges fixes overlaps in all ranges for a rider
func (rv *RangeValidator) SanitizeAllRanges(riderID string) (int, error) {
	var ranges []model.RiderRange
	if err := rv.db.Where("rider_id = ?", riderID).Order("start_km ASC").Find(&ranges).Error; err != nil {
		return 0, fmt.Errorf("failed to get rider ranges: %w", err)
	}

	sanitizedCount := 0
	
	for i := 1; i < len(ranges); i++ {
		prev := ranges[i-1]
		curr := &ranges[i]
		
		// Fix overlap by adjusting current range start
		if curr.StartKm < prev.EndKm {
			curr.StartKm = prev.EndKm
			
			// Ensure the range is still valid
			if curr.StartKm >= curr.EndKm {
				// If adjustment makes range invalid, extend the end
				curr.EndKm = curr.StartKm + 1.0 // Add 1km minimum
			}
			
			// Save the sanitized range
			if err := rv.db.Save(curr).Error; err != nil {
				return sanitizedCount, fmt.Errorf("failed to save sanitized range %s: %w", curr.ID, err)
			}
			
			sanitizedCount++
		}
	}
	
	return sanitizedCount, nil
}

// GetRangeGaps returns all gaps between ranges for a rider
func (rv *RangeValidator) GetRangeGaps(riderID string) ([]Gap, error) {
	var ranges []model.RiderRange
	if err := rv.db.Where("rider_id = ?", riderID).Order("start_km ASC").Find(&ranges).Error; err != nil {
		return nil, fmt.Errorf("failed to get rider ranges: %w", err)
	}

	var gaps []Gap
	
	for i := 1; i < len(ranges); i++ {
		prev := ranges[i-1]
		curr := ranges[i]
		
		if curr.StartKm > prev.EndKm {
			gaps = append(gaps, Gap{
				StartKm: prev.EndKm,
				EndKm:   curr.StartKm,
				Size:    curr.StartKm - prev.EndKm,
			})
		}
	}
	
	return gaps, nil
}

// FindOptimalPrice suggests a price for a new range based on existing ranges
func (rv *RangeValidator) FindOptimalPrice(riderID string, startKm, endKm float64) (float64, error) {
	var ranges []model.RiderRange
	if err := rv.db.Where("rider_id = ?", riderID).Order("start_km ASC").Find(&ranges).Error; err != nil {
		return 0, fmt.Errorf("failed to get rider ranges: %w", err)
	}

	if len(ranges) == 0 {
		// No existing ranges, suggest a base price
		return 5.0, nil
	}

	// Calculate average price per km from existing ranges
	var totalPricePerKm float64
	var validRanges int
	
	for _, r := range ranges {
		if r.EndKm > r.StartKm {
			pricePerKm := r.Price / (r.EndKm - r.StartKm)
			totalPricePerKm += pricePerKm
			validRanges++
		}
	}
	
	if validRanges == 0 {
		return 5.0, nil
	}
	
	avgPricePerKm := totalPricePerKm / float64(validRanges)
	suggestedPrice := avgPricePerKm * (endKm - startKm)
	
	// Round to nearest 0.5
	return float64(int(suggestedPrice*2+0.5)) / 2, nil
}