"use client";

import { cn } from "@/lib/utils";
import { Activity, Globe, Clock } from "lucide-react";

interface StatsHeaderProps {
  domain: string;
  totalFound: number;
  sourcesQueried: number;
  status: string;
  createdAt?: string;
  className?: string;
}

export function StatsHeader({
  domain,
  totalFound,
  sourcesQueried,
  status,
  createdAt,
  className,
}: StatsHeaderProps) {
  const isCompleted = status === "completed";
  const isRunning = status === "running";

  return (
    <div
      className={cn(
        "grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-card border border-border rounded-lg",
        className
      )}
    >
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <Globe className="w-5 h-5 text-primary" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground uppercase">Domain</p>
          <p className="font-mono text-sm text-foreground truncate max-w-[150px]">
            {domain}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-green-500/10">
          <Activity className="w-5 h-5 text-green-500" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground uppercase">Found</p>
          <p className="font-mono text-2xl font-bold text-terminal-green">
            {totalFound}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-yellow-500/10">
          <Globe className="w-5 h-5 text-yellow-500" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground uppercase">Sources</p>
          <p className="font-mono text-2xl font-bold text-foreground">
            {sourcesQueried}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div
          className={cn(
            "p-2 rounded-lg",
            isCompleted
              ? "bg-green-500/10"
              : isRunning
              ? "bg-primary/10"
              : "bg-muted"
          )}
        >
          <Clock
            className={cn(
              "w-5 h-5",
              isCompleted
                ? "text-green-500"
                : isRunning
                ? "text-primary animate-pulse"
                : "text-muted-foreground"
            )}
          />
        </div>
        <div>
          <p className="text-xs text-muted-foreground uppercase">Status</p>
          <p
            className={cn(
              "font-medium text-sm uppercase",
              isCompleted
                ? "text-green-500"
                : isRunning
                ? "text-primary"
                : "text-muted-foreground"
            )}
          >
            {status}
          </p>
        </div>
      </div>
    </div>
  );
}