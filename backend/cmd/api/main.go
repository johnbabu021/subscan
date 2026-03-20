package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/subscan/api/internal/config"
	"github.com/subscan/api/internal/database"
	"github.com/subscan/api/internal/handler"
	"github.com/subscan/api/internal/middleware"
	"github.com/subscan/api/internal/queue"
	"github.com/subscan/api/internal/worker"
)

func main() {
	// Load configuration
	cfg := config.Load()

	// Connect to database
	if err := database.Connect(cfg.DatabaseURL); err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	// Connect to Redis for Asynq
	if err := queue.Connect(cfg); err != nil {
		log.Fatalf("Failed to connect to Redis: %v", err)
	}

	// Initialize SSE manager
	worker.InitSSE()

	// Setup router
	router := setupRouter(cfg)

	// Start server
	srv := &http.Server{
		Addr:    ":" + cfg.Port,
		Handler: router,
	}

	// Graceful shutdown
	go func() {
		log.Printf("Server starting on port %s", cfg.Port)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Failed to start server: %v", err)
		}
	}()

	// Wait for interrupt signal
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Println("Shutting down server...")

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		log.Fatalf("Server forced to shutdown: %v", err)
	}

	queue.Shutdown()
	log.Println("Server exited")
}

func setupRouter(cfg *config.Config) *gin.Engine {
	if gin.Mode() == gin.ReleaseMode {
		gin.SetMode(gin.ReleaseMode)
	}

	router := gin.Default()

	// CORS middleware
	router.Use(func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	})

	// Health check (no rate limit)
	router.GET("/api/v1/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok", "service": "subscan-api"})
	})

	// API routes with rate limiting
	api := router.Group("/api/v1")
	api.Use(middleware.RateLimit(30, time.Minute)) // 30 requests per minute
	{
		api.POST("/scan", handler.CreateScan)
		api.GET("/scan/:job_id", handler.GetScanStatus)
		api.GET("/scan/:job_id/stream", handler.StreamScan)
		api.GET("/results/:share_id", handler.GetScanResults)
	}

	return router
}