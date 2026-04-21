"use client";

import { useEffect, useState } from "react";
import { SearchBar } from "@/components/SearchBar";
import { Shield, Zap, Share2, Globe, Radar, Lock, Terminal } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Home() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <main className="min-h-screen flex flex-col relative overflow-hidden bg-black">
      {/* Animated grid background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,255,0.03)_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,black_40%,transparent_100%)]" />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black" />
      </div>

      {/* Floating radar animation */}
      <div className="absolute top-20 right-10 w-64 h-64 opacity-20 pointer-events-none">
        <RadarIcon />
      </div>
      <div className="absolute bottom-20 left-10 w-48 h-48 opacity-10 pointer-events-none">
        <RadarIcon />
      </div>

      {/* Hero Section */}
      <section className="flex-1 flex flex-col items-center justify-center px-4 py-20 relative z-10">
        {/* Animated title */}
        <div className="text-center space-y-6 mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-sm font-mono">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            DNS Reconnaissance Tool
          </div>

          <h1 className="text-6xl md:text-8xl font-bold tracking-tighter">
            <span className="relative">
              <span className="absolute inset-0 bg-cyan-500/20 blur-3xl" />
              <span className="relative text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-400 animate-gradient-x">
                SubScan
              </span>
            </span>
          </h1>

          <p className="text-lg md:text-xl text-cyan-300/70 font-mono max-w-xl mx-auto">
            Real-time subdomain enumeration using multiple DNS sources
          </p>
        </div>

        {/* Search */}
        <div className="w-full mb-16">
          <SearchBar />
        </div>

        {/* Stats bar */}
        <div className="flex items-center gap-8 md:gap-16 text-center">
          <div className="flex flex-col items-center">
            <Globe className="w-5 h-5 text-cyan-400 mb-2" />
            <span className="text-2xl font-bold text-white">5+</span>
            <span className="text-xs text-cyan-500/60 font-mono">Data Sources</span>
          </div>
          <div className="w-px h-12 bg-cyan-500/20" />
          <div className="flex flex-col items-center">
            <Zap className="w-5 h-5 text-cyan-400 mb-2" />
            <span className="text-2xl font-bold text-white">Real-time</span>
            <span className="text-xs text-cyan-500/60 font-mono">Live Results</span>
          </div>
          <div className="w-px h-12 bg-cyan-500/20" />
          <div className="flex flex-col items-center">
            <Share2 className="w-5 h-5 text-cyan-400 mb-2" />
            <span className="text-2xl font-bold text-white">Share</span>
            <span className="text-xs text-cyan-500/60 font-mono">Export Results</span>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="relative z-10 py-16 border-t border-cyan-500/10 bg-black/50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-6">
            <FeatureCard
              icon={Radar}
              title="Active Scanning"
              description="Multiple DNS enumeration sources queried in parallel for comprehensive coverage"
              delay={0}
              mounted={mounted}
            />
            <FeatureCard
              icon={Terminal}
              title="Live Feed"
              description="Real-time subdomain discovery streamed directly to your terminal view"
              delay={1}
              mounted={mounted}
            />
            <FeatureCard
              icon={Lock}
              title="Security First"
              description="Built for security professionals. No data stored, scans are ephemeral"
              delay={2}
              mounted={mounted}
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-cyan-500/10 relative z-10">
        <div className="max-w-6xl mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-cyan-500/50 font-mono">
            <Shield className="w-4 h-4" />
            <span>Built for the security community</span>
          </div>
          <div className="text-sm text-cyan-500/30 font-mono">
            v1.0.0
          </div>
        </div>
      </footer>

      {/* CSS for animations */}
      <style jsx>{`
        @keyframes gradient-x {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .animate-gradient-x {
          background-size: 200% 200%;
          animation: gradient-x 3s ease infinite;
        }
        @keyframes scan {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .animate-scan {
          animation: scan 4s linear infinite;
        }
      `}</style>
    </main>
  );
}

function FeatureCard({ icon: Icon, title, description, delay, mounted }: {
  icon: React.ElementType;
  title: string;
  description: string;
  delay: number;
  mounted: boolean;
}) {
  return (
    <div
      className={cn(
        "group p-6 rounded-xl bg-cyan-950/10 border border-cyan-500/10 hover:border-cyan-500/30 transition-all duration-500",
        mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      )}
      style={{ transitionDelay: `${delay * 100}ms` }}
    >
      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
        <Icon className="w-6 h-6 text-cyan-400" />
      </div>
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      <p className="text-sm text-cyan-300/60 leading-relaxed">{description}</p>
    </div>
  );
}

function RadarIcon() {
  return (
    <svg viewBox="0 0 200 200" className="w-full h-full">
      <circle cx="100" cy="100" r="90" fill="none" stroke="rgba(0,255,255,0.2)" strokeWidth="1" />
      <circle cx="100" cy="100" r="60" fill="none" stroke="rgba(0,255,255,0.15)" strokeWidth="1" />
      <circle cx="100" cy="100" r="30" fill="none" stroke="rgba(0,255,255,0.1)" strokeWidth="1" />
      <line x1="100" y1="10" x2="100" y2="190" stroke="rgba(0,255,255,0.1)" strokeWidth="1" />
      <line x1="10" y1="100" x2="190" y2="100" stroke="rgba(0,255,255,0.1)" strokeWidth="1" />
      <line x1="29" y1="29" x2="171" y2="171" stroke="rgba(0,255,255,0.1)" strokeWidth="1" />
      <line x1="171" y1="29" x2="29" y2="171" stroke="rgba(0,255,255,0.1)" strokeWidth="1" />
      <circle cx="100" cy="100" r="4" fill="rgba(0,255,255,0.5)" />
      <circle cx="100" cy="100" r="2" fill="rgba(0,255,255,0.8)">
        <animateTransform attributeName="transform" type="rotate" from="0 100 100" to="360 100 100" dur="4s" repeatCount="indefinite" />
      </circle>
    </svg>
  );
}