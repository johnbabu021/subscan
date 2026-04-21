# 02: Database & Persistence Layer

This document details how the application manages data using PostgreSQL and GORM.

## 🔌 Connection Lifecycle

The database connection is managed in `internal/database/database.go`.

### Opening and Pooling
We use `gorm.Open` with the PostgreSQL driver. To ensure the application scales and handles many concurrent requests, we configure a **connection pool**:

```go
sqlDB.SetMaxIdleConns(10)      // Keep 10 idle connections ready
sqlDB.SetMaxOpenConns(100)     // Limit to 100 total open connections
sqlDB.SetConnMaxLifetime(time.Hour) // Rotate connections every hour
```

### Closing
In a long-running web server, we typically don't close the global DB connection manually after every request. Instead, GORM manages the pool. However, in the `main` function or during tests, you might see `defer db.Close()` (using the underlying `*sql.DB` instance) to ensure resources are released when the process exits.

## 📊 Schema & Models

The schema is automatically generated using GORM's `AutoMigrate` feature.

### Scan Model
| Go Field | SQL Column | Type | Description |
| :--- | :--- | :--- | :--- |
| `ID` | `id` | `uuid` | Primary Key (auto-gen) |
| `Domain` | `domain` | `varchar(255)` | The target domain |
| `Status` | `status` | `varchar(20)` | `pending`, `running`, `completed`, `failed` |
| `TotalFound`| `total_found` | `integer` | Count of subdomains discovered |
| `CreatedAt` | `created_at` | `timestamp` | When the scan was requested |

### Subdomain Model
| Go Field | SQL Column | Type | Description |
| :--- | :--- | :--- | :--- |
| `ScanID` | `scan_id` | `uuid` | Foreign Key to Scan |
| `Subdomain`| `subdomain` | `varchar(255)` | The discovered host |

## 🔍 Query Walkthrough

### 1. Creating a Scan
**Go Code:** `db.Create(&scan)`
**Raw SQL:** `INSERT INTO scans (id, domain, status, ...) VALUES ($1, $2, $3, ...)`

### 2. Retrieving Results with Subdomains
**Go Code:** `db.Preload("Subdomains").First(&scan, "share_id = ?", shareID)`
**Raw SQL:** 
1. `SELECT * FROM scans WHERE share_id = $1 LIMIT 1`
2. `SELECT * FROM subdomains WHERE scan_id = $2` (GORM handles the join/preload)

### 3. Preventing SQL Injection
GORM automatically uses **parameterized queries** (the `?` or `$1` placeholders). When you write `db.First(&user, "id = ?", input)`, GORM ensures that `input` is treated as data, not as part of the SQL command. **Never** use `fmt.Sprintf` to build queries.

## 🗄 Memory Management (Scan & Rows)
When querying thousands of records, we use `db.Find(&results)`. In lower-level Go, you must call `rows.Close()` to prevent memory leaks. GORM simplifies this by handling the cleanup automatically when it finishes "scanning" the results into your Go slices.
