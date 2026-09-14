"use client";

import { useEffect, useState } from "react";
import {
  Loader2,
  Sparkles,
  CreditCard,
  CheckCircle,
  ExternalLink,
  ShieldCheck,
  Clock,
  AlertTriangle,
  XCircle,
}
  from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "@/components/providers/auth-provider";
import { apiFetch, ApiError } from "@/lib/api-client";
import { getWorkspaceSummary } from "@/lib/ai-client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TabsContent } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface PlanInfo {
  id: string;
  slug: string;
  name: string;
  priceMonthly: string;
  currency: string;
  maxSeats: number | null;
  maxDocuments: number | null;
  maxConversationsPerMonth: number | null;
}

interface SubscriptionStatus {
  planSlug: string;
  status: string;
  gateway: string;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  trialEnd: string | null;
  isActive: boolean;
}

interface PaymentRecord {
  id: string;
  plan: string;
  amount: string;
  currency: string;
  status: string;
  paidAt: string | null;
  createdAt: string;
}

interface CheckoutResult {
  checkoutUrl: string;
  provider: string;
}

function Meter({
  label,
  used,
  limit,
}: {
  label: string;
  used: number;
  limit: number | null;
}) {
  const pct = limit ? Math.min(100, Math.round((used / limit) * 100)) : 0;
  const isWarning = pct > 80;
  return (
    <div>
      <div className="mb-1.5 flex justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className={`tabular-nums font-medium ${isWarning ? "text-red-400" : ""}`}>
          {used} / {limit ?? "∞"}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full rounded-full transition-all duration-700 ${isWarning ? "bg-red-500" : "bg-primary"
            }`}
          style={{ width: `${limit ? pct : 0}%` }}
        />
      </div>
      {isWarning && (
        <p className="mt-1 text-xs text-red-400 flex items-center gap-1">
          <AlertTriangle className="size-3" />
          {pct}% used — consider upgrading
        </p>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; className: string; Icon: typeof CheckCircle }> = {
    active: { label: "Active", className: "bg-green-500/15 text-green-400 border-green-500/30", Icon: CheckCircle },
    trialing: { label: "Trial", className: "bg-blue-500/15 text-blue-400 border-blue-500/30", Icon: Clock },
    inactive: { label: "Free", className: "bg-muted/80 text-muted-foreground border-border", Icon: ShieldCheck },
    past_due: { label: "Past Due", className: "bg-red-500/15 text-red-400 border-red-500/30", Icon: AlertTriangle },
    canceled: { label: "Canceled", className: "bg-muted/80 text-muted-foreground border-border", Icon: XCircle },
    unpaid: { label: "Unpaid", className: "bg-red-500/15 text-red-400 border-red-500/30", Icon: AlertTriangle },
  };
  const config = map[status] ?? map.inactive;
  const { label, className, Icon } = config;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${className}`}
    >
      <Icon className="size-3" />
      {label}
    </span>
  );
}

function PaymentStatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    PAID: "bg-green-500/15 text-green-400 border-green-500/30",
    PENDING: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
    FAILED: "bg-red-500/15 text-red-400 border-red-500/30",
    REFUNDED: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${map[status] ?? "bg-muted text-muted-foreground border-border"
        }`}
    >
      {status}
    </span>
  );
}

export function BillingTab() {
  const { activeWorkspace, workspaces } = useAuth();
  const [plans, setPlans] = useState<PlanInfo[]>([]);
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [usage, setUsage] = useState<{
    documentsCount: number;
    totalConversations: number;
  } | null>(null);
  const [memberCount, setMemberCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState<string | null>(null);
  const [canceling, setCanceling] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [manageLoading, setManageLoading] = useState(false);

  useEffect(() => {
    if (!activeWorkspace) return;
    const handle = window.setTimeout(async () => {
      try {
        const [plansData, summaryData, membersData, subData, paymentsData] =
          await Promise.all([
            apiFetch<PlanInfo[]>("/plans", { skipAuth: true }),
            getWorkspaceSummary(activeWorkspace.id),
            apiFetch<MemberItem[]>(`/workspaces/${activeWorkspace.id}/members`),
            apiFetch<SubscriptionStatus>(
              `/billing/status/${activeWorkspace.id}`
            ).catch(() => null),
            apiFetch<PaymentRecord[]>(
              `/billing/payments/${activeWorkspace.id}`
            ).catch(() => []),
          ]);
        setPlans(plansData);
        setUsage(summaryData);
        setMemberCount(membersData.length);
        setSubscription(subData);
        setPayments(Array.isArray(paymentsData) ? paymentsData : []);
      } catch (error) {
        const message =
          error instanceof ApiError ? error.message : "Billing load failed.";
        toast.error(message);
      }
      setLoading(false);
    }, 0);
    return () => window.clearTimeout(handle);
  }, [activeWorkspace]);

  const handleUpgrade = async (planSlug: string) => {
    if (!activeWorkspace) return;
    setUpgrading(planSlug);
    try {
      const result = await apiFetch<CheckoutResult>("/billing/checkout", {
        method: "POST",
        body: { workspaceId: activeWorkspace.id, planSlug },
      });
      window.location.href = result.checkoutUrl;
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : "Failed to start checkout.";
      toast.error(message);
      setUpgrading(null);
    }
  };

  const handleManage = async () => {
    if (!activeWorkspace) return;
    setManageLoading(true);
    try {
      const result = await apiFetch<{ url: string }>("/billing/portal", {
        method: "POST",
        body: { workspaceId: activeWorkspace.id },
      });
      window.location.href = result.url;
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : "Failed to open billing portal.";
      toast.error(message);
    }
    setManageLoading(false);
  };

  const handleCancel = async () => {
    if (!activeWorkspace) return;
    setCanceling(true);
    try {
      await apiFetch("/billing/cancel", {
        method: "POST",
        body: { workspaceId: activeWorkspace.id },
      });
      toast.success("Subscription canceled. You will retain access until period end.");
      setConfirmCancel(false);
      setSubscription((prev) =>
        prev ? { ...prev, status: "canceled", cancelAtPeriodEnd: true } : prev
      );
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : "Failed to cancel subscription.";
      toast.error(message);
    }
    setCanceling(false);
  };

  if (!activeWorkspace || loading) {
    return <TabsContentFallback />;
  }

  const currentPlan = plans.find(
    (plan) => plan.slug === activeWorkspace.planSlug
  );
  const isActiveSub = subscription?.isActive ?? false;

  return (
    <TabsContent value="billing" className="space-y-6">
      {/* Current Plan Card */}
      <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-card/80">
        <CardHeader className="flex-row items-start justify-between space-y-0 gap-4">
          <div className="space-y-1.5">
            <CardTitle className="flex flex-wrap items-center gap-2 text-base">
              Current Plan
              <Badge className="uppercase tracking-wide">
                {activeWorkspace.planSlug}
              </Badge>
              {subscription && <StatusBadge status={subscription.status} />}
            </CardTitle>
            <CardDescription>
              {currentPlan?.name ?? activeWorkspace.planSlug} — $
              {Number(currentPlan?.priceMonthly ?? 0).toFixed(0)}/month
              {subscription?.currentPeriodEnd && (
                <span className="ml-2 text-xs">
                  · renews{" "}
                  {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                </span>
              )}
            </CardDescription>
            {subscription?.cancelAtPeriodEnd && (
              <p className="text-xs text-red-400 flex items-center gap-1">
                <AlertTriangle className="size-3" />
                Cancels at period end
              </p>
            )}
          </div>
          <div className="flex flex-col gap-2 items-end shrink-0">
            {isActiveSub ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleManage}
                  disabled={manageLoading}
                  id="billing-manage-btn"
                  className="gap-1.5"
                >
                  {manageLoading ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <ExternalLink className="size-3.5" />
                  )}
                  Manage Subscription
                </Button>
                {!subscription?.cancelAtPeriodEnd && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setConfirmCancel(true)}
                    className="text-muted-foreground hover:text-red-400 text-xs"
                    id="billing-cancel-link"
                  >
                    Cancel plan
                  </Button>
                )}
              </>
            ) : null}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Meter
            label="Team seats"
            used={memberCount}
            limit={currentPlan?.maxSeats ?? null}
          />
          <Meter
            label="Knowledge documents"
            used={usage?.documentsCount ?? 0}
            limit={currentPlan?.maxDocuments ?? null}
          />
          <Meter
            label="Conversations this month"
            used={usage?.totalConversations ?? 0}
            limit={currentPlan?.maxConversationsPerMonth ?? null}
          />
        </CardContent>
      </Card>

      {/* Plans Comparison */}
      {!isActiveSub && (
        <Card className="border-border/60 bg-card/50">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="size-4 text-primary" />
              Upgrade Your Plan
            </CardTitle>
            <CardDescription>
              Choose a plan that fits your team&apos;s needs.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 gap-4">
              {plans
                .filter((p) => p.slug !== "free")
                .map((plan) => {
                  const isCurrent = plan.slug === activeWorkspace.planSlug;
                  return (
                    <div
                      key={plan.id}
                      className={`relative rounded-xl border p-5 space-y-4 transition-all ${plan.slug === "pro"
                          ? "border-primary/40 bg-primary/5 ring-1 ring-primary/20"
                          : "border-border bg-card/50"
                        }`}
                    >
                      {plan.slug === "pro" && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                          <span className="bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full">
                            MOST POPULAR
                          </span>
                        </div>
                      )}
                      <div>
                        <p className="font-semibold text-base">{plan.name}</p>
                        <p className="text-2xl font-bold mt-1">
                          ${Number(plan.priceMonthly).toFixed(0)}
                          <span className="text-sm font-normal text-muted-foreground">
                            /mo
                          </span>
                        </p>
                      </div>
                      <ul className="space-y-1.5 text-sm text-muted-foreground">
                        <li className="flex items-center gap-2">
                          <CheckCircle className="size-3.5 text-primary shrink-0" />
                          {plan.maxSeats ?? "∞"} team seats
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="size-3.5 text-primary shrink-0" />
                          {plan.maxDocuments ?? "∞"} documents
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="size-3.5 text-primary shrink-0" />
                          {plan.maxConversationsPerMonth?.toLocaleString() ?? "∞"} conv/mo
                        </li>
                      </ul>
                      <Button
                        className="w-full gap-2"
                        variant={plan.slug === "pro" ? "default" : "outline"}
                        disabled={isCurrent || upgrading !== null}
                        onClick={() => handleUpgrade(plan.slug)}
                        id={`billing-upgrade-${plan.slug}`}
                      >
                        {upgrading === plan.slug ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <CreditCard className="size-4" />
                        )}
                        {isCurrent ? "Current Plan" : `Upgrade to ${plan.name}`}
                      </Button>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment History */}
      {payments.length > 0 && (
        <Card className="border-border/60 bg-card/50">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CreditCard className="size-4" />
              Payment History
            </CardTitle>
            <CardDescription>
              All transactions for this workspace.
            </CardDescription>
          </CardHeader>
          <CardContent>
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
                {payments.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium capitalize">{p.plan}</TableCell>
                    <TableCell className="tabular-nums">
                      ${Number(p.amount).toFixed(2)}{" "}
                      <span className="text-muted-foreground text-xs">{p.currency}</span>
                    </TableCell>
                    <TableCell>
                      <PaymentStatusBadge status={p.status} />
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm tabular-nums">
                      {new Date(p.paidAt ?? p.createdAt).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <p className="text-center text-xs text-muted-foreground flex items-center justify-center gap-1.5">
        <ShieldCheck className="size-3.5" />
        Payments are secured via Stripe. We never store your card details.
      </p>

      {/* Cancel Confirm Dialog */}
      <Dialog open={confirmCancel} onOpenChange={setConfirmCancel}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Subscription?</DialogTitle>
            <DialogDescription>
              Your subscription will be canceled at the end of the current billing
              period. You will keep access until then, then revert to the Free
              plan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmCancel(false)}
              id="billing-cancel-confirm-no"
            >
              Keep Subscription
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancel}
              disabled={canceling}
              id="billing-cancel-confirm-yes"
            >
              {canceling ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                "Yes, Cancel"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TabsContent>
  );
}

interface MemberItem {
  userId: string;
}

function TabsContentFallback() {
  const { isLoading } = useAuth();
  return (
    <TabsContent value="billing">
      <div className="flex justify-center py-16">
        {isLoading ? (
          <Loader2 className="size-5 animate-spin text-primary" />
        ) : (
          <p className="text-sm text-muted-foreground">
            Pehle workspace banayein.
          </p>
        )}
      </div>
    </TabsContent>
  );
}
