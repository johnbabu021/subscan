# 01: Structural Map (Packages & Imports)

This document explains the organization of the Go backend, its dependencies, and the reasoning behind its architectural choices.

## 📦 Module Breakdown (`go.mod`)

The `go.mod` file defines the project's identity (`github.com/subscan/api`) and its dependencies. For a developer new to Go, think of this as `package.json` (Node.js) or `requirements.txt` (Python).

Key dependencies and why they were chosen:
- **[gin](https://github.com/gin-gonic/gin)**: A high-performance HTTP web framework. It handles routing, middleware (like rate limiting), and JSON serialization with minimal overhead.
- **[gorm](https://gorm.io/)**: The "Fantastic ORM for Go". It abstracts SQL queries into Go structs, making database interactions type-safe and easier to manage.
- **[asynq](https://github.com/hibiken/asynq)**: A Redis-backed distributed task queue. It is used to process long-running subdomain scans in the background without blocking the API response.
- **[subfinder](https://github.com/projectdiscovery/subfinder)**: The core discovery engine. Instead of calling it as a CLI tool, we import it as a Go package for better performance and tighter integration.

## 📂 Project Layout

The project follows a standard Go project structure:

- **`cmd/`**: The entry points for the applications.
    - `cmd/api/main.go`: Starts the web server.
    - `cmd/worker/main.go`: Starts the background task processor.
- **`internal/`**: Contains private code that shouldn't be imported by other projects. This is where the core logic lives.
    - `internal/handler/`: HTTP request handlers (controllers).
    - `internal/database/`: Database connection and pooling logic.
    - `internal/models/`: Database schema definitions (GORM models).
    - `internal/worker/`: The logic for the Subfinder discovery engine.
    - `internal/middleware/`: Custom Gin middleware (e.g., rate limiting).
    - `internal/queue/`: Redis and Asynq initialization.

## 🛠 Initialization

Unlike some languages that rely heavily on magic `init()` functions, this project favors **explicit initialization**. 

In `main.go`, you will see sequential calls to:
1. `config.Load()`
2. `database.Connect()`
3. `queue.Connect()`
4. `setupRouter()`

This makes the execution order clear and simplifies debugging.
