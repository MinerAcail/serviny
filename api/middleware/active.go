package middleware

import (
    "context"
    "fmt"
    "time"
    "github.com/redis/go-redis/v9"
)

var Ctx = context.Background()

func StartBackgroundJob(rdb *redis.Client) {
    ticker := time.NewTicker(1 * time.Minute) // Run every minute
    defer ticker.Stop()

    for range ticker.C {
        CheckOfflineUsers(rdb)
    }
}

// CheckOfflineUsers checks for inactive users in Redis and marks them offline
func CheckOfflineUsers(rdb *redis.Client) {
    fmt.Println("Checking for inactive users...")
    
    if rdb == nil {
        fmt.Println("Error: Redis client is nil")
        return
    }

    keys, err := rdb.Keys(Ctx, "worker:*").Result()
    if err != nil {
        fmt.Printf("Error fetching keys: %v\n", err)
        return
    }

    now := time.Now()
    for _, key := range keys {
        lastActiveStr, err := rdb.HGet(Ctx, key, "lastActive").Result()
        if err != nil {
            fmt.Printf("Error fetching lastActive for %s: %v\n", key, err)
            continue
        }

        lastActive, err := time.Parse(time.RFC3339, lastActiveStr)
        if err != nil {
            fmt.Printf("Error parsing lastActive for %s: %v\n", key, err)
            continue
        }

        // If user hasn't sent a heartbeat in 5 minutes, mark them offline
        if now.Sub(lastActive) > 5*time.Minute {
            fmt.Printf("User %s is inactive, marking as offline...\n", key)

            // Update Redis
            err := rdb.HSet(Ctx, key, "isActive", "false").Err()
            if err != nil {
                fmt.Printf("Error marking %s as offline: %v\n", key, err)
            }
        }
    }
}