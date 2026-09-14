"use client";

import { useEffect, useState } from "react";
import { CreditCard, Loader2 } from "lucide-react";
import { toast } from "sonner";

import {
  getAdminPayments,
  type AdminPaymentsResponse,
} from "@/lib/admin-client";
import { ApiError } from "@/lib/api-client";
import { Badge } from "@/components/ui/badge";
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

export default function AdminPaymentsPage() {
  const [data, setData] = useState<AdminPaymentsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      getAdminPayments({ limit: 50 })
        .then(setData)
        .catch((error) => {
          const message =
            error instanceof ApiError ? error.message : "Payments load failed.";
          toast.error(message);
        })
        .finally(() => setLoading(false));
    }, 0);
    return () => window.clearTimeout(handle);
  }, []);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Payments</h1>
        <p className="text-sm text-muted-foreground">
          Platform ki revenue aur subscription payments.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="border-border/60 bg-card/50">
          <CardHeader className="pb-2">
            <CardDescription>Total Revenue (Paid)</CardDescription>
            <CardTitle className="text-3xl tabular-nums">
              ${data?.summary.totalRevenue.toLocaleString() ?? "—"}
            </CardTitle>
          </CardHeader>
          <CardContent className="hidden" />
        </Card>
        <Card className="border-border/60 bg-card/50">
          <CardHeader className="pb-2">
            <CardDescription>This Month</CardDescription>
            <CardTitle className="text-3xl tabular-nums">
              ${data?.summary.monthlyRevenue.toLocaleString() ?? "—"}
            </CardTitle>
          </CardHeader>
          <CardContent className="hidden" />
        </Card>
      </div>

      <Card className="border-border/60 bg-card/50">
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-base">
              <CreditCard className="size-4 text-primary" />
              Transactions
              <Badge variant="secondary">{data?.total ?? 0}</Badge>
            </CardTitle>
          </div>
          {loading ? (
            <Loader2 className="size-4 animate-spin text-muted-foreground" />
          ) : null}
        </CardHeader>
        <CardContent>
          {data ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Workspace</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden sm:table-cell">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.items.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>
                      <p className="font-medium">{payment.workspaceName}</p>
                      <p className="text-xs text-muted-foreground">
                        /{payment.workspaceSlug}
                      </p>
                    </TableCell>
                    <TableCell>{payment.plan}</TableCell>
                    <TableCell className="tabular-nums font-semibold">
                      ${Number(payment.amount).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <PaymentStatusBadge status={payment.status} />
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground sm:table-cell">
                      {new Date(
                        payment.paidAt ?? payment.createdAt
                      ).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </TableCell>
                  </TableRow>
                ))}
                {data.items.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="py-10 text-center text-muted-foreground"
                    >
                      Koi transactions nahi.
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          ) : null}
        </CardContent>
      </Card>

      <p className="text-center text-xs text-muted-foreground">
        Real payment gateway (Stripe) Phase 4 mein integrate hoga — ye demo data
        hai.
      </p>
    </div>
  );
}
