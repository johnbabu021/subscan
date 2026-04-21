"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Loader2, Search, Shield, AlertCircle } from "lucide-react";

interface TerminalProps {
  subdomains: string[];
  isScanning: boolean;
  className?: string;
}

export function Terminal({ subdomains, isScanning, className }: TerminalProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showScanLine, setShowScanLine] = useState(true);
  const [scanProgress, setScanProgress] = useState(0);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [subdomains]);

  useEffect(() => {
    if (isScanning) {
      setShowScanLine(true);
      // Simulate progress during scan
      const interval = setInterval(() => {
        setScanProgress(p => (p + 10) % 100);
      }, 500);
      return () => clearInterval(interval);
    } else {
      setShowScanLine(false);
      setScanProgress(0);
    }
  }, [isScanning]);

  return (
    <div
      className={cn(
        "relative bg-black rounded-lg border border-border overflow-hidden font-mono",
        className
      )}
    >
      {/* Terminal header */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-border bg-card/50">
        <div className="w-3 h-3 rounded-full bg-destructive/70" />
        <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
        <div className="w-3 h-3 rounded-full bg-green-500/70" />
        <span className="ml-2 text-xs text-muted-foreground">
          subscan@scanner
        </span>
      </div>

      {/* Terminal content */}
      <div
        ref={scrollRef}
        className="h-64 overflow-y-auto p-4 space-y-2 text-sm"
      >
        {/* Command line */}
        <div className="text-terminal-green">
          <span className="text-terminal-cyan">$</span> subfinder -d{" "}
          {isScanning ? (
            <span className="text-primary animate-pulse">[scanning...]</span>
          ) : (
            <span className="text-green-400">[complete]</span>
          )}
        </div>

        {/* Scanning in progress */}
        {isScanning && subdomains.length === 0 && (
          <div className="mt-6 space-y-3">
            <div className="flex items-center gap-2 text-primary">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Querying DNS sources...</span>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Search className="w-3 h-3" />
                <span>Checking crt.sh...</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Search className="w-3 h-3" />
                <span>Checking alienvault...</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Search className="w-3 h-3" />
                <span>Checking dnsdumpster...</span>
              </div>
            </div>
            {/* Progress bar */}
            <div className="w-full bg-muted rounded-full h-1.5 mt-2">
              <div
                className="bg-primary h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${scanProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Results found */}
        {subdomains.length > 0 && (
          <div className="mt-2 text-xs text-primary flex items-center gap-2">
            <Shield className="w-3 h-3" />
            <span>Found {subdomains.length} subdomain{subdomains.length !== 1 ? 's' : ''}</span>
          </div>
        )}

        {/* Subdomains list */}
        {subdomains.map((subdomain, index) => (
          <div key={index} className="text-terminal-green">
            <span className="text-terminal-cyan opacity-50">
              [{String(index + 1).padStart(3, "0")}]
            </span>{" "}
            {subdomain}
          </div>
        ))}

        {/* Empty state - not scanning */}
        {!isScanning && subdomains.length === 0 && (
          <div className="mt-4 p-4 border border-border rounded-lg bg-card/30">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-500 mt-0.5" />
              <div>
                <p className="text-sm text-foreground">No subdomains found</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Try a different domain or check if the domain exists
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Scan line animation */}
        {isScanning && showScanLine && (
          <div className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent animate-scan-line" />
        )}
      </div>

      {/* Status bar */}
      <div className="px-4 py-2 border-t border-border bg-card/50 text-xs text-muted-foreground flex justify-between">
        <span>Sources: crt.sh, alienvault, dnsdumpster</span>
        <span className={cn(isScanning ? "text-primary" : "text-green-500")}>
          {isScanning ? "● SCANNING" : "● IDLE"}
        </span>
      </div>
    </div>
  );
}