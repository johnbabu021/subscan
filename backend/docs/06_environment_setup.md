# 06: Local Environment Setup

This document provides instructions for setting up the development environment.

## 🐳 Running with Docker Compose

The easiest way to run the entire stack (API, Worker, PostgreSQL, Redis, and Frontend) is using Docker Compose.

```bash
docker-compose up --build
```

This command:
1.  Builds the backend and frontend images.
2.  Starts a PostgreSQL database container.
3.  Starts a Redis container for the task queue.
4.  Launches the API and Worker services.

## ⚙️ Environment Variables

The backend requires the following environment variables to function. These are configured in the `docker-compose.yml` file but can also be set in a `.env` file for local development.

| Variable | Example Value | Description |
| :--- | :--- | :--- |
| `DATABASE_URL` | `postgres://user:pass@db:5432/subscan` | PostgreSQL connection string |
| `REDIS_ADDR` | `redis:6379` | Redis address for Asynq |
| `PORT` | `8080` | Port for the API server |
| `GIN_MODE` | `release` or `debug` | The Gin framework mode |
| `SUBFINDER_SOURCES` | `crtsh,hackertarget,wayback` | Comma-separated list of Subfinder sources |
| `SUBFINDER_TIMEOUT`| `30` | Timeout in seconds for discovery |

## 🛠 Manual Setup (Optional)

If you wish to run the Go backend natively:
1.  Install Go 1.21+.
2.  Ensure PostgreSQL and Redis are running locally.
3.  Set the environment variables in your shell.
4.  Run `go run cmd/api/main.go` and `go run cmd/worker/main.go` in separate terminals.
