package worker_test

import (
	"context"
	"testing"
	"time"

	"github.com/projectdiscovery/subfinder/v2/pkg/runner"
	"github.com/projectdiscovery/subfinder/v2/pkg/resolve"
)

func TestSubfinderWithResultCallback(t *testing.T) {
	// Use ResultCallback to capture results - this is the proper way
	var results []string

	sources := []string{"crt.sh", "dnsdumpster"}

	r, err := runner.NewRunner(&runner.Options{
		Sources: sources,
		Timeout: 60,
		Silent:  true,
		All:     true,
		ResultCallback: func(entry *resolve.HostEntry) {
			results = append(results, entry.Host)
			t.Logf("ResultCallback got: %s from %s", entry.Host, entry.Source)
		},
	})
	if err != nil {
		t.Fatalf("Failed to create runner: %v", err)
	}

	ctx, cancel := context.WithTimeout(context.Background(), 120*time.Second)
	defer cancel()

	err = r.EnumerateSingleDomainWithCtx(ctx, "example.com", nil)
	if err != nil {
		t.Logf("Enumeration error: %v", err)
	}

	t.Logf("Final results count: %d", len(results))
	for _, r := range results {
		t.Logf("  - %s", r)
	}

	// Verify we got at least some subdomains
	if len(results) == 0 {
		t.Fatal("Expected at least some subdomains via ResultCallback")
	}
}