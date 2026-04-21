# Architecture

## System Overview

SubScan is a distributed system with two Go binaries (API + Worker), a Next.js frontend, PostgreSQL for persistence, and Redis as a task queue.

```
                           ┌─────────────────────────────────────────────┐
                           │              Docker Compose                 │
                           │                                             │
┌──────────┐  HTTP/SSE     │  ┌──────────┐  Asynq    ┌──────────────┐  │
│  Browser │◀─────────────▶│  │  Go API  │──────────▶│    Worker     │  │
│ Next.js  │               │  │  (Gin)   │           │  (subfinder)  │  │
│  :3001   │               │  │  :8080   │◀── SSE ───│              │  │
└──────────┘               │  └────┬─────┘  Manager  └──────┬───────┘  │
                           │       │                        │          │
                           │       │ GORM                   │ GORM     │
                           │       ▼                        ▼          │
                           │  ┌──────────┐          ┌──────────┐      │
                           │  │ Postgres │          │  Redis   │      │
                           │  │  :5432   │          │  :6379   │      │
                           │  └──────────┘          └──────────┘      │
                           └─────────────────────────────────────────────┘
```

## Component Architecture

### 1. API Server (`cmd/api`)

The HTTP server built with Gin. Responsibilities:
- Accept scan requests and create DB records
- Enqueue tasks to Redis via Asynq
- Serve scan status and results
- Stream real-time results via SSE

```
cmd/api/main.go
  ├── config.Load()           # Read env vars
  ├── database.Connect()      # PostgreSQL via GORM
  ├── queue.Connect()         # Redis/Asynq client
  ├── worker.InitSSE()        # Initialize SSE manager
  └── setupRouter()
       ├── middleware.RateLimit(30/min)
       ├── POST /scan         → handler.CreateScan
       ├── GET  /scan/:id     → handler.GetScanStatus
       ├── GET  /scan/:id/stream → handler.StreamScan (SSE)
       └── GET  /results/:id  → handler.GetScanResults
```

### 2. Worker (`cmd/worker`)

Background task processor. Responsibilities:
- Consume scan tasks from Redis queue
- Run subfinder enumeration against target domain
- Save discovered subdomains to PostgreSQL in real-time
- Publish each discovery to SSE manager for live streaming

```
cmd/worker/main.go
  ├── config.Load()
  ├── database.Connect()
  ├── queue.Connect()
  ├── worker.InitSSE()
  ├── worker.NewScanner()
  └── queue.StartWorker()
       └── scanner.ProcessScan()
            ├── subfinder.EnumerateSingleDomain()
            ├── db.Create(&subdomain)       # Per-result save
            └── PublishSubdomain()          # SSE broadcast
```

### 3. Frontend (`frontend/`)

Next.js 14 App Router SPA with three routes:

| Route                  | Component          | Purpose                    |
|------------------------|--------------------|----------------------------|
| `/`                    | `page.tsx`         | Search bar, hero section   |
| `/scan/[jobId]`        | `ScanPageClient`   | Live SSE stream + terminal |
| `/results/[shareId]`   | `ResultsPageClient`| Static shared results view |

Key components:
- `SearchBar` — domain input, POST to API, redirect to scan page
- `Terminal` — live console rendering subdomains as they arrive
- `ResultsTable` — paginated table with copy/export
- `ShareButton` — clipboard + Twitter share
- `StatsHeader` — domain, count, sources, status display

## Data Flow

### Scan Lifecycle

```
1. User submits domain
   Browser ──POST /api/v1/scan──▶ API Server

2. API creates DB record + enqueues task
   API ──INSERT scan──▶ Postgres
   API ──Enqueue──▶ Redis (Asynq)

3. Worker picks up task
   Redis ──Dequeue──▶ Worker
   Worker: scan.status = "running"

4. Subfinder discovers subdomains (real-time callback)
   For each subdomain found:
     Worker ──INSERT subdomain──▶ Postgres
     Worker ──Publish──▶ SSE Manager ──push──▶ Browser (EventSource)

5. Scan completes
   Worker: scan.status = "completed", scan.total_found = N
   SSE stream closes

6. Share results
   Browser ──GET /api/v1/results/:share_id──▶ API ──SELECT──▶ Postgres
```

### SSE Architecture

The SSE manager lives in-process, shared between API and Worker via the `worker` package:

```
                    ┌─────────────────────────┐
                    │      SSE Manager        │
                    │  map[scanID][]chan       │
                    │                         │
  Worker.Process ──▶│  Send(scanID, data) ────▶ chan ──▶ handler.StreamScan
                    │                         │         (writes to HTTP response)
                    │  Subscribe(scanID)  ◀───│──────── client connects
                    │  Unsubscribe()     ◀───│──────── client disconnects
                    └─────────────────────────┘
```

**Important**: This means API and Worker must run in the same process for SSE to work, OR they must share the same SSE manager instance. Currently in Docker Compose they are separate containers, so **SSE only works when both binaries share the same `worker.InitSSE()` singleton** — which requires them to be in the same process. The current Docker setup runs them separately, meaning SSE streaming relies on the API polling fallback.

> **Architectural Note**: For true real-time in a multi-container setup, the SSE manager should be backed by Redis Pub/Sub instead of in-memory channels.

## Database Schema

```sql
┌─────────────────────────────────┐
│             scans               │
├─────────────────────────────────┤
│ id              UUID (PK)       │
│ domain          VARCHAR(255)    │
│ share_id        VARCHAR(36) UQ  │
│ status          VARCHAR(20)     │  -- pending | running | completed | failed
│ total_found     INT             │
│ sources_queried INT             │
│ created_at      TIMESTAMP       │
│ completed_at    TIMESTAMP NULL  │
└────────────┬────────────────────┘
             │ 1:N
             ▼
┌─────────────────────────────────┐
│          subdomains             │
├─────────────────────────────────┤
│ id              UUID (PK)       │
│ scan_id         UUID (FK→scans) │
│ subdomain       VARCHAR(255)    │
│ ip_address      VARCHAR(45)     │
│ http_status     INT NULL        │
│ discovered_at   TIMESTAMP       │
└─────────────────────────────────┘
```

Auto-migrated by GORM on startup. Connection pool: 10 idle, 100 max open, 1h max lifetime.

## Internal Package Map

| Package      | Responsibility                                    |
|--------------|---------------------------------------------------|
| `config`     | Load env vars into `Config` struct                |
| `database`   | GORM PostgreSQL connection + auto-migration       |
| `handler`    | Gin HTTP handlers (CreateScan, GetStatus, SSE)    |
| `middleware`  | IP-based sliding window rate limiter              |
| `models`     | GORM models: `Scan`, `Subdomain`                  |
| `queue`      | Asynq client/server, enqueue/dequeue scan tasks   |
| `worker`     | Subfinder scanner + SSE pub/sub manager           |

## Infrastructure

### Docker Compose Services

| Service    | Image              | Port  | Depends On       |
|------------|--------------------|-------|------------------|
| `postgres` | postgres:15-alpine | 5432  | —                |
| `redis`    | redis:7-alpine     | 6379  | —                |
| `backend`  | Go multi-stage     | 8080  | postgres, redis  |
| `worker`   | Go multi-stage     | —     | postgres, redis  |
| `frontend` | Node multi-stage   | 3001  | backend          |

### Build Strategy

- **Backend**: `golang:1.21-alpine` → build both binaries → `alpine:3.19` runtime with non-root user
- **Frontend**: `node:20-alpine` → pnpm install → next build → standalone output with non-root user

## Known Architectural Issues

1. **SSE in multi-container**: The SSE manager is in-memory. When API and Worker run as separate Docker containers, real-time streaming doesn't work. Fix: use Redis Pub/Sub as the SSE transport.

2. **No deduplication**: The same subdomain can be inserted multiple times if subfinder returns duplicates from different sources.

3. **No authentication**: All endpoints are public. Rate limiting is the only protection.

4. **CORS wildcard**: `Access-Control-Allow-Origin: *` is set globally — should be restricted in production.
