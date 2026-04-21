# SubScan — Real-time Subdomain Discovery

A full-stack subdomain enumeration tool that discovers subdomains in real-time using multiple DNS sources and streams results live to a terminal-style UI.

```
┌──────────┐    POST /scan     ┌──────────┐    Asynq/Redis    ┌──────────┐
│ Next.js  │ ───────────────▶  │  Go API  │ ───────────────▶  │  Worker  │
│ Frontend │ ◀──── SSE ─────── │  (Gin)   │ ◀─── SSE Mgr ─── │ subfinder│
└──────────┘                   └──────────┘                   └──────────┘
   :3001                          :8080            ▼
                                              ┌──────────┐
                                              │ Postgres │
                                              └──────────┘
```

## Features

- **Real-time streaming** — subdomains appear instantly via Server-Sent Events
- **Multiple DNS sources** — crt.sh, AlienVault, DNSDumpster queried in parallel
- **Shareable results** — unique share links for every scan
- **Terminal UI** — live console view mimicking a real scanner
- **Rate limiting** — 30 requests/minute per IP
- **Dockerized** — single `docker compose up` to run everything

## Tech Stack

| Layer      | Technology                              |
|------------|-----------------------------------------|
| Frontend   | Next.js 14, TypeScript, Tailwind CSS    |
| API Server | Go, Gin, GORM                           |
| Worker     | Go, Asynq, projectdiscovery/subfinder   |
| Database   | PostgreSQL 15                           |
| Queue      | Redis 7 (via Asynq)                     |
| Infra      | Docker Compose, multi-stage builds      |

## Quick Start

```bash
# 1. Clone and configure
git clone <repo-url> && cd subdomain-finder
cp .env.example .env

# 2. Start all services
docker compose up --build

# 3. Open the app
open http://localhost:3001
```

The API is available at `http://localhost:8080/api/v1/health`.

## Project Structure

```
subdomain-finder/
├── backend/
│   ├── cmd/
│   │   ├── api/main.go          # API server entrypoint
│   │   └── worker/main.go       # Worker entrypoint
│   ├── internal/
│   │   ├── config/              # Environment config loader
│   │   ├── database/            # PostgreSQL connection (GORM)
│   │   ├── handler/             # HTTP handlers + SSE streaming
│   │   ├── middleware/          # Rate limiter (IP-based sliding window)
│   │   ├── models/              # Scan & Subdomain GORM models
│   │   ├── queue/               # Asynq client/server/enqueue
│   │   └── worker/              # Subfinder scanner + SSE manager
│   ├── Dockerfile               # Multi-stage Go build
│   ├── go.mod
│   └── go.sum
├── frontend/
│   ├── src/
│   │   ├── app/                 # Next.js App Router pages
│   │   │   ├── page.tsx         # Home — search bar
│   │   │   ├── scan/[jobId]/    # Live scan view (SSE + terminal)
│   │   │   └── results/[shareId]/ # Shared results view
│   │   ├── components/          # SearchBar, Terminal, ResultsTable, etc.
│   │   └── lib/utils.ts         # cn() utility
│   ├── Dockerfile               # Multi-stage Node/pnpm build
│   └── package.json
├── docker-compose.yml           # 5 services: postgres, redis, backend, worker, frontend
├── .env.example
└── docs/
    ├── architecture.md          # System architecture & diagrams
    ├── api.md                   # API reference
    └── deployment.md            # Deployment guide
```

## API Overview

| Method | Endpoint                       | Description              |
|--------|--------------------------------|--------------------------|
| POST   | `/api/v1/scan`                 | Start a new scan         |
| GET    | `/api/v1/scan/:job_id`         | Get scan status          |
| GET    | `/api/v1/scan/:job_id/stream`  | SSE stream of results    |
| GET    | `/api/v1/results/:share_id`    | Get results by share ID  |
| GET    | `/api/v1/health`               | Health check             |

Full API docs → [docs/api.md](docs/api.md)

## Environment Variables

| Variable             | Default                                          | Description              |
|----------------------|--------------------------------------------------|--------------------------|
| `DATABASE_URL`       | `postgresql://subscan:subscan@localhost:5432/subscan` | PostgreSQL connection    |
| `REDIS_URL`          | `redis://localhost:6379`                         | Redis for Asynq queue    |
| `APP_URL`            | `http://localhost:3000`                          | Frontend URL             |
| `API_URL`            | `http://localhost:8080`                          | Backend API URL          |
| `SHARE_BASE_URL`     | `http://localhost:8080/results`                  | Base URL for share links |
| `SUBFINDER_SOURCES`  | `crt.sh,alienvault,dnsdumpster`                  | DNS sources to query     |
| `SUBFINDER_TIMEOUT`  | `300`                                            | Scan timeout (seconds)   |
| `NEXT_PUBLIC_API_URL`| `http://localhost:8080`                          | API URL for frontend     |

## Documentation

- [Architecture](docs/architecture.md) — system design, data flow, component diagrams
- [API Reference](docs/api.md) — endpoints, request/response schemas
- [Deployment](docs/deployment.md) — Docker, production setup, scaling

## License

MIT
