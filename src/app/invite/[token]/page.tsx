"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { Building2, CheckCircle2, Loader2, XCircle } from "lucide-react";
import { toast } from "sonner";

import { Logo } from "@/components/logo";
import { useAuth } from "@/components/providers/auth-provider";
import {
  acceptInvite,
  getInvitePreview,
  type InvitePreview,
} from "@/lib/team-client";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

function InviteInner() {
  const params = useParams<{ token: string }>();
  const router = useRouter();
  const { user, isLoading, refreshWorkspaces, switchWorkspace } = useAuth();
  const [preview, setPreview] = useState<InvitePreview | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const handle = window.setTimeout(() => {
      getInvitePreview(params.token)
        .then((data) => {
          setPreview(data);
          setLoading(false);
        })
        .catch((err) => {
          setError(err.message ?? "Invalid invite");
          setLoading(false);
        });
    }, 0);
    return () => window.clearTimeout(handle);
  }, [params.token]);

  async function handleAccept() {
    setAccepting(true);
    try {
      const result = await acceptInvite(params.token);
      await refreshWorkspaces();
      if (result.workspaceId) switchWorkspace(result.workspaceId);
      toast.success(result.message);
      setAccepted(true);
      setTimeout(() => router.push("/dashboard"), 1200);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Accept failed");
      setAccepting(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,--theme(--color-primary/15%),transparent)]"
      />
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>

        {loading ? (
          <Card className="border-border/60 bg-card/80">
            <CardContent className="flex items-center justify-center gap-3 py-14">
              <Loader2 className="size-5 animate-spin text-primary" />
              <span className="text-sm text-muted-foreground">Loading invite…</span>
            </CardContent>
          </Card>
        ) : error || !preview ? (
          <Card className="border-red-500/40 bg-card/80">
            <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
              <XCircle className="size-10 text-red-500" />
              <p className="font-medium">Invite unavailable</p>
              <p className="text-sm text-muted-foreground">{error}</p>
              <Button variant="outline" asChild className="mt-2">
                <Link href="/dashboard">Go to Dashboard</Link>
              </Button>
            </CardContent>
          </Card>
        ) : accepted ? (
          <Card className="border-green-500/40 bg-card/80">
            <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
              <CheckCircle2 className="size-10 text-green-500" />
              <p className="font-medium">Welcome to the team!</p>
              <p className="text-sm text-muted-foreground">Redirecting…</p>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-border/60 bg-card/80 shadow-xl backdrop-blur">
            <CardHeader className="items-center text-center">
              <span className="mx-auto mb-2 flex size-12 items-center justify-center rounded-xl bg-primary/15 text-primary">
                <Building2 className="size-6" />
              </span>
              <CardTitle className="text-xl">
                Join &ldquo;{preview.workspaceName}&rdquo;
              </CardTitle>
              <CardDescription>
                <strong>{preview.inviterName}</strong> ne aap ko{" "}
                <Badge variant="secondary" className="mx-1">{preview.role}</Badge>{" "}
                ke tor par invite kiya hai.
              </CardDescription>
            </CardHeader>
            <Separator />
            <CardContent className="space-y-4 pt-5">
              <div className="rounded-lg bg-muted p-3 text-center text-sm">
                Ye invite is email ke liye hai: <strong>{preview.email}</strong>
              </div>

              {!user && !isLoading ? (
                <div className="space-y-2">
                  <Button className="w-full" asChild>
                    <Link href={`/login?next=${encodeURIComponent(`/invite/${params.token}`)}`}>
                      Login to Accept
                    </Link>
                  </Button>
                  <Button variant="outline" className="w-full" asChild>
                    <Link href={`/signup?next=${encodeURIComponent(`/invite/${params.token}`)}`}>
                      Create Account
                    </Link>
                  </Button>
                </div>
              ) : user ? (
                user.email.toLowerCase() === preview.email.toLowerCase() ? (
                  <Button
                    className="w-full"
                    onClick={() => void handleAccept()}
                    disabled={accepting}
                  >
                    {accepting ? (
                      <>
                        <Loader2 className="animate-spin" />
                        Joining…
                      </>
                    ) : (
                      "Accept & Join Workspace"
                    )}
                  </Button>
                ) : (
                  <div className="space-y-2">
                    <Alert className="border-yellow-500/40 bg-yellow-500/10 text-yellow-600 dark:text-yellow-500">
                      <XCircle className="size-4" />
                      <AlertDescription className="text-sm">
                        Aap <b>{user.email}</b> se login hain lekin ye invite{" "}
                        <b>{preview.email}</b> ke liye hai.
                      </AlertDescription>
                    </Alert>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() =>
                        router.push(
                          `/login?next=${encodeURIComponent(`/invite/${params.token}`)}`
                        )
                      }
                    >
                      Switch Account
                    </Button>
                  </div>
                )
              ) : null}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

export default function InvitePage() {
  return (
    <Suspense>
      <InviteInner />
    </Suspense>
  );
}