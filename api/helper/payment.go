package helper

import (
	"context"

	"github.com/lehxees/serviny/graph/model"
	"gorm.io/gorm"
)

// Helper function to apply payment filters
func  ApplyPaymentFilters(query *gorm.DB, filter *model.PaymentFilter) *gorm.DB {
	if filter.OrderID != nil {
		query = query.Where("order_id = ?", *filter.OrderID)
	}
	
	if filter.Status != nil {
		query = query.Where("status = ?", *filter.Status)
	}
	
	if filter.Method != nil {
		query = query.Where("method = ?", *filter.Method)
	}
	
	if filter.CustomerEmail != nil {
		query = query.Where("customer_email ILIKE ?", "%"+*filter.CustomerEmail+"%")
	}
	
	if filter.AmountRange != nil {
		if filter.AmountRange.Min != nil {
			query = query.Where("amount >= ?", *filter.AmountRange.Min)
		}
		if filter.AmountRange.Max != nil {
			query = query.Where("amount <= ?", *filter.AmountRange.Max)
		}
	}
	
	if filter.DateRange != nil {
		if filter.DateRange.From != nil {
			query = query.Where("created_at >= ?", *filter.DateRange.From)
		}
		if filter.DateRange.To != nil {
			query = query.Where("created_at <= ?", *filter.DateRange.To)
		}
	}
	
	return query
}

// Helper function to build order clause
func  BuildPaymentOrderClause(orderBy *model.PaymentOrderBy) string {
	field := ""
	switch orderBy.Field {
	case model.PaymentOrderFieldCreatedAt:
		field = "created_at"
	case model.PaymentOrderFieldPaidAt:
		field = "paid_at"
	case model.PaymentOrderFieldAmount:
		field = "amount"
	case model.PaymentOrderFieldStatus:
		field = "status"
	default:
		field = "created_at"
	}
	
	direction := "DESC"
	if orderBy.Direction == model.OrderDirectionAsc {
		direction = "ASC"
	}
	
	return field + " " + direction
}

// Computed field resolvers for Payment type

// IsSuccessful resolver
func  IsSuccessful(ctx context.Context, obj *model.Payment) (bool, error) {
	return obj.Status == model.PaymentStatusSuccess, nil
}

// IsPending resolver
func  IsPending(ctx context.Context, obj *model.Payment) (bool, error) {
	return obj.Status == model.PaymentStatusPending, nil
}

// IsFailed resolver
func  IsFailed(ctx context.Context, obj *model.Payment) (bool, error) {
	return obj.Status == model.PaymentStatusFailed, nil
}

// IsRefunded resolver
func  IsRefunded(ctx context.Context, obj *model.Payment) (bool, error) {
	return obj.Status == model.PaymentStatusRefunded, nil
}
