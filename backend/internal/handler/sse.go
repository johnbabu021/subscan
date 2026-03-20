package handler

import (
	"fmt"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/subscan/api/internal/worker"
)

// StreamScan godoc
// @Summary Stream scan results via SSE
// @Description Stream subdomain discoveries in real-time
// @Tags scan
// @Produce text/event-stream
// @Param job_id path string true "Job ID"
// @Success 200 {string} text/event-stream
// @Router /api/v1/scan/{job_id}/stream [get]
func StreamScan(c *gin.Context) {
	jobID := c.Param("job_id")

	scanID, err := uuid.Parse(jobID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid job ID"})
		return
	}

	// Set SSE headers
	c.Header("Content-Type", "text/event-stream")
	c.Header("Cache-Control", "no-cache")
	c.Header("Connection", "keep-alive")
	c.Header("X-Accel-Buffering", "no")

	// Subscribe to SSE
	sseManager := worker.GetSSEManager()
	ch := sseManager.Subscribe(scanID)
	defer sseManager.Unsubscribe(scanID, ch)

	// Send initial connection message
	c.Writer.Write([]byte("data: {\"type\":\"connected\",\"message\":\"Connected to scan stream\"}\n\n"))
	c.Writer.Flush()

	// Send keep-alive every 30 seconds
	ticker := time.NewTicker(30 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-c.Request.Context().Done():
			return
		case data := <-ch:
			fmt.Fprintf(c.Writer, data)
			c.Writer.Flush()
		case <-ticker.C:
			fmt.Fprintf(c.Writer, ": heartbeat\n\n")
			c.Writer.Flush()
		}
	}
}