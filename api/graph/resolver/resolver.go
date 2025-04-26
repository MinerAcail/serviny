package graph

import (
	"github.com/minio/minio-go/v7"
	"gorm.io/gorm"
)

type Resolver struct {
	DB          *gorm.DB
	MinIOClient *minio.Client
}
