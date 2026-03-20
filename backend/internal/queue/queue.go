package queue

import (
	"context"
	"fmt"

	"github.com/google/uuid"
	"github.com/hibiken/asynq"
	"github.com/subscan/api/internal/config"
	"github.com/subscan/api/internal/worker"
)

var Client *asynq.Client
var Server *asynq.Server
var Inspector *asynq.Inspector

func Connect(cfg *config.Config) error {
	// Parse Redis URL
	redisAddr := "localhost:6379"
	if cfg.RedisURL != "" {
		// Extract host:port from redis://host:port
		redisAddr = cfg.RedisURL
		redisAddr = fmt.Sprintf("%s", cfg.RedisURL[len("redis://"):])
	}

	// Create Asynq server
	Server = asynq.NewServer(
		asynq.RedisAddrOpt(redisAddr),
		asynq.MaxConcurrency(10),
		asynq.MaxRetry(3),
	)

	// Create Asynq client
	Client = asynq.NewClient(
		asynq.RedisAddrOpt(redisAddr),
	)

	// Create inspector
	Inspector = asynq.NewInspector(
		asynq.RedisAddrOpt(redisAddr),
	)

	return nil
}

func EnqueueScan(scanID uuid.UUID, domain string) error {
	task := worker.ScanTask{
		ScanID: scanID,
		Domain: domain,
	}

	payload, err := task.Marshal()
	if err != nil {
		return err
	}

	taskInfo := asynq.NewTask(
		"scan",
		payload,
		asynq.MaxRetry(3),
		asynq.Timeout(10*60), // 10 minutes timeout
	)

	_, err = Client.Enqueue(taskInfo)
	return err
}

func GetQueueStats() (*asynq.Stats, error) {
	return Inspector.GlobalQueueStats()
}

func Shutdown() {
	if Server != nil {
		Server.Shutdown()
	}
	if Client != nil {
		Client.Close()
	}
	if Inspector != nil {
		Inspector.Close()
	}
}

func StartWorker(worker *worker.Scanner) error {
	mux := asynq.NewServeMux()
	mux.Handle("scan", worker)

	return Server.Run(mux)
}

func GetTaskInfo(taskID string) (*asynq.TaskInfo, error) {
	return Inspector.GetTaskInfo("", taskID)
}

func DeleteTask(taskID string) error {
	return Inspector.DeleteTask("", taskID)
}