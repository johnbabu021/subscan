"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, Loader2, Radio, Target, Share2, Shield, Zap, Activity } from "lucide-react";
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
    <div className={cn("w-full max-w-xl mx-auto", className)}>
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative group">
          {/* Glow effect */}
          <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 via-blue-500 to-cyan-500 rounded-xl blur opacity-30 group-focus-within:opacity-70 transition-opacity duration-500" />

          <div className="relative flex items-center bg-black/90 backdrop-blur-xl rounded-xl border border-cyan-500/30 overflow-hidden">
            {/* Radar icon */}
            <div className="pl-4 pr-2 py-4 border-r border-cyan-500/20">
              <div className="relative">
                <Radio className="w-5 h-5 text-cyan-400" />
                {isLoading && (
                  <div className="absolute inset-0 animate-ping opacity-75">
                    <Radio className="w-5 h-5 text-cyan-400" />
                  </div>
                )}
              </div>
            </div>

            <input
              type="text"
              value={domain}
              onChange={(e) => {
                setDomain(e.target.value);
                setError("");
              }}
              placeholder="Enter domain (e.g., example.com)"
              className="flex-1 h-14 bg-transparent px-4 text-base font-mono text-cyan-50 placeholder:text-cyan-500/50 focus:outline-none"
              disabled={isLoading}
            />

            <button
              type="submit"
              disabled={isLoading || !domain.trim()}
              className="m-2 px-6 h-10 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-medium hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Scanning</span>
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  <span>Scan</span>
                </>
              )}
            </button>
          </div>
        </div>
        {error && (
          <p className="mt-3 text-sm text-red-400 font-mono flex items-center gap-2">
            <Activity className="w-4 h-4" />
            {error}
          </p>
        )}
      </form>
    </div>
  );
}