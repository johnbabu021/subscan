package config

import (
	"os"
	"strconv"
)

type Config struct {
	DatabaseURL      string
	RedisURL         string
	AppURL           string
	APIURL           string
	ShareBaseURL     string
	SubfinderSources string
	SubfinderTimeout int
	Port             string
}

func Load() *Config {
	return &Config{
		DatabaseURL:      getEnv("DATABASE_URL", "postgresql://subscan:subscan@localhost:5432/subscan"),
		RedisURL:         getEnv("REDIS_URL", "redis://localhost:6379"),
		AppURL:           getEnv("APP_URL", "http://localhost:3000"),
		APIURL:           getEnv("API_URL", "http://localhost:8080"),
		ShareBaseURL:     getEnv("SHARE_BASE_URL", "http://localhost:8080/results"),
		SubfinderSources: getEnv("SUBFINDER_SOURCES", "crt.sh,alienvault,dnsdumpster"),
		SubfinderTimeout: getEnvInt("SUBFINDER_TIMEOUT", 300),
		Port:             getEnv("PORT", "8080"),
	}
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func getEnvInt(key string, defaultValue int) int {
	if value := os.Getenv(key); value != "" {
		if intVal, err := strconv.Atoi(value); err == nil {
			return intVal
		}
	}
	return defaultValue
}