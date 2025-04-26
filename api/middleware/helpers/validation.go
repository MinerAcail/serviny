package helpers

import (
	"errors"
	"fmt"
	"math/rand"

	"golang.org/x/crypto/bcrypt"
)

var JwtSecret = []byte("happytime") // Replace this with your own secret key

func HashPassword(password string) (string, error) {
	bytes, err := bcrypt.GenerateFromPassword([]byte(password), 10)
	if err != nil {
		return "", err
	}
	return string(bytes), nil
}

func VerifyPassword(hashedPassword string, inputPassword string) error {
	err := bcrypt.CompareHashAndPassword([]byte(hashedPassword), []byte(inputPassword))
	if err != nil {
		return errors.New("email or password is incorrect")
	}
	return nil
}

func GenerateRandomPassword(length int) string {
	// Define a character set for the password
	charset := "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
	password := make([]byte, length)

	// Generate the password
	for i := range password {
		password[i] = charset[rand.Intn(len(charset))]
	}

	return string(password)
}

func GenerateRandomEmail(domain string, username string) string {
	// username := GenerateRandomPassword(6) // Generate a random username
	return fmt.Sprintf("%s@%s", username, domain)
}


// func (r *mutationResolver) AddCategory(ctx context.Context, groupLabel string, quantityForAGroupLabel int, cartItemID string) (*model.CartItem, error) {
// 	// Get the user ID from the context
// 	userIDStr, err := r.Query().GetID(ctx)
// 	if err != nil {
// 		return nil, fmt.Errorf("failed to get user ID: %v", err)
// 	}

// 	// Parse the user ID as a UUID
// 	userUUID, err := uuid.Parse(*userIDStr)
// 	if err != nil {
// 		return nil, fmt.Errorf("invalid user ID: %w", err)
// 	}

// 	// Parse the CartItemID as UUID
//     cartItemUUID, err := uuid.Parse(cartItemID)
//     if err != nil {
//         return nil, fmt.Errorf("invalid CartItemID: %w", err)
// 	}

// 	// Fetch the user's cart
// 	var cart model.Cart
// 	if err := r.DB.Where("user_id = ?", userUUID).First(&cart).Error; err != nil {
// 		return nil, fmt.Errorf("failed to find cart: %w", err)
// 	}

// 	var cartItem model.CartItem

// 	if err := r.DB.Where("id = ? AND group_label = ?", cartItemID, groupLabel).First(&cartItem).Error; err != nil {
// 		if gorm.ErrRecordNotFound == err {
// 			groupLabelIDUUID, err := uuid.NewUUID()
// 			if err != nil {
// 				return nil, fmt.Errorf("failed to create group label ID: %w", err)
// 			}

// 			cartItem = model.CartItem{
// 				GroupLabel:             groupLabel,
// 				GroupLabelID:           groupLabelIDUUID.String(),
// 				QuantityForAGroupLabel: quantityForAGroupLabel,
// 			}

// 			if err := r.DB.Save(&cartItem).Error; err != nil {
// 				return nil, fmt.Errorf("failed to create label item: %w", err)
// 			}

// 			return &cartItem, nil
// 		} else {
// 			return nil, fmt.Errorf("failed to find label item: %w", err)
// 		}
// 	}
// 	// fatch  quantity
// 	var quantityOfthatCartItemProduct model.CartItem
// 	if err := r.DB.Where("id = ? AND group_label_id = ? AND product_id = ?", cartItemID, cartItem.GroupLabelID, cartItem.ProductID).First(&quantityOfthatCartItemProduct).Error; err != nil {
// 		return nil, fmt.Errorf("failed to find quantity of that cart item product: %w", err)
// 	}
// 	if quantityOfthatCartItemProduct.QuantityForAGroupLabel != 0 {
// 		quantityOfthatCartItemProduct.QuantityForAGroupLabel += quantityForAGroupLabel
// 	}
// 	//if the group label is not found then create a new label in cartItem with the found group label
// 	cartItem = model.CartItem{
// 		GroupLabel:             cartItem.GroupLabel,
// 		GroupLabelID:           cartItem.GroupLabelID,
// 		QuantityForAGroupLabel: quantityForAGroupLabel,
// 	}

// 	if err := r.DB.Save(&cartItem).Error; err != nil {
// 		return nil, fmt.Errorf("failed to create label item: %w", err)
// 	}

// 	return &cartItem, nil
// }