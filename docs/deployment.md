# Deployment Guide

## Local Development (Docker Compose)

The fastest way to run everything:

```bash
cp .env.example .env
docker compose up --build
```

| Service  | URL                          |
|----------|------------------------------|
| Frontend | http://localhost:3001         |
| API      | http://localhost:8080         |
| Postgres | localhost:5432               |
| Redis    | localhost:6379               |

To rebuild a single service:
```bash
docker compose up --build backend
```

To view logs:
```bash
docker compose logs -f worker
```

To tear down (including volumes):
```bash
docker compose down -v
```

---

## Local Development (Without Docker)

### Prerequisites

- Go 1.21+
- Node.js 20+ with pnpm
- PostgreSQL 15
- Redis 7

### 1. Database Setup

```bash
createdb subscan
# Or via psql:
psql -c "CREATE DATABASE subscan;"
psql -c "CREATE USER subscan WITH PASSWORD 'subscan';"
psql -c "GRANT ALL PRIVILEGES ON DATABASE subscan TO subscan;"
```

Tables are auto-migrated by GORM on startup.

### 2. Backend

```bash
cd backend

# Set environment
export DATABASE_URL="postgresql://subscan:subscan@localhost:5432/subscan"
export REDIS_URL="redis://localhost:6379"

# Run API server
go run ./cmd/api

# In another terminal — run worker
go run ./cmd/worker
```

### 3. Frontend

```bash
cd frontend
pnpm install
echo "NEXT_PUBLIC_API_URL=http://localhost:8080" > .env.local
pnpm dev
```

Frontend runs on http://localhost:3000.

---

## Production Deployment

### Environment Variables

Set these for production (do NOT use defaults):

```bash
DATABASE_URL=postgresql://user:password@db-host:5432/subscan
REDIS_URL=redis://redis-host:6379
APP_URL=https://subscan.yourdomain.com
API_URL=https://api.subscan.yourdomain.com
SHARE_BASE_URL=https://subscan.yourdomain.com/results
SUBFINDER_SOURCES=crt.sh,alienvault,dnsdumpster
SUBFINDER_TIMEOUT=300
NEXT_PUBLIC_API_URL=https://api.subscan.yourdomain.com
NEXT_PUBLIC_APP_URL=https://subscan.yourdomain.com
```

### Production Checklist

- [ ] Set `GIN_MODE=release` for the backend
- [ ] Replace CORS wildcard `*` with your actual frontend domain
- [ ] Use managed PostgreSQL (e.g., Supabase, RDS, Cloud SQL)
- [ ] Use managed Redis (e.g., Upstash, ElastiCache)
- [ ] Add authentication if exposing publicly
- [ ] Set up HTTPS via reverse proxy (nginx, Caddy, or cloud LB)
- [ ] Add Redis Pub/Sub for SSE if running API and Worker as separate containers
- [ ] Configure `SUBFINDER_TIMEOUT` based on expected scan sizes
- [ ] Set up log aggregation (stdout is structured enough for most collectors)

### Docker Production Build

The Dockerfiles already use multi-stage builds with non-root users:

```bash
# Build and tag
docker build -t subscan-backend ./backend
docker build -t subscan-frontend ./frontend

# Run
docker run -d -p 8080:8080 --env-file .env subscan-backend
docker run -d -p 8080:8080 --env-file .env subscan-backend /app/worker
docker run -d -p 3000:3000 --env-file .env subscan-frontend
```

### Reverse Proxy (Caddy example)

```
api.subscan.yourdomain.com {
    reverse_proxy localhost:8080
}

subscan.yourdomain.com {
    reverse_proxy localhost:3001
}
```

For SSE to work through a reverse proxy, ensure buffering is disabled. The API already sends `X-Accel-Buffering: no` for nginx compatibility.

---

## Scaling Considerations

### Workers

Workers are stateless — scale horizontally by running more instances:

```bash
docker compose up --scale worker=3
```

Asynq handles task distribution across workers automatically. Concurrency is set to 10 tasks per worker.

### API

The API is also stateless (except the in-memory SSE manager). For horizontal scaling:
1. Put a load balancer in front
2. Move SSE to Redis Pub/Sub so any API instance can serve any stream
3. Use sticky sessions as a temporary workaround for SSE

### Database

Connection pool defaults: 10 idle, 100 max open, 1h max lifetime. Adjust via GORM config in `internal/database/database.go` for higher throughput.

---

## Troubleshooting

| Problem                          | Cause                                    | Fix                                          |
|----------------------------------|------------------------------------------|----------------------------------------------|
| SSE not streaming live results   | API and Worker in separate containers    | Run both in same process, or add Redis Pub/Sub |
| `Failed to connect to database`  | PostgreSQL not ready                     | Check health check, wait for postgres         |
| `Failed to connect to Redis`     | Redis URL format wrong                   | Use `redis://host:port` format               |
| Rate limit hit immediately       | Shared IP (proxy/NAT)                    | Increase limit or use API key auth           |
| Scan stuck in "pending"          | Worker not running                       | Check `docker compose logs worker`           |
| Duplicate subdomains in results  | No dedup in scanner                      | Known issue — add UNIQUE constraint or dedup in code |
