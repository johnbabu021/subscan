## Architecture: SubScan — Subdomain Discovery Platform

### Design Decisions
- **Two-binary Go backend**: API server (Gin) and Worker (Asynq) separated for independent scaling, but sharing the same `internal/` packages
- **Asynq over raw Redis**: Provides retry logic, timeout, concurrency control out of the box for task processing
- **SSE over WebSockets**: Simpler protocol for unidirectional server→client streaming, native browser EventSource support
- **GORM auto-migration**: Trades migration control for development speed — acceptable for this project size
- **In-memory SSE manager**: Fast but breaks in multi-container deployments — documented as known issue

### Files to Create
| File | Purpose | Priority |
|------|---------|----------|
| N/A — project is fully implemented | | |

### Files to Modify
| File | Changes | Priority |
|------|---------|----------|
| `backend/internal/worker/sse.go` | Replace in-memory channels with Redis Pub/Sub for multi-container SSE | High |
| `backend/internal/handler/scan.go` | Add subdomain deduplication on insert | Medium |
| `backend/cmd/api/main.go` | Restrict CORS to configured `APP_URL` instead of wildcard `*` | Medium |
| `.gitignore` | Add Go-specific ignores (`backend/api`, `backend/worker`, `vendor/`) | High |

### Data Flow
```
Browser → POST /scan → API (create DB record + enqueue) → Redis → Worker (subfinder) → DB + SSE → Browser (EventSource)
Browser → GET /results/:share_id → API → DB → JSON response
```

### Build Sequence
1. Fix `.gitignore` to exclude Go binaries
2. Replace in-memory SSE with Redis Pub/Sub
3. Add subdomain deduplication
4. Restrict CORS origins
5. Add authentication layer
