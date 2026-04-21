package worker

import (
	"context"
	"encoding/json"
	"log"
	"strings"
	"sync"
	"time"

	"github.com/google/uuid"
	"github.com/hibiken/asynq"
	"github.com/subscan/api/internal/config"
	"github.com/subscan/api/internal/database"
	"github.com/subscan/api/internal/models"

	"github.com/projectdiscovery/subfinder/v2/pkg/runner"
	"github.com/projectdiscovery/subfinder/v2/pkg/resolve"
)

type Scanner struct {
	cfg *config.Config
}

func NewScanner(cfg *config.Config) (*Scanner, error) {
	return &Scanner{cfg: cfg}, nil
}

type ScanTask struct {
	ScanID uuid.UUID `json:"scan_id"`
	Domain string    `json:"domain"`
}

func (s *Scanner) ProcessScan(ctx context.Context, task *asynq.Task) error {
	var payload ScanTask
	if err := json.Unmarshal(task.Payload(), &payload); err != nil {
		log.Printf("Failed to unmarshal task payload: %v", err)
		return err
	}

	log.Printf("Starting scan for domain: %s (scan_id: %s)", payload.Domain, payload.ScanID)

	// Get database connection
	db := database.GetDB()
	if db == nil {
		log.Printf("ERROR: Database connection is nil!")
		return nil
	}

	// Update scan status to running
	var scan models.Scan
	if err := db.First(&scan, "id = ?", payload.ScanID).Error; err != nil {
		log.Printf("Failed to find scan: %v", err)
		return err
	}

	scan.Status = models.StatusRunning
	if err := db.Save(&scan).Error; err != nil {
		log.Printf("Failed to save scan status: %v", err)
	}

	// Thread-safe collection of results
	var mu sync.Mutex
	var foundSubdomains []string
	sources := strings.Split(s.cfg.SubfinderSources, ",")

	log.Printf("Running subfinder with sources: %v", sources)

	// Create runner with ResultCallback to capture results in real-time
	r, err := runner.NewRunner(&runner.Options{
		Sources:    sources,
		Timeout:    s.cfg.SubfinderTimeout,
		All:        true,
		Silent:     true,
		ResultCallback: func(entry *resolve.HostEntry) {
			mu.Lock()
			foundSubdomains = append(foundSubdomains, entry.Host)
			mu.Unlock()

			log.Printf("Found subdomain: %s from %s", entry.Host, entry.Source)

			// Save subdomain to database
			sub := models.Subdomain{
				ScanID:    payload.ScanID,
				Subdomain: entry.Host,
			}
			if err := db.Create(&sub).Error; err != nil {
				log.Printf("ERROR: Failed to save subdomain %s: %v", entry.Host, err)
			} else {
				log.Printf("Saved subdomain to DB: %s", entry.Host)
			}

			// Publish SSE event for real-time update
			PublishSubdomain(payload.ScanID, entry.Host)
		},
	})
	if err != nil {
		log.Printf("Failed to create runner: %v", err)
		return err
	}

	// Run enumeration
	waitCtx, cancel := context.WithTimeout(context.Background(), time.Duration(s.cfg.SubfinderTimeout)*time.Second)
	defer cancel()

	err = r.EnumerateSingleDomainWithCtx(waitCtx, payload.Domain, nil)
	if err != nil {
		log.Printf("Enumeration error: %v", err)
	}

	// Get final count
	mu.Lock()
	totalFound := len(foundSubdomains)
	mu.Unlock()

	log.Printf("Scan finished. Found %d subdomains", totalFound)

	// Update scan as completed
	var finalScan models.Scan
	if err := db.First(&finalScan, "id = ?", payload.ScanID).Error; err != nil {
		log.Printf("Failed to find scan for final update: %v", err)
		return err
	}

	now := time.Now()
	finalScan.Status = models.StatusCompleted
	finalScan.TotalFound = totalFound
	finalScan.SourcesQueried = len(sources)
	finalScan.CompletedAt = &now

	if err := db.Save(&finalScan).Error; err != nil {
		log.Printf("Failed to save final scan status: %v", err)
	} else {
		log.Printf("Updated scan with total_found: %d", totalFound)
	}

	log.Printf("Scan completed for %s: found %d subdomains", payload.Domain, totalFound)

	return nil
}

// PublishSubdomain publishes a subdomain found event for SSE
func PublishSubdomain(scanID uuid.UUID, subdomain string) {
	// This will be handled by the SSE manager
	if sseManager != nil {
		sseManager.Send(scanID, subdomain)
	}
}