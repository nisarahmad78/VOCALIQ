"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Clock,
  Loader2,
  MessagesSquare,
  Users,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import {
  getWorkspaceDetail,
  setFeatureStatus,
  type FeatureKey,
  type FeatureStatus,
  type WorkspaceDetail as WorkspaceDetailType,
} from "@/lib/admin-client";
import { ApiError } from "@/lib/api-client";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const FEATURE_LABELS: Record<string, string> = {
  VOICE_AGENT: "Voice Agent",
  KNOWLEDGE_BASE: "Knowledge Base (RAG)",
  PHONE_CALLS: "Phone Calls",
  HUMAN_HANDOFF: "Human Handoff",
  ANALYTICS: "Analytics",
};

function FeatureStatusBadge({ status }: { status: FeatureStatus }) {
  if (status === "APPROVED") {
    return (
      <Badge variant="secondary" className="bg-green-500/15 text-green-500">
        <CheckCircle2 className="size-3" />
        Approved
      </Badge>
    );
  }
  if (status === "REVOKED") {
    return (
      <Badge variant="secondary" className="bg-red-500/15 text-red-500">
        <XCircle className="size-3" />
        Revoked
      </Badge>
    );
  }
  return (
    <Badge variant="secondary" className="bg-yellow-500/15 text-yellow-500">
      <Clock className="size-3" />
      Pending
    </Badge>
  );
}

export default function AdminWorkspaceDetailPage() {
  const params = useParams<{ id: string }>();
  const [detail, setDetail] = useState<WorkspaceDetailType | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingFeature, setUpdatingFeature] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getWorkspaceDetail(params.id);
      setDetail(data);
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : "Workspace load failed.";
      toast.error(message);
    }
    setLoading(false);
  }, [params.id]);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      void load();
    }, 0);
    return () => window.clearTimeout(handle);
  }, [load]);

  async function updateFeature(featureKey: FeatureKey, status: FeatureStatus) {
    setUpdatingFeature(`${featureKey}-${status}`);
    try {
      await setFeatureStatus(params.id, featureKey, status);
      toast.success(`${FEATURE_LABELS[featureKey] ?? featureKey} → ${status}`);
      await load();
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : "Update failed.";
      toast.error(message);
    }
    setUpdatingFeature(null);
  }

  if (loading && !detail) {
    return (
      <div className="flex items-center justify-center py-24 gap-3">
        <Loader2 className="size-5 animate-spin text-primary" />
        <span className="text-sm text-muted-foreground">
          Loading workspace…
        </span>
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="py-16 text-center">
        <p className="text-muted-foreground">Workspace not found.</p>
        <Button variant="outline" className="mt-4" asChild>
          <Link href="/admin/workspaces">Back to workspaces</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="ghost" size="icon-sm" asChild>
          <Link href="/admin/workspaces" aria-label="Back">
            <ArrowLeft />
          </Link>
        </Button>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-2xl font-bold tracking-tight">
            {detail.name}
          </h1>
          <p className="truncate text-sm text-muted-foreground">
            Owner: {detail.ownerName} · {detail.ownerEmail} · /{detail.slug}
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border/60 bg-card/50">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1.5">
              <Users className="size-4 text-muted-foreground" /> Members
            </CardDescription>
            <CardTitle className="text-2xl tabular-nums">
              {detail.members.length}
            </CardTitle>
          </CardHeader>
          <CardContent className="hidden" />
        </Card>
        <Card className="border-border/60 bg-card/50">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1.5">
              <BookOpen className="size-4 text-muted-foreground" /> Documents
            </CardDescription>
            <CardTitle className="text-2xl tabular-nums">
              {detail.usage.documents}
            </CardTitle>
          </CardHeader>
          <CardContent className="hidden" />
        </Card>
        <Card className="border-border/60 bg-card/50">
          <CardHeader className="pb-2">
            <CardDescription>Indexed Chunks</CardDescription>
            <CardTitle className="text-2xl tabular-nums">
              {detail.usage.chunks}
            </CardTitle>
          </CardHeader>
          <CardContent className="hidden" />
        </Card>
        <Card className="border-border/60 bg-card/50">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1.5">
              <MessagesSquare className="size-4 text-muted-foreground" />{" "}
              Conversations
            </CardDescription>
            <CardTitle className="text-2xl tabular-nums">
              {detail.usage.conversations}
            </CardTitle>
          </CardHeader>
          <CardContent className="hidden" />
        </Card>
      </div>

      <Card className="border-border/60 bg-card/50">
        <CardHeader>
          <CardTitle className="text-base">AI Features</CardTitle>
          <CardDescription>
            Har feature ko approve, revoke ya pending par set karein.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {detail.features.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Is workspace ke liye features abhi initialize nahi huay.
            </p>
          ) : (
            detail.features.map((feature) => (
              <div
                key={feature.featureKey}
                className="flex flex-wrap items-center gap-3 rounded-xl border border-border/60 p-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium">
                    {FEATURE_LABELS[feature.featureKey] ??
                      feature.featureKey}
                  </p>
                  <p className="font-mono text-xs text-muted-foreground">
                    {feature.featureKey}
                  </p>
                </div>
                <FeatureStatusBadge status={feature.status} />
                <div className="flex gap-1.5">
                  {(["APPROVED", "PENDING", "REVOKED"] as const).map(
                    (target) =>
                      feature.status !== target ? (
                        <Button
                          key={target}
                          size="sm"
                          variant={target === "REVOKED" ? "destructive" : "outline"}
                          disabled={
                            updatingFeature === `${feature.featureKey}-${target}`
                          }
                          onClick={() =>
                            void updateFeature(
                              feature.featureKey as FeatureKey,
                              target
                            )
                          }
                        >
                          {target === "APPROVED" ? "Approve" : target === "REVOKED" ? "Revoke" : "Set Pending"}
                        </Button>
                      ) : null
                  )}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card className="border-border/60 bg-card/50">
        <CardHeader>
          <CardTitle className="text-base">Payments</CardTitle>
          <CardDescription>Is workspace ki payment history.</CardDescription>
        </CardHeader>
        <CardContent>
          {detail.payments.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Koi payments nahi.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Plan</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {detail.payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell className="font-medium">{payment.plan}</TableCell>
                    <TableCell className="tabular-nums">
                      ${Number(payment.amount).toFixed(2)} {payment.currency}
                    </TableCell>
                    <TableCell>
                      <PaymentStatusBadge status={payment.status} />
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(payment.paidAt ?? payment.createdAt).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Separator />

      <Card className="border-border/60 bg-card/50">
        <CardHeader>
          <CardTitle className="text-base">Members</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {detail.members.map((member) => (
            <div
              key={member.userId}
              className="flex items-center justify-between rounded-lg border border-border/60 px-3 py-2"
            >
              <div>
                <p className="text-sm font-medium">{member.name}</p>
                <p className="text-xs text-muted-foreground">{member.email}</p>
              </div>
              <Badge variant="outline">{member.role}</Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function PaymentStatusBadge({
  status,
}: {
  status: "PAID" | "PENDING" | "FAILED" | "REFUNDED";
}) {
  const config = {
    PAID: { label: "Paid", className: "bg-green-500/15 text-green-500" },
    PENDING: { label: "Pending", className: "bg-yellow-500/15 text-yellow-500" },
    FAILED: { label: "Failed", className: "bg-red-500/15 text-red-500" },
    REFUNDED: { label: "Refunded", className: "bg-blue-500/15 text-blue-400" },
  }[status];
  return (
    <Badge variant="secondary" className={config.className}>
      {config.label}
    </Badge>
  );
}
