"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Building2,
  CreditCard,
  Loader2,
  ShieldAlert,
  Sparkles,
  Users,
} from "lucide-react";
import { toast } from "sonner";

import { getAdminStats, type AdminStats } from "@/lib/admin-client";
import {
  getAdminActivity,
  type ActivityItem,
} from "@/lib/team-client";
import { ApiError } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const statCards = [
  {
    key: "totalUsers",
    label: "Total Users",
    icon: Users,
    href: "/admin/users",
    format: (value: number) => value.toString(),
  },
  {
    key: "totalWorkspaces",
    label: "Workspaces",
    icon: Building2,
    href: "/admin/workspaces",
    format: (value: number) => value.toString(),
  },
  {
    key: "totalRevenue",
    label: "Revenue (Paid)",
    icon: CreditCard,
    href: "/admin/payments",
    format: (value: number) => `$${value.toLocaleString()}`,
  },
  {
    key: "blockedUsers",
    label: "Blocked Users",
    icon: ShieldAlert,
    href: "/admin/users?status=blocked",
    format: (value: number) => value.toString(),
  },
] as const;

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      Promise.all([getAdminStats(), getAdminActivity()])
        .then(([statsData, activityData]) => {
          setStats(statsData);
          setActivity(activityData.slice(0, 8));
        })
        .catch((error) => {
          const message =
            error instanceof ApiError ? error.message : "Stats load failed.";
          toast.error(message);
        })
        .finally(() => setLoading(false));
    }, 0);
    return () => window.clearTimeout(handle);
  }, []);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Platform Overview</h1>
        <p className="text-sm text-muted-foreground">
          Poore platform ki health aur activity ka summary.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24 gap-3">
          <Loader2 className="size-5 animate-spin text-primary" />
          <span className="text-sm text-muted-foreground">Loading stats…</span>
        </div>
      ) : stats ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {statCards.map((card) => (
              <Link key={card.key} href={card.href}>
                <Card className="border-border/60 bg-card/50 transition-colors hover:border-primary/40">
                  <CardHeader className="pb-2">
                    <CardDescription className="flex items-center justify-between">
                      {card.label}
                      <card.icon className="size-4 text-muted-foreground" />
                    </CardDescription>
                    <CardTitle className="text-3xl tabular-nums">
                      {card.format(stats[card.key])}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="hidden" />
                </Card>
              </Link>
            ))}
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <Card className="border-border/60 bg-card/50">
              <CardHeader className="pb-2">
                <CardDescription>Superadmins</CardDescription>
                <CardTitle className="text-2xl tabular-nums">
                  {stats.superadmins}
                </CardTitle>
              </CardHeader>
              <CardContent className="hidden" />
            </Card>
            <Card className="border-border/60 bg-card/50">
              <CardHeader className="pb-2">
                <CardDescription>Pending Payments</CardDescription>
                <CardTitle className="text-2xl tabular-nums">
                  {stats.pendingPayments}
                </CardTitle>
              </CardHeader>
              <CardContent className="hidden" />
            </Card>
            <Card className="border-border/60 bg-card/50">
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-1.5">
                  <Sparkles className="size-4 text-primary" />
                  Pending Feature Requests
                </CardDescription>
                <CardTitle className="text-2xl tabular-nums">
                  {stats.pendingFeatureRequests}
                </CardTitle>
              </CardHeader>
              <CardContent className="hidden" />
            </Card>
          </div>

          {stats.pendingFeatureRequests > 0 ? (
            <Card className="border-yellow-500/40 bg-yellow-500/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base text-yellow-600 dark:text-yellow-500">
                  <Sparkles className="size-4" />
                  {stats.pendingFeatureRequests} AI feature request(s)
                  pending hain
                </CardTitle>
                <CardDescription>
                  Workspaces page se review kar ke approve ya revoke karein.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button size="sm" variant="outline" asChild>
                  <Link href="/admin/workspaces">Review Now</Link>
                </Button>
              </CardContent>
            </Card>
          ) : null}

          {activity.length > 0 ? (
            <Card className="border-border/60 bg-card/50">
              <CardHeader>
                <CardTitle className="text-base">Recent Platform Activity</CardTitle>
                <CardDescription>Latest events across all workspaces</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2.5">
                {activity.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-border/60 px-3 py-2"
                  >
                    <p className="min-w-0 truncate text-sm">
                      <span className="font-medium">
                        {item.actorName ?? "System"}
                      </span>{" "}
                      <span className="text-muted-foreground">
                        {item.action}
                      </span>{" "}
                      {item.targetSummary ? (
                        <span>{item.targetSummary}</span>
                      ) : null}
                    </p>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {new Date(item.createdAt).toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
