# 05: Error & Edge Case Handling

This document explains the common patterns for error handling in Go and how we manage edge cases in this project.

## 🤝 The "Go Way" of Error Handling

In Go, errors are **values**, not exceptions. You will see functions returning a pair: `(result, error)`.

```go
scan, err := db.First(&scanID)
if err != nil {
    // Handle the error immediately!
    return err
}
// Proceed with 'scan'
```

This ensures errors are handled as soon as they occur, leading to more predictable code.

## 🚧 Common Edge Cases

### 1. Database is Down
If `database.Connect()` fails at startup, the app calls `log.Fatalf`. This stops the process immediately and logs the error, which is caught by Docker or Kubernetes to alert the developer.

### 2. Invalid Domain Input
We use the `binding:"hostname"` tag. If a user submits an invalid domain, the API returns a `400 Bad Request` with a clear message: `"error": "Key: 'ScanRequest.Domain' Error:Field validation for 'Domain' failed on the 'hostname' tag"`.

### 3. Subfinder Finds Zero Results
This is not an "error," but a valid "edge case."
*   **Behavior**: The scan completes successfully.
*   **Result**: `TotalFound` is set to `0`, and the `subdomains` list is empty.
*   **UI**: The frontend should display "No subdomains discovered" rather than an error message.

### 4. Background Job Fails
If a worker crashes, the **Asynq task** remains in the "Active" state. Redis allows us to retry tasks automatically based on the configured retry policy.
