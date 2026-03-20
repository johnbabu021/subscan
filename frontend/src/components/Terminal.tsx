"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface TerminalProps {
  subdomains: string[];
  isScanning: boolean;
  className?: string;
}

export function Terminal({ subdomains, isScanning, className }: TerminalProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showScanLine, setShowScanLine] = useState(true);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [subdomains]);

  useEffect(() => {
    if (isScanning) {
      setShowScanLine(true);
    } else {
      setShowScanLine(false);
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
        className="h-64 overflow-y-auto p-4 space-y-1 text-sm"
      >
        <div className="text-terminal-green">
          <span className="text-terminal-cyan">$</span> subfinder -d{" "}
          {isScanning ? "[scanning...]" : "[complete]"}
        </div>

        {subdomains.length === 0 && !isScanning && (
          <div className="text-muted-foreground text-xs mt-4">
            No subdomains found yet...
          </div>
        )}

        {subdomains.map((subdomain, index) => (
          <div key={index} className="text-terminal-green">
            <span className="text-terminal-cyan opacity-50">
              [{String(index + 1).padStart(3, "0")}]
            </span>{" "}
            {subdomain}
          </div>
        ))}

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