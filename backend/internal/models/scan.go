package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Scan struct {
	ID              uuid.UUID      `json:"id" gorm:"type:uuid;primary_key;default:gen_random_uuid()"`
	Domain          string         `json:"domain" gorm:"type:varchar(255);not null"`
	ShareID         string         `json:"share_id" gorm:"type:varchar(36);uniqueIndex"`
	Status          string         `json:"status" gorm:"type:varchar(20);default:'pending'"`
	TotalFound      int            `json:"total_found" gorm:"default:0"`
	SourcesQueried  int            `json:"sources_queried" gorm:"default:0"`
	CreatedAt       time.Time      `json:"created_at" gorm:"default:CURRENT_TIMESTAMP"`
	CompletedAt     *time.Time     `json:"completed_at"`
	Subdomains      []Subdomain    `json:"subdomains,omitempty" gorm:"foreignKey:ScanID"`
}

func (s *Scan) BeforeCreate(tx *gorm.DB) error {
	if s.ID == uuid.Nil {
		s.ID = uuid.New()
	}
	if s.ShareID == "" {
		s.ShareID = uuid.New().String()
	}
	return nil
}

type Subdomain struct {
	ID           uuid.UUID `json:"id" gorm:"type:uuid;primary_key;default:gen_random_uuid()"`
	ScanID       uuid.UUID `json:"scan_id" gorm:"type:uuid;not null;index"`
	Subdomain    string    `json:"subdomain" gorm:"type:varchar(255);not null;index"`
	IPAddress    string    `json:"ip_address" gorm:"type:varchar(45)"`
	HTTPStatus   *int      `json:"http_status"`
	DiscoveredAt time.Time `json:"discovered_at" gorm:"default:CURRENT_TIMESTAMP"`
}

func (s *Subdomain) BeforeCreate(tx *gorm.DB) error {
	if s.ID == uuid.Nil {
		s.ID = uuid.New()
	}
	return nil
}

// ScanStatus constants
const (
	StatusPending   = "pending"
	StatusRunning   = "running"
	StatusCompleted = "completed"
	StatusFailed    = "failed"
)