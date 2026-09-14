"use client";

import { XCircle, ArrowLeft, Sparkles } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function BillingCancelPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-8">
        <div className="relative mx-auto w-24 h-24">
          <div className="relative flex items-center justify-center w-24 h-24 rounded-full bg-muted/50 border-2 border-border">
            <XCircle className="size-12 text-muted-foreground" strokeWidth={1.5} />
          </div>
        </div>

        <div className="space-y-3">
          <h1 className="text-3xl font-bold text-foreground">Payment Cancelled</h1>
          <p className="text-muted-foreground text-lg">
            No worries — your current plan is still active. You can upgrade anytime.
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card/50 p-6 space-y-3 text-left">
          <p className="text-sm font-medium text-foreground">Why upgrade to Pro?</p>
          <ul className="text-sm text-muted-foreground space-y-2">
            <li className="flex items-start gap-2">
              <Sparkles className="size-4 text-primary shrink-0 mt-0.5" />
              <span>25 team members instead of 3 — grow your team</span>
            </li>
            <li className="flex items-start gap-2">
              <Sparkles className="size-4 text-primary shrink-0 mt-0.5" />
              <span>100 knowledge documents for richer AI context</span>
            </li>
            <li className="flex items-start gap-2">
              <Sparkles className="size-4 text-primary shrink-0 mt-0.5" />
              <span>5,000 conversations/month — 50× more coverage</span>
            </li>
          </ul>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            asChild
            variant="outline"
            className="flex-1 gap-2"
            id="billing-cancel-back"
          >
            <Link href="/dashboard/settings?tab=billing">
              <ArrowLeft className="size-4" />
              Back to Dashboard
            </Link>
          </Button>
          <Button
            asChild
            className="flex-1 gap-2 bg-primary hover:bg-primary/90"
            id="billing-cancel-retry"
          >
            <Link href="/dashboard/settings?tab=billing&upgrade=true">
              <Sparkles className="size-4" />
              Try Again
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
