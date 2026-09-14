"use client";

import Link from "next/link";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { apiFetch, ApiError } from "@/lib/api-client";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ForgotPasswordResponse {
  message: string;
  resetToken?: string;
}

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [result, setResult] = useState<ForgotPasswordResponse | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    try {
      const data = await apiFetch<ForgotPasswordResponse>(
        "/auth/forgot-password",
        { method: "POST", body: { email }, skipAuth: true }
      );
      setResult(data);
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : "Request failed. Please try again.";
      toast.error(message);
    }
    setLoading(false);
  }

  return (
    <Card className="border-border/60 bg-transparent shadow-none backdrop-blur-none">
      <CardHeader>
        <CardTitle className="text-2xl">Forgot password?</CardTitle>
        <CardDescription>
          Enter your email and we&apos;ll send you a reset link.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {result ? (
          <>
            <Alert className="border-green-500/40 bg-green-500/10 text-green-600 dark:text-green-400">
              <AlertDescription>{result.message}</AlertDescription>
            </Alert>
            {result.resetToken ? (
              <div className="space-y-2 rounded-lg bg-muted p-4">
                <p className="text-xs text-muted-foreground">
                  Dev mode (email service abhi connected nahi) — direct reset
                  link:
                </p>
                <Button variant="outline" size="sm" asChild className="w-full">
                  <Link
                    href={`/reset-password?token=${encodeURIComponent(result.resetToken)}`}
                  >
                    Reset password now →
                  </Link>
                </Button>
              </div>
            ) : null}
          </>
        ) : (
          <form id="forgot-form" onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>
          </form>
        )}
      </CardContent>
      <CardFooter className="flex-col gap-3">
        {!result ? (
          <Button
            type="submit"
            form="forgot-form"
            className="w-full"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" />
                Sending…
              </>
            ) : (
              "Send Reset Link"
            )}
          </Button>
        ) : (
          <Button variant="outline" className="w-full" asChild>
            <Link href="/login">Back to login</Link>
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
