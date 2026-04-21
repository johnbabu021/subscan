# 04: Step-by-Step "Code Flow"

This document traces the lifecycle of a single subdomain scan request.

## 1. The Trigger: `POST /api/v1/scan`
A user sends a JSON body containing the domain to be scanned.

## 2. Validation
The request is bound to a `ScanRequest` struct.
*   **Go Tag**: `binding:"required,hostname"`
*   **Effect**: Gin automatically verifies that the input exists and is formatted as a valid domain name (e.g., `example.com` is OK, `invalid-domain!` is rejected).

## 3. The Hand-off: Enqueuing
Instead of scanning immediately, the API:
1.  Creates a "Pending" record in the database.
2.  Pushes a task onto the **Asynq queue** (Redis).
3.  Returns a `202 Accepted` response to the user with a `job_id`.

## 4. The Process: Worker Execution
The background worker picks up the task from Redis:
1.  Updates the database record to "Running".
2.  Initializes a Subfinder runner.
3.  Starts the enumeration process.

## 5. Storage: Real-time Persistence
As each subdomain is found:
1.  The `ResultCallback` is triggered.
2.  A new row is inserted into the `subdomains` table.
3.  An event is published to the **SSE (Server-Sent Events) manager** to notify any connected clients (browsers).

## 6. The Response: Finalization
When the scan completes:
1.  The worker counts the total results.
2.  The database record is updated to "Completed".
3.  The results can then be retrieved via `GET /api/v1/results/{share_id}`.
