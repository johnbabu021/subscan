import { SearchBar } from "@/components/SearchBar";
import { Shield, Zap, Share2 } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <section className="flex-1 flex flex-col items-center justify-center px-4 py-20 relative overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/10 via-background to-background" />
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5" />

        {/* Content */}
        <div className="relative z-10 w-full max-w-4xl mx-auto text-center space-y-8">
          {/* Logo/Title */}
          <div className="space-y-4">
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
              <span className="text-primary">Sub</span>
              <span className="text-foreground">Scan</span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
              Discover subdomains instantly with real-time scanning
            </p>
          </div>

          {/* Search */}
          <div className="pt-8">
            <SearchBar />
          </div>

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-8 pt-12">
            <div className="flex flex-col items-center gap-3 p-6 rounded-lg bg-card/50 border border-border/50">
              <div className="p-3 rounded-full bg-primary/10">
                <Zap className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold">Fast</h3>
              <p className="text-sm text-muted-foreground text-center">
                Real-time subdomain discovery powered by multiple sources
              </p>
            </div>

            <div className="flex flex-col items-center gap-3 p-6 rounded-lg bg-card/50 border border-border/50">
              <div className="p-3 rounded-full bg-green-500/10">
                <Shield className="w-6 h-6 text-green-500" />
              </div>
              <h3 className="text-lg font-semibold">Secure</h3>
              <p className="text-sm text-muted-foreground text-center">
                Built for security professionals with privacy in mind
              </p>
            </div>

            <div className="flex flex-col items-center gap-3 p-6 rounded-lg bg-card/50 border border-border/50">
              <div className="p-3 rounded-full bg-yellow-500/10">
                <Share2 className="w-6 h-6 text-yellow-500" />
              </div>
              <h3 className="text-lg font-semibold">Shareable</h3>
              <p className="text-sm text-muted-foreground text-center">
                Share results with unique links for easy collaboration
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-6 border-t border-border">
        <div className="max-w-6xl mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>Built for the security community</p>
        </div>
      </footer>
    </main>
  );
}