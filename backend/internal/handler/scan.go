package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/subscan/api/internal/database"
	"github.com/subscan/api/internal/models"
	"github.com/subscan/api/internal/queue"
)

type ScanRequest struct {
	Domain string `json:"domain" binding:"required,hostname"`
}

type ScanResponse struct {
	JobID   uuid.UUID `json:"job_id"`
	ScanID  uuid.UUID `json:"scan_id"`
	ShareID string    `json:"share_id"`
	Status  string    `json:"status"`
}

// CreateScan godoc
// @Summary Create a new scan job
// @Description Create a new subdomain scan job
// @Tags scan
// @Accept json
// @Produce json
// @Param scan body ScanRequest true "Scan request"
// @Success 202 {object} ScanResponse
// @Router /api/v1/scan [post]
func CreateScan(c *gin.Context) {
	var req ScanRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Create scan record in database
	db := database.GetDB()
	scan := models.Scan{
		Domain:  req.Domain,
		Status:  models.StatusPending,
	}

	if err := db.Create(&scan).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create scan"})
		return
	}

	// Enqueue the scan task
	if err := queue.EnqueueScan(scan.ID, scan.Domain); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to enqueue scan"})
		return
	}

	c.JSON(http.StatusAccepted, ScanResponse{
		JobID:   scan.ID, // Same as scan.ID for our use case
		ScanID:  scan.ID,
		ShareID: scan.ShareID,
		Status:  scan.Status,
	})
}

// GetScanResults godoc
// @Summary Get scan results by share ID
// @Description Retrieve scan results using shareable ID
// @Tags results
// @Produce json
// @Param share_id path string true "Share ID"
// @Success 200 {object} models.Scan
// @Router /api/v1/results/{share_id} [get]
func GetScanResults(c *gin.Context) {
	shareID := c.Param("share_id")

	db := database.GetDB()
	var scan models.Scan
	if err := db.Preload("Subdomains").First(&scan, "share_id = ?", shareID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Scan not found"})
		return
	}

	c.JSON(http.StatusOK, scan)
}

// GetScanStatus godoc
// @Summary Get scan status
// @Description Get the current status of a scan
// @Tags scan
// @Produce json
// @Param job_id path string true "Job ID"
// @Success 200 {object} ScanResponse
// @Router /api/v1/scan/{job_id} [get]
func GetScanStatus(c *gin.Context) {
	jobID := c.Param("job_id")

	scanID, err := uuid.Parse(jobID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid job ID"})
		return
	}

	db := database.GetDB()
	var scan models.Scan
	if err := db.First(&scan, "id = ?", scanID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Scan not found"})
		return
	}

	c.JSON(http.StatusOK, ScanResponse{
		JobID:   scan.ID,
		ScanID:  scan.ID,
		ShareID: scan.ShareID,
		Status:  scan.Status,
	})
}