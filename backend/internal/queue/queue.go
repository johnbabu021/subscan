package queue

import (
	"encoding/json"

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
	if cfg.RedisURL != "" && len(cfg.RedisURL) > len("redis://") {
		redisAddr = cfg.RedisURL[len("redis://"):]
	}

	// Create Asynq server
	Server = asynq.NewServer(
		asynq.RedisClientOpt{
			Addr: redisAddr,
		},
		asynq.Config{
			Concurrency: 10,
		},
	)

	// Create Asynq client
	Client = asynq.NewClient(
		asynq.RedisClientOpt{
			Addr: redisAddr,
		},
	)

	// Create inspector
	Inspector = asynq.NewInspector(
		asynq.RedisClientOpt{
			Addr: redisAddr,
		},
	)

	return nil
}

func EnqueueScan(scanID uuid.UUID, domain string) error {
	task := worker.ScanTask{
		ScanID: scanID,
		Domain: domain,
	}

	payload, err := json.Marshal(task)
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
	mux.HandleFunc("scan", worker.ProcessScan)

	return Server.Run(mux)
}