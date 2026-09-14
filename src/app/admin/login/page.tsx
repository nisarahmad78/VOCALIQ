"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader2, ShieldCheck, Lock } from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "@/components/providers/auth-provider";
import { ApiError } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function AdminLoginPage() {
  const router = useRouter();
  const { user, isLoading, adminLogin } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoading && user?.role === "SUPERADMIN") {
      router.replace("/admin");
    }
  }, [isLoading, user, router]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    try {
      await adminLogin(email, password);
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : "Login failed.";
      toast.error(message);
      setSubmitting(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-sidebar px-4">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,--theme(--color-red-500/12%),transparent)]"
      />
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <span className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-red-500/15 text-red-500 shadow-lg shadow-red-500/10">
            <ShieldCheck className="size-7" />
          </span>
          <h1 className="text-2xl font-bold tracking-tight">
            VocalIQ Admin Console
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Restricted area — sirf superadmins ke liye
          </p>
        </div>

        <div className="rounded-2xl border border-border/60 bg-card/80 p-6 shadow-xl backdrop-blur sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="admin-email">Admin email</Label>
              <Input
                id="admin-email"
                type="email"
                placeholder="admin@company.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin-password">Password</Label>
              <Input
                id="admin-password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-red-600 text-white hover:bg-red-700"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="animate-spin" />
                  Verifying…
                </>
              ) : (
                <>
                  <Lock />
                  Sign in to Console
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 border-t border-border/60 pt-4 text-center">
            <Link
              href="/"
              className="text-xs text-muted-foreground underline-offset-4 hover:underline"
            >
              ← Back to main website
            </Link>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Ye portal sirf platform administrators ke liye hai. Customer account
          hai?{" "}
          <Link
            href="/login"
            className="text-primary underline-offset-4 hover:underline"
          >
            User login
          </Link>
        </p>
      </div>
    </div>
  );
}
