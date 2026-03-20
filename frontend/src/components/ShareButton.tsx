"use client";

import { useState } from "react";
import { Share2, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface ShareButtonProps {
  shareId: string;
  domain: string;
  totalFound: number;
  className?: string;
}

export function ShareButton({
  shareId,
  domain,
  totalFound,
  className,
}: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL}/results/${shareId}`;

  const handleShare = async () => {
    try {
      // Try native share API first (mobile)
      if (navigator.share) {
        await navigator.share({
          title: `SubScan Results for ${domain}`,
          text: `Found ${totalFound} subdomains for ${domain}`,
          url: shareUrl,
        });
      } else {
        // Fallback to clipboard
        await navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (err) {
      // User cancelled or error
      console.error("Share failed:", err);
    }
  };

  const handleTwitterShare = () => {
    const text = encodeURIComponent(
      `🔍 Found ${totalFound} subdomains for ${domain} using @SubScan\n\n`
    );
    const url = encodeURIComponent(shareUrl);
    window.open(
      `https://twitter.com/intent/tweet?text=${text}&url=${url}`,
      "_blank"
    );
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <button
        onClick={handleShare}
        className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-lg
          hover:border-primary/50 transition-colors text-sm"
      >
        {copied ? (
          <>
            <Check className="w-4 h-4 text-green-500" />
            <span className="text-green-500">Copied!</span>
          </>
        ) : (
          <>
            <Share2 className="w-4 h-4" />
            <span>Share</span>
          </>
        )}
      </button>

      <button
        onClick={handleTwitterShare}
        className="flex items-center gap-2 px-4 py-2 bg-[#1DA1F2]/10 border border-[#1DA1F2]/30 rounded-lg
          hover:border-[#1DA1F2]/50 transition-colors text-sm text-[#1DA1F2]"
      >
        <svg
          viewBox="0 0 24 24"
          className="w-4 h-4 fill-current"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
        <span>Tweet</span>
      </button>
    </div>
  );
}