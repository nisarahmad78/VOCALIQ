import Link from "next/link";
import { Mic, Play, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,--theme(--color-primary/20%),transparent)]"
      />
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-24 sm:px-6 lg:grid-cols-2">
        <div className="space-y-6 text-center lg:text-left">
          <Badge variant="secondary" className="gap-1.5 px-3 py-1 text-xs">
            <Sparkles className="size-3.5 text-primary" />
            Phase 1 MVP — Browser voice testing
          </Badge>
          <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-5xl xl:text-6xl">
            AI Voice Agent for your{" "}
            <span className="bg-gradient-to-r from-primary via-fuchsia-400 to-cyan-400 bg-clip-text text-transparent">
              Customer Support
            </span>
          </h1>
          <p className="mx-auto max-w-xl text-pretty text-lg text-muted-foreground lg:mx-0">
            Upload your company knowledge, configure your agent, and let AI
            answer customer calls automatically — 24/7, in English and Urdu.
          </p>
          <div className="flex flex-col justify-center gap-3 sm:flex-row lg:justify-start">
            <Button size="lg" className="h-11 px-6 text-base" asChild>
              <Link href="/signup">Get Started Free</Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-11 px-6 text-base"
              asChild
            >
              <Link href="/dashboard/test-calls">
                <Play className="size-4" />
                Try Demo
              </Link>
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            No credit card required · Setup in minutes
          </p>
        </div>

        <div className="flex justify-center">
          <div className="relative w-full max-w-md rounded-2xl border border-border/60 bg-card/80 p-8 shadow-2xl backdrop-blur">
            <div className="flex flex-col items-center gap-6 text-center">
              <div className="relative flex size-28 items-center justify-center">
                <span className="absolute inset-0 animate-ping rounded-full bg-primary/20 [animation-duration:2s]" />
                <span className="absolute inset-2 rounded-full bg-primary/15" />
                <span className="relative flex size-20 items-center justify-center rounded-full bg-gradient-to-br from-primary to-fuchsia-600 shadow-lg shadow-primary/30">
                  <Mic className="size-9 text-white" />
                </span>
              </div>
              <div className="space-y-1">
                <p className="font-semibold">AI Support Agent</p>
                <p className="text-sm text-muted-foreground">
                  &ldquo;How can I help you today?&rdquo;
                </p>
              </div>
              <div className="w-full space-y-2 rounded-xl bg-background/60 p-4 text-left">
                <div className="flex items-center gap-2">
                  <span className="size-2 shrink-0 animate-pulse rounded-full bg-green-500" />
                  <p className="text-xs font-medium text-green-500">
                    Listening…
                  </p>
                  <span className="ml-auto flex items-end gap-0.5" aria-hidden>
                    {[10, 18, 12, 22, 14].map((height, i) => (
                      <span
                        key={i}
                        className="w-1 animate-pulse rounded-full bg-primary"
                        style={{
                          height: `${height}px`,
                          animationDelay: `${i * 120}ms`,
                        }}
                      />
                    ))}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground italic">
                  &ldquo;What is your return policy?&rdquo;
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
