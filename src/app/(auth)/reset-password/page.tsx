"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { apiFetch, ApiError } from "@/lib/api-client";
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

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    setSubmitting(true);
    try {
      await apiFetch("/auth/reset-password", {
        method: "POST",
        body: { token, newPassword },
        skipAuth: true,
      });
      toast.success("Password updated! Please login with your new password.");
      setDone(true);
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : "Reset failed. Please try again.";
      toast.error(message);
    }
    setSubmitting(false);
  }

  return (
    <Card className="border-border/60 bg-transparent shadow-none backdrop-blur-none">
      <CardHeader>
        <CardTitle className="text-2xl">Set new password</CardTitle>
        <CardDescription>
          Choose a strong password for your account.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {done ? (
          <p className="rounded-lg bg-muted p-4 text-sm text-muted-foreground">
            Password successfully updated. You can now login.
          </p>
        ) : !token ? (
          <p className="rounded-lg bg-muted p-4 text-sm text-muted-foreground">
            Reset link is missing or invalid. Please request a new one from the
            forgot password page.
          </p>
        ) : (
          <form
            id="reset-form"
            onSubmit={handleSubmit}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="newPassword">New password</Label>
              <Input
                id="newPassword"
                type="password"
                placeholder="Min. 8 characters, 1 letter + 1 number"
                minLength={8}
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm new password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                required
              />
            </div>
          </form>
        )}
      </CardContent>
      <CardFooter className="flex-col gap-3">
        {!done && token ? (
          <Button
            type="submit"
            form="reset-form"
            className="w-full"
            disabled={submitting}
          >
            {submitting ? (
              <>
                <Loader2 className="animate-spin" />
                Updating…
              </>
            ) : (
              "Update Password"
            )}
          </Button>
        ) : (
          <Button variant="outline" className="w-full" asChild>
            <Link href="/login">Go to login</Link>
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}
