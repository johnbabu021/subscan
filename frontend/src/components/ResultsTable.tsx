"use client";

import { useState } from "react";
import { Copy, Check, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

interface Subdomain {
  id: string;
  subdomain: string;
  ip_address?: string;
  http_status?: number;
}

interface ResultsTableProps {
  subdomains: Subdomain[];
  className?: string;
}

export function ResultsTable({ subdomains, className }: ResultsTableProps) {
  const [copied, setCopied] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const totalPages = Math.ceil(subdomains.length / itemsPerPage);
  const paginatedSubdomains = subdomains.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(text);
      setTimeout(() => setCopied(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  if (subdomains.length === 0) {
    return (
      <div
        className={cn(
          "bg-card border border-border rounded-lg p-8 text-center",
          className
        )}
      >
        <p className="text-muted-foreground">No subdomains discovered yet</p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Results count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {paginatedSubdomains.length} of {subdomains.length} subdomains
        </p>
        <button
          onClick={() => copyToClipboard(subdomains.map((s) => s.subdomain).join("\n"))}
          className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              Copy All
            </>
          )}
        </button>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  #
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Subdomain
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  IP Address
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  HTTP Status
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {paginatedSubdomains.map((sub, index) => (
                <tr
                  key={sub.id}
                  className="hover:bg-muted/20 transition-colors"
                >
                  <td className="px-4 py-3 text-sm text-muted-foreground font-mono">
                    {(currentPage - 1) * itemsPerPage + index + 1}
                  </td>
                  <td className="px-4 py-3 text-sm font-mono text-terminal-green">
                    {sub.subdomain}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground font-mono">
                    {sub.ip_address || "-"}
                  </td>
                  <td className="px-4 py-3">
                    {sub.http_status ? (
                      <span
                        className={cn(
                          "inline-flex px-2 py-0.5 rounded text-xs font-mono",
                          sub.http_status >= 200 && sub.http_status < 300
                            ? "bg-green-500/20 text-green-400"
                            : sub.http_status >= 300 && sub.http_status < 400
                            ? "bg-yellow-500/20 text-yellow-400"
                            : "bg-red-500/20 text-red-400"
                        )}
                      >
                        {sub.http_status}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <a
                      href={`http://${sub.subdomain}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-primary hover:text-primary/80 transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 text-sm bg-muted rounded hover:bg-muted/80 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 text-sm bg-muted rounded hover:bg-muted/80 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}