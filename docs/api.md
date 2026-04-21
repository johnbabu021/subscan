# API Reference

Base URL: `http://localhost:8080/api/v1`

All endpoints are rate-limited to **30 requests/minute** per IP (except health check).

---

## Health Check

```
GET /api/v1/health
```

**Response** `200 OK`
```json
{
  "status": "ok",
  "service": "subscan-api"
}
```

---

## Create Scan

Start a new subdomain enumeration job.

```
POST /api/v1/scan
Content-Type: application/json
```

**Request Body**
```json
{
  "domain": "example.com"
}
```

| Field    | Type   | Required | Validation          |
|----------|--------|----------|---------------------|
| `domain` | string | yes      | Valid hostname      |

**Response** `202 Accepted`
```json
{
  "job_id": "550e8400-e29b-41d4-a716-446655440000",
  "scan_id": "550e8400-e29b-41d4-a716-446655440000",
  "share_id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
  "status": "pending"
}
```

**Errors**

| Status | Body                                    | Cause                |
|--------|-----------------------------------------|----------------------|
| 400    | `{"error": "validation message"}`       | Invalid domain       |
| 429    | `{"error": "Too many requests..."}`     | Rate limit exceeded  |
| 500    | `{"error": "Failed to create scan"}`    | Database error       |
| 500    | `{"error": "Failed to enqueue scan"}`   | Redis/queue error    |

---

## Get Scan Status

Poll the current status of a scan.

```
GET /api/v1/scan/:job_id
```

| Param    | Type | Description                |
|----------|------|----------------------------|
| `job_id` | UUID | The job ID from create scan |

**Response** `200 OK`
```json
{
  "job_id": "550e8400-e29b-41d4-a716-446655440000",
  "scan_id": "550e8400-e29b-41d4-a716-446655440000",
  "share_id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
  "status": "running"
}
```

**Status values**: `pending` → `running` → `completed` | `failed`

**Errors**

| Status | Cause            |
|--------|------------------|
| 400    | Invalid UUID     |
| 404    | Scan not found   |

---

## Stream Scan Results (SSE)

Real-time Server-Sent Events stream of subdomain discoveries.

```
GET /api/v1/scan/:job_id/stream
Accept: text/event-stream
```

**Connection event** (sent immediately):
```
data: {"type":"connected","message":"Connected to scan stream"}
```

**Subdomain found event**:
```
data: {"type":"found","subdomain":"mail.example.com"}
```

**Heartbeat** (every 30s):
```
: heartbeat
```

**Client usage (JavaScript)**:
```javascript
const es = new EventSource(`${API_URL}/api/v1/scan/${jobId}/stream`);

es.onmessage = (event) => {
  const data = JSON.parse(event.data);
  if (data.type === "found") {
    console.log("Discovered:", data.subdomain);
  }
};

es.onerror = () => es.close();
```

> **Note**: SSE streaming only works when API and Worker share the same process. In the default Docker Compose setup (separate containers), the frontend falls back to polling via the status endpoint.

---

## Get Scan Results

Retrieve completed scan results by share ID.

```
GET /api/v1/results/:share_id
```

| Param      | Type   | Description                    |
|------------|--------|--------------------------------|
| `share_id` | string | UUID share ID from create scan |

**Response** `200 OK`
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "domain": "example.com",
  "share_id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
  "status": "completed",
  "total_found": 42,
  "sources_queried": 3,
  "created_at": "2026-04-21T08:00:00Z",
  "completed_at": "2026-04-21T08:02:30Z",
  "subdomains": [
    {
      "id": "a1b2c3d4-...",
      "scan_id": "550e8400-...",
      "subdomain": "mail.example.com",
      "ip_address": "93.184.216.34",
      "http_status": 200,
      "discovered_at": "2026-04-21T08:01:15Z"
    }
  ]
}
```

**Errors**

| Status | Cause            |
|--------|------------------|
| 404    | Scan not found   |

---

## Rate Limiting

- **Limit**: 30 requests per minute per IP
- **Algorithm**: Sliding window (in-memory)
- **Scope**: All `/api/v1/*` routes except `/health`
- **Response when exceeded**: `429 Too Many Requests`

```json
{
  "error": "Too many requests. Please try again later."
}
```

---

## Data Models

### Scan

| Field            | Type       | Notes                              |
|------------------|------------|------------------------------------|
| `id`             | UUID       | Primary key, auto-generated        |
| `domain`         | string     | Target domain                      |
| `share_id`       | string     | Unique shareable ID                |
| `status`         | string     | pending / running / completed / failed |
| `total_found`    | int        | Count of discovered subdomains     |
| `sources_queried`| int        | Number of DNS sources used         |
| `created_at`     | timestamp  | Scan creation time                 |
| `completed_at`   | timestamp? | Scan completion time (nullable)    |
| `subdomains`     | array      | Included when fetching results     |

### Subdomain

| Field          | Type       | Notes                          |
|----------------|------------|--------------------------------|
| `id`           | UUID       | Primary key, auto-generated    |
| `scan_id`      | UUID       | Foreign key → Scan             |
| `subdomain`    | string     | Discovered subdomain hostname  |
| `ip_address`   | string?    | Resolved IP (if available)     |
| `http_status`  | int?       | HTTP status code (if probed)   |
| `discovered_at`| timestamp  | When the subdomain was found   |
