# Build stage
FROM golang:1.21-alpine AS builder

# Install build dependencies
RUN apk add --no-cache git gcc musl-dev

# Set working directory
WORKDIR /app

# Copy go mod files
COPY go.mod go.sum ./
RUN go mod download

# Copy source code
COPY . .

# Build binaries
RUN CGO_ENABLED=1 go build -o api ./cmd/api
RUN CGO_ENABLED=1 go build -o worker ./cmd/worker

# Runtime stage
FROM alpine:3.19

# Install runtime dependencies
RUN apk add --no-cache ca-certificates tzdata

# Create non-root user
RUN addgroup -g 1000 appgroup && adduser -u 1000 -G appgroup -D appuser

# Set working directory
WORKDIR /app

# Copy binaries from builder
COPY --from=builder /app/api /app/api
COPY --from=builder /app/worker /app/worker

# Create directories for output
RUN mkdir -p /app/output

# Change ownership
chown -R appuser:appgroup /app

# Switch to non-root user
USER appuser

# Expose ports
EXPOSE 8080

# Default command
CMD ["/app/api"]