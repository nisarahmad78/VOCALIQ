"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";

import { apiFetch } from "@/lib/api-client";
import { Button } from "@/components/ui/button";

function VerifyEmailInner() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [state, setState] = useState<"verifying" | "success" | "error">(
    "verifying"
  );
  const [message, setMessage] = useState("");

  useEffect(() => {
    const handle = window.setTimeout(() => {
      if (!token) {
        setState("error");
        setMessage("Verification token missing hai.");
        return;
      }
      apiFetch("/auth/verify-email", { method: "POST", body: { token }, skipAuth: true })
        .then(() => setState("success"))
        .catch((error) => {
          setState("error");
          setMessage(
            error instanceof Error ? error.message : "Verification failed."
          );
        });
    }, 0);
    return () => window.clearTimeout(handle);
  }, [token]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      {state === "verifying" ? (
        <>
          <Loader2 className="size-10 animate-spin text-primary" />
          <p className="text-muted-foreground">Verifying your email…</p>
        </>
      ) : state === "success" ? (
        <>
          <CheckCircle2 className="size-12 text-green-500" />
          <h1 className="text-xl font-bold">Email verified!</h1>
          <p className="text-sm text-muted-foreground">
            Aap ka account ab poori tarah active hai.
          </p>
          <Button asChild className="mt-2">
            <Link href="/dashboard">Go to Dashboard</Link>
          </Button>
        </>
      ) : (
        <>
          <XCircle className="size-12 text-red-500" />
          <h1 className="text-xl font-bold">Verification failed</h1>
          <p className="max-w-sm text-sm text-muted-foreground">{message}</p>
          <Button variant="outline" asChild className="mt-2">
            <Link href="/dashboard/settings">Settings se dobara try karein</Link>
          </Button>
        </>
      )}
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailInner />
    </Suspense>
  );
}
