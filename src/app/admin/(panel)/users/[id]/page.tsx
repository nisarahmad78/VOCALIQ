"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  ArrowLeft,
  Ban,
  Building2,
  CheckCircle2,
  Eye,
  Loader2,
  MailCheck,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";

import {
  blockUser,
  getAdminUserDetail,
  impersonateUser,
  unblockUser,
  type AdminUserDetail as UserDetailType,
} from "@/lib/admin-client";
import { useAuth } from "@/components/providers/auth-provider";
import { ApiError } from "@/lib/api-client";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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

export default function AdminUserDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { startImpersonation } = useAuth();
  const [user, setUser] = useState<UserDetailType | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAdminUserDetail(params.id);
      setUser(data);
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : "User load failed.";
      toast.error(message);
    }
    setLoading(false);
  }, [params.id]);

  useEffect(() => {
    const handle = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(handle);
  }, [load]);

  async function toggleBlock() {
    if (!user) return;
    setBusy(true);
    try {
      const updated = user.isBlocked
        ? await unblockUser(user.id)
        : await blockUser(user.id);
      setUser((prev) =>
        prev ? { ...prev, isBlocked: updated.isBlocked } : prev
      );
      toast.success(updated.isBlocked ? "User blocked" : "User unblocked");
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : "Action failed.";
      toast.error(message);
    }
    setBusy(false);
  }

  async function handleImpersonate() {
    if (!user) return;
    setBusy(true);
    try {
      const session = await impersonateUser(user.id);
      startImpersonation(session);
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : "Failed.";
      toast.error(message);
    }
    setBusy(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-3 py-24">
        <Loader2 className="size-5 animate-spin text-primary" />
        <span className="text-sm text-muted-foreground">Loading user…</span>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="py-16 text-center">
        <p className="text-muted-foreground">User not found.</p>
        <Button variant="outline" className="mt-4" asChild>
          <Link href="/admin/users">Back to users</Link>
        </Button>
      </div>
    );
  }

  const initials =
    (user.name || user.email)
      .split(/[\s@.]/)
      .filter(Boolean)
      .map((part) => part[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "U";

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="ghost" size="icon-sm" asChild>
          <Link href="/admin/users" aria-label="Back">
            <ArrowLeft />
          </Link>
        </Button>
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold tracking-tight">User Details</h1>
          <p className="text-sm text-muted-foreground">{user.email}</p>
        </div>
      </div>

      <Card className="border-border/60 bg-card/50">
        <CardContent className="flex flex-wrap items-center gap-4 p-5">
          <Avatar className="size-14">
            <AvatarFallback className="bg-primary/20 text-lg font-semibold text-primary">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-2 text-lg font-semibold">
              {user.name}
              {user.role === "SUPERADMIN" ? (
                <Badge className="gap-1 bg-red-500/15 text-red-500 hover:bg-red-500/15">
                  <ShieldCheck className="size-3" />
                  Superadmin
                </Badge>
              ) : null}
              {user.isBlocked ? (
                <Badge variant="secondary" className="bg-red-500/15 text-red-500">
                  Blocked
                </Badge>
              ) : (
                <Badge variant="secondary" className="bg-green-500/15 text-green-500">
                  Active
                </Badge>
              )}
            </p>
            <p className="truncate text-sm text-muted-foreground">{user.email}</p>
          </div>
          {user.role !== "SUPERADMIN" ? (
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={() => void handleImpersonate()} disabled={busy}>
                <Eye />
                View As
              </Button>
              <Button
                size="sm"
                variant={user.isBlocked ? "outline" : "destructive"}
                onClick={() => void toggleBlock()}
                disabled={busy}
              >
                {user.isBlocked ? (
                  <>
                    <CheckCircle2 />
                    Unblock
                  </>
                ) : (
                  <>
                    <Ban />
                    Block
                  </>
                )}
              </Button>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-3">
        <InfoTile label="Email Verified" value={user.emailVerified ? "Yes" : "No"} />
        <InfoTile label="Member Since" value={new Date(user.createdAt).toLocaleDateString()} />
        <InfoTile
          label="Last Login"
          value={
            user.lastLoginAt
              ? new Date(user.lastLoginAt).toLocaleString()
              : "Never"
          }
        />
      </div>

      <Card className="border-border/60 bg-card/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Building2 className="size-4 text-primary" />
            Workspaces ({user.workspaces.length})
          </CardTitle>
          <CardDescription>Is user ke sari workspaces.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {user.workspaces.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              Koi workspace nahi.
            </p>
          ) : (
            user.workspaces.map((workspace) => (
              <div
                key={workspace.workspaceId}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border/60 px-3 py-2.5"
              >
                <div>
                  <Link
                    href={`/admin/workspaces/${workspace.workspaceId}`}
                    className="text-sm font-medium underline-offset-4 hover:underline"
                  >
                    {workspace.workspaceName}
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    /{workspace.workspaceSlug} · joined{" "}
                    {new Date(workspace.joinedAt).toLocaleDateString()}
                  </p>
                </div>
                <Badge variant={workspace.role === "OWNER" ? "default" : "outline"}>
                  {workspace.role}
                  {workspace.isOwner ? " 👑" : ""}
                </Badge>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {user.isBlocked ? (
        <Card className="border-red-500/40 bg-red-500/5">
          <CardContent className="flex items-center gap-3 p-4">
            <ShieldAlert className="size-5 shrink-0 text-red-500" />
            <p className="text-sm text-red-600 dark:text-red-400">
              Ye account block hai — login aur refresh dono reject honge.
            </p>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <Card className="border-border/60 bg-card/50">
      <CardHeader className="pb-1">
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-sm font-medium">{value}</CardTitle>
      </CardHeader>
      <CardContent className="hidden" />
    </Card>
  );
}
