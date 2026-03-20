package worker

import (
	"context"
	"log"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/hibiken/asynq"
	"github.com/subscan/api/internal/config"
	"github.com/subscan/api/internal/database"
	"github.com/subscan/api/internal/models"

	"github.com/projectdiscovery/subfinder/v2/pkg/runner"
)

type Scanner struct {
	cfg     *config.Config
	runner  *runner.Runner
}

func NewScanner(cfg *config.Config) (*Scanner, error) {
	sources := strings.Split(cfg.SubfinderSources, ",")
	runnerOpts := runner.Config{
		Sources:    sources,
		Timeout:    cfg.SubfinderTimeout,
		AllSources: true,
	}

	r, err := runner.NewRunner(runnerOpts)
	if err != nil {
		return nil, err
	}

	return &Scanner{
		cfg:    cfg,
		runner: r,
	}, nil
}

type ScanTask struct {
	ScanID uuid.UUID `json:"scan_id"`
	Domain string    `json:"domain"`
}

func (s *Scanner) ProcessScan(ctx context.Context, task *asynq.Task) error {
	var payload ScanTask
	if err := task.UnmarshalPayload(&payload); err != nil {
		return err
	}

	log.Printf("Starting scan for domain: %s (scan_id: %s)", payload.Domain, payload.ScanID)

	// Update scan status to running
	db := database.GetDB()
	var scan models.Scan
	if err := db.First(&scan, "id = ?", payload.ScanID).Error; err != nil {
		log.Printf("Failed to find scan: %v", err)
		return err
	}

	scan.Status = models.StatusRunning
	db.Save(&scan)

	// Collect subdomains via callback
	var foundSubdomains []string
	var sourcesQueried int

	s.runner.FindAllDomainsWithCallback(
		context.Background(),
		payload.Domain,
		func(subdomain string) {
			foundSubdomains = append(foundSubdomains, subdomain)
			// Save subdomain to database
			sub := models.Subdomain{
				ScanID:    payload.ScanID,
				Subdomain: subdomain,
			}
			db.Create(&sub)

			// Publish SSE event
			PublishSubdomain(payload.ScanID, subdomain)
		},
	)

	sourcesQueried = len(strings.Split(s.cfg.SubfinderSources, ","))

	// Update scan as completed
	now := time.Now()
	scan.Status = models.StatusCompleted
	scan.TotalFound = len(foundSubdomains)
	scan.SourcesQueried = sourcesQueried
	scan.CompletedAt = &now
	db.Save(&scan)

	log.Printf("Scan completed for %s: found %d subdomains", payload.Domain, len(foundSubdomains))

	return nil
}

// PublishSubdomain publishes a subdomain found event for SSE
func PublishSubdomain(scanID uuid.UUID, subdomain string) {
	// This will be handled by the SSE manager
	if sseManager != nil {
		sseManager.Send(scanID, subdomain)
	}
}