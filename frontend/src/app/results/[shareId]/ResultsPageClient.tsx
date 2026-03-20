"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { StatsHeader } from "@/components/StatsHeader";
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

export function ResultsPageClient({ shareId }: { shareId: string }) {
  const [scanData, setScanData] = useState<ScanData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/v1/results/${shareId}`
        );
        if (!response.ok) {
          throw new Error("Results not found");
        }
        const data = await response.json();
        setScanData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setIsLoading(false);
      }
    };

    fetchResults();
  }, [shareId]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Loading results...</p>
        </div>
      </div>
    );
  }

  if (error || !scanData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-destructive">{error || "Results not found"}</p>
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
          </span>
        </Link>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        {/* Title */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Scan Results</h1>
            <p className="text-muted-foreground">
              Shared by {scanData.domain}
            </p>
          </div>
          <Link
            href={`/scan/${scanData.id}`}
            className="text-primary hover:text-primary/80 text-sm"
          >
            View Live Scan →
          </Link>
        </div>

        {/* Stats */}
        <StatsHeader
          domain={scanData.domain}
          totalFound={scanData.total_found}
          sourcesQueried={scanData.sources_queried}
          status={scanData.status}
          createdAt={scanData.created_at}
        />

        {/* Results Table */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">
              Discovered Subdomains ({scanData.total_found})
            </h2>
            <ShareButton
              shareId={scanData.share_id}
              domain={scanData.domain}
              totalFound={scanData.total_found}
            />
          </div>
          <ResultsTable
            subdomains={
              scanData.subdomains?.map((s, i) => ({
                id: s.id || String(i),
                subdomain: s.subdomain,
                ip_address: s.ip_address,
                http_status: s.http_status,
              })) || []
            }
          />
        </div>
      </main>
    </div>
  );
}