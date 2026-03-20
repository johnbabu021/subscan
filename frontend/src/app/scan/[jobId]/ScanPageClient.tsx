"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { StatsHeader } from "@/components/StatsHeader";
import { Terminal } from "@/components/Terminal";
import { ResultsTable } from "@/components/ResultsTable";
import { ShareButton } from "@/components/ShareButton";

interface Subdomain {
  id: string;
  subdomain: string;
  ip_address?: string;
  http_status?: number;
}

interface ScanData {
  id: string;
  domain: string;
  share_id: string;
  status: string;
  total_found: number;
  sources_queried: number;
  created_at: string;
  completed_at?: string;
  subdomains?: Subdomain[];
}

export function ScanPageClient({ jobId }: { jobId: string }) {
  const router = useRouter();
  const [scanData, setScanData] = useState<ScanData | null>(null);
  const [subdomains, setSubdomains] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isConnected, setIsConnected] = useState(false);

  // Poll for scan status
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/v1/scan/${jobId}`
        );
        if (!response.ok) {
          throw new Error("Failed to fetch scan status");
        }
        const data = await response.json();
        setScanData(data);
        if (data.status === "completed") {
          // Fetch full results
          const resultsResponse = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/v1/results/${data.share_id}`
          );
          if (resultsResponse.ok) {
            const fullData = await resultsResponse.json();
            setScanData(fullData);
            if (fullData.subdomains) {
              setSubdomains(fullData.subdomains.map((s: Subdomain) => s.subdomain));
            }
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialData();

    // Poll every 5 seconds
    const interval = setInterval(fetchInitialData, 5000);
    return () => clearInterval(interval);
  }, [jobId]);

  // Connect to SSE stream
  useEffect(() => {
    const eventSource = new EventSource(
      `${process.env.NEXT_PUBLIC_API_URL}/api/v1/scan/${jobId}/stream`
    );

    eventSource.onopen = () => {
      setIsConnected(true);
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "found") {
          setSubdomains((prev) => [...prev, data.subdomain]);
        }
      } catch (err) {
        // Ignore parse errors for non-JSON messages
      }
    };

    eventSource.onerror = () => {
      setIsConnected(false);
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [jobId]);

  const isScanning = scanData?.status === "running" || scanData?.status === "pending";

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Loading scan...</p>
        </div>
      </div>
    );
  }

  if (error || !scanData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-destructive">{error || "Scan not found"}</p>
        <Link
          href="/"
          className="flex items-center gap-2 text-primary hover:text-primary/80"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="font-bold">
              <span className="text-primary">Sub</span>Scan
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                isConnected ? "bg-green-500" : "bg-muted"
              }`}
            />
            <span className="text-xs text-muted-foreground">
              {isConnected ? "Live" : "Connecting..."}
            </span>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        {/* Stats */}
        <StatsHeader
          domain={scanData.domain}
          totalFound={scanData.total_found || subdomains.length}
          sourcesQueried={scanData.sources_queried || 3}
          status={scanData.status}
          createdAt={scanData.created_at}
        />

        {/* Terminal & Results */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Terminal */}
          <div>
            <h2 className="text-lg font-semibold mb-4">Live Console</h2>
            <Terminal subdomains={subdomains} isScanning={isScanning} />
          </div>

          {/* Results Table */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Results</h2>
              {scanData.share_id && (
                <ShareButton
                  shareId={scanData.share_id}
                  domain={scanData.domain}
                  totalFound={subdomains.length}
                />
              )}
            </div>
            <ResultsTable
              subdomains={
                scanData.subdomains?.map((s, i) => ({
                  id: s.id || String(i),
                  subdomain: s.subdomain,
                  ip_address: s.ip_address,
                  http_status: s.http_status,
                })) || subdomains.map((s, i) => ({ id: String(i), subdomain: s }))
              }
            />
          </div>
        </div>
      </main>
    </div>
  );
}