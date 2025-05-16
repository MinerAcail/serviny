package graph

import (
	// "github.com/lehxees/serviny/database/otp"
	"github.com/redis/go-redis/v9"

	"github.com/minio/minio-go/v7"
	"gorm.io/gorm"
)
// var OtpStore = otp.NewOtpStore()

type Resolver struct {
	DB          *gorm.DB
	MinIOClient *minio.Client
	RedisClient *redis.Client
	
}


