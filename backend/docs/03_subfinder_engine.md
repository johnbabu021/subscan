# 03: The Subfinder Engine Integration

This document explains how the application integrates with the Subfinder engine and manages high-performance discovery.

## 🚀 Execution Logic

Unlike calling a CLI tool from a script, we import the Subfinder runner as a native Go package. This provides:
1. **Performance**: No overhead of starting a new process.
2. **Control**: Direct access to memory and configuration.
3. **Real-time Feedback**: Use of callbacks to stream results as they are found.

The runner is initialized once in the `Scanner` struct and reused for each scan task.

## 🧵 Concurrency & Thread-Safety

Subfinder is designed to be highly concurrent. To keep our application stable, we implement two layers of safety:

### 1. WaitGroups & Contexts
We use `context.WithTimeout` to ensure a scan doesn't run forever. This context is passed into `EnumerateSingleDomainWithCtx`.

### 2. The Mutex Pattern
When Subfinder finds a subdomain, it triggers a callback. Because multiple sources might report results at the exact same time, we use a `sync.Mutex` to protect the Go slice where we accumulate results. 

```go
mu.Lock()
foundSubdomains = append(foundSubdomains, entry.Host)
mu.Unlock()
```

This prevents **race conditions**—a common bug where two threads try to write to the same memory location simultaneously, which can cause the app to crash.

## 📈 Data Parsing

The `ResultCallback` takes a `resolve.HostEntry` object. We parse the `entry.Host` into a Go **String** and save it directly to the database. This "stream-as-you-find" approach ensures that even if a scan is interrupted, already discovered subdomains are persisted.
