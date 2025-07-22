package main

import (
	"fmt"
	"log"
	"net/http"
	"net/url"
	"os"
	"strings"

	"github.com/99designs/gqlgen/graphql/handler"
	// "github.com/99designs/gqlgen/graphql/playground"

	"github.com/go-chi/chi"
	"github.com/go-chi/cors"
	"github.com/lehxees/serviny/database"
	Paystack "github.com/lehxees/serviny/database/payment"
	"github.com/lehxees/serviny/database/redis"
	generated "github.com/lehxees/serviny/graph"
	"github.com/lehxees/serviny/graph/model"
	graph "github.com/lehxees/serviny/graph/resolver"

	"github.com/lehxees/serviny/helper"
	"github.com/lehxees/serviny/middleware"

	"gorm.io/gorm"
)

const defaultPort = "4003"

// PerformMigrations performs database migrations
func PerformMigrations(db *gorm.DB) error {
	// Read the init.sql file
	sqlFile, err := helper.ReadFile("database/init.sql")
	if err != nil {
		log.Fatalf("Err: %v", err)
	}
	// Execute the SQL commands in the file
	if err := db.Exec(string(sqlFile)).Error; err != nil {
		return fmt.Errorf("failed to execute SQL commands from init.sql: %w", err)
	}

	// Run GORM AutoMigrate for your models
	if err := db.AutoMigrate(
		&model.Product{},
		&model.CategoryBox{},

		&model.Favorite{},
		&model.SocialMedia{},

		&model.Rider{},
		&model.IsochroneResult{},
		&model.RidersRequest{},
		&model.Order{},
		&model.CartItem{},

		&model.RouteInfo{},
		&model.RiderRange{},
		&model.Form{},
		&model.FormField{},
		&model.FormField{},
		&model.FormSubmission{},

		&model.AppointmentBooking{},
		&model.BookingCargo{},

		&model.UserBookings{},
		&model.Category{},
		&model.InventoryItem{},
		&model.UnavailablePeriod{},
		&model.User{},
		&model.UserManager{},
		&model.SmsRecord{},
		&model.EventBookings{},
		&model.Event{},
		&model.Service{},
		&model.GalleryProfession{},
		&model.PolicyDetail{},
		&model.Policy{},
		&model.Amenity{},
		&model.PriceCard{},
		&model.Price{},
		&model.Booker{},
		&model.TimeSlot{},

		&model.BookingOrderPaymentStatus{},

		&model.Profiles{},
		&model.Invoice{},
		&model.BusinessType{},
		&model.PushSubscription{},
	); err != nil {
		return fmt.Errorf("failed to run AutoMigrate: %w", err)
	}

	// Read the configSearch.sql file
	sqlSearchFile, err := helper.ReadFile("database/configSearch.sql")
	if err != nil {
		log.Fatalf("Err: %v", err)
	}
	// Execute the SQL commands in the file
	if err := db.Exec(string(sqlSearchFile)).Error; err != nil {
		return fmt.Errorf("failed to execute SQL commands from configSearch.sql: %w", err)
	}
	return nil
}

func main() {
	port := os.Getenv("Port")
	if port == "" {
		port = defaultPort
	}

	//// Read environment variables
	dbUser := os.Getenv("UserName")
	dbPassword := os.Getenv("Password")
	dbName := os.Getenv("DBName")
	dbHost := os.Getenv("Host") // Use service name in Docker Compose
	dbPort := "5432"            // Default PostgreSQL port

	minioEndpoint := os.Getenv("MINIO_ENDPOINT")
	minioAccessKey := os.Getenv("MINIO_ACCESS_KEY")
	minioSecretKey := os.Getenv("MINIO_SECRET_KEY")
	// minioBucket := "your-bucket-name" // Replace with your 	 name

	// Configure database connection using database.Config
	config := &database.Config{
		Host:     dbHost,
		Port:     dbPort,
		User:     dbUser,
		Password: dbPassword,
		DBName:   dbName,
		SSLMode:  "disable", // Adjust SSLMode as per your PostgreSQL setup
	}

	// Establish database connection
	db, err := database.NewConnection(config)
	if err != nil {
		log.Fatal("failed to connect to the database:", err)
	}
	// Perform database migrations
	err = PerformMigrations(db)
	if err != nil {
		log.Fatal("failed to perform migrations:", err)
	}

	// Initialize MinIO client
	minioClient, err := helper.InitMinIO(minioEndpoint, minioAccessKey, minioSecretKey)
	if err != nil {
		log.Fatalf("failed to initialize MinIO client: %v", err)
	}
	redisClient := redis.ConfigureRedis()
	// Start the background job as a Goroutine

	resolver := &graph.Resolver{
		DB:          db,
		MinIOClient: minioClient,
		RedisClient: redisClient,
		Subscribers: make(map[string]chan []float64), // Initialize the subscribers map
	}

	// Initialize the GraphQL server
	router := chi.NewRouter()
	// Configure CORS
	// CORS config with dynamic subdomain support
	corsConfig := cors.New(cors.Options{
		AllowOriginFunc: func(r *http.Request, origin string) bool {
			u, err := url.Parse(origin)
			if err != nil {
				return false
			}
			host := u.Hostname()

			// Allow all http://* in dev, plus specific production domains
			if strings.HasPrefix(origin, "http://localhost") {
				return true
			}

			// Allow specific HTTPS production domains
			return host == "winnemart.com" || strings.HasSuffix(host, ".winnemart.com")
		},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type"},
		AllowCredentials: true,
	})

	router.Use(corsConfig.Handler)
	router.Use(middleware.Middleware)

	// router.Handle("/", playground.Handler("GraphQL playground", "/query"))
	// server := handler.NewDefaultServer(Resolvers: resolver)

	server := handler.NewDefaultServer(generated.NewExecutableSchema(generated.Config{Resolvers: resolver}))
	router.Handle("/query", server)

	// GET endpoint for testing in browser
	router.Get("/paystack/test", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("ok"))
		w.Write([]byte("✅ Paystack webhook endpoint is active!"))
	})

	// Paystack webhook route
	// paystackHandler := Paystack.NewPaystackHandler(db, redisClient)
	// graphqlEndpoint := fmt.Sprintf("http://localhost:%s", port)
	graphqlEndpoint := fmt.Sprintf("http://localhost:%s/query", port)
	// This creates: http://localhost:4003/query
	paystackHandler := Paystack.NewPaystackHandler(db, redisClient, graphqlEndpoint)

	router.Post("/paystack/webhook", paystackHandler.HandleWebhook)

	log.Printf("Connect to http://localhost:%s/ for GraphQL playground", port)
	log.Printf("Paystack webhook endpoint: http://localhost:%s/webhook/paystack", port)
	log.Fatal(http.ListenAndServe(":"+port, router))
}
