"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle, Sparkles, ArrowRight, Loader2 } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

function SuccessContent() {
  const router = useRouter();
  const params = useSearchParams();
  const plan = params.get("plan") ?? "pro";
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(timer);
          router.push("/dashboard/settings?tab=billing");
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [router]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-8">
        <div className="relative mx-auto w-24 h-24">
          <div className="absolute inset-0 rounded-full bg-green-500/20 animate-ping" />
          <div className="relative flex items-center justify-center w-24 h-24 rounded-full bg-green-500/10 border-2 border-green-500/30">
            <CheckCircle className="size-12 text-green-400" strokeWidth={1.5} />
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-center gap-2">
            <Sparkles className="size-5 text-primary" />
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
              Welcome to {plan.charAt(0).toUpperCase() + plan.slice(1)}!
            </h1>
          </div>
          <p className="text-muted-foreground text-lg">
            Your subscription is now active. All premium features have been unlocked.
          </p>
        </div>

        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-6 space-y-3">
          <p className="text-sm font-medium text-foreground">What you now have access to:</p>
          <ul className="text-sm text-muted-foreground space-y-2 text-left">
            {plan === "pro" ? (
              <>
                <li className="flex items-center gap-2"><CheckCircle className="size-4 text-green-400 shrink-0" /> 25 team seats</li>
                <li className="flex items-center gap-2"><CheckCircle className="size-4 text-green-400 shrink-0" /> 100 knowledge documents</li>
                <li className="flex items-center gap-2"><CheckCircle className="size-4 text-green-400 shrink-0" /> 5,000 conversations/month</li>
                <li className="flex items-center gap-2"><CheckCircle className="size-4 text-green-400 shrink-0" /> Priority support</li>
              </>
            ) : (
              <>
                <li className="flex items-center gap-2"><CheckCircle className="size-4 text-green-400 shrink-0" /> Unlimited team seats</li>
                <li className="flex items-center gap-2"><CheckCircle className="size-4 text-green-400 shrink-0" /> Unlimited documents</li>
                <li className="flex items-center gap-2"><CheckCircle className="size-4 text-green-400 shrink-0" /> Unlimited conversations</li>
                <li className="flex items-center gap-2"><CheckCircle className="size-4 text-green-400 shrink-0" /> Dedicated account manager</li>
              </>
            )}
          </ul>
        </div>

        <div className="space-y-3">
          <Button asChild className="w-full gap-2 h-12 text-base font-semibold" id="billing-success-go-to-dashboard">
            <Link href="/dashboard/settings?tab=billing">
              Go to Dashboard
              <ArrowRight className="size-4" />
            </Link>
          </Button>
          <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
            <Loader2 className="size-3 animate-spin" />
            Redirecting in {countdown}s…
          </p>
        </div>
      </div>
    </div>
  );
}

export default function BillingSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="size-6 animate-spin text-primary" />
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
