"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchBarProps {
  className?: string;
}

export function SearchBar({ className }: SearchBarProps) {
  const [domain, setDomain] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!domain.trim()) return;

      // Basic domain validation
      const domainRegex =
        /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
      if (!domainRegex.test(domain.trim())) {
        setError("Please enter a valid domain");
        return;
      }

      setIsLoading(true);
      setError("");

      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/v1/scan`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ domain: domain.trim() }),
          }
        );

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Failed to start scan");
        }

        const data = await response.json();
        router.push(`/scan/${data.job_id}`);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
        setIsLoading(false);
      }
    },
    [domain, router]
  );

  return (
    <div className={cn("w-full max-w-3xl mx-auto", className)}>
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative glow-border rounded-lg">
          <input
            type="text"
            value={domain}
            onChange={(e) => {
              setDomain(e.target.value);
              setError("");
            }}
            placeholder="Enter domain to scan (e.g., example.com)"
            className="w-full h-16 bg-card border border-border rounded-lg px-6 pr-14 text-lg
              placeholder:text-muted-foreground focus:outline-none focus:ring-2
              focus:ring-primary/50 text-foreground font-mono"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !domain.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-3 rounded-md
              bg-primary text-primary-foreground hover:bg-primary/90
              disabled:opacity-50 disabled:cursor-not-allowed transition-all
              focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Search className="w-5 h-5" />
            )}
          </button>
        </div>
        {error && (
          <p className="mt-2 text-sm text-destructive font-mono">{error}</p>
        )}
      </form>
    </div>
  );
}