package main

import (
	"log"
	"os"
	"os/signal"
	"syscall"

	"github.com/subscan/api/internal/config"
	"github.com/subscan/api/internal/database"
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

	// Create scanner
	scanner, err := worker.NewScanner(cfg)
	if err != nil {
		log.Fatalf("Failed to create scanner: %v", err)
	}

	// Handle graceful shutdown
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)

	go func() {
		<-quit
		log.Println("Shutting down worker...")
		queue.Shutdown()
		log.Println("Worker exited")
		os.Exit(0)
	}()

	log.Println("Starting worker...")

	// Start processing tasks
	if err := queue.StartWorker(scanner); err != nil {
		log.Fatalf("Worker failed: %v", err)
	}
}