"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import {
  Ban,
  CheckCircle2,
  Eye,
  Loader2,
  Search,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "@/components/providers/auth-provider";
import {
  blockUser,
  getAdminUsers,
  impersonateUser,
  unblockUser,
  type AdminUser,
} from "@/lib/admin-client";
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
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

function UsersPageInner() {
  const router = useRouter();
  const { startImpersonation } = useAuth();
  const searchParams = useSearchParams();
  const statusFilter =
    searchParams.get("status") === "blocked" ? "blocked" : "all";

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);

  const loadUsers = useCallback(
    async (q: string) => {
      setLoading(true);
      try {
        const response = await getAdminUsers({
          q: q || undefined,
          status: statusFilter === "blocked" ? "blocked" : "all",
          limit: 50,
        });
        setUsers(response.items);
        setTotal(response.total);
      } catch (error) {
        const message =
          error instanceof ApiError ? error.message : "Users load failed.";
        toast.error(message);
      }
      setLoading(false);
    },
    [statusFilter]
  );

  useEffect(() => {
    const handle = window.setTimeout(() => {
      void loadUsers(query);
    }, 250);
    return () => window.clearTimeout(handle);
  }, [loadUsers, query]);

  async function toggleBlock(user: AdminUser) {
    setActionId(user.id);
    try {
      const updated = user.isBlocked
        ? await unblockUser(user.id)
        : await blockUser(user.id);
      setUsers((prev) =>
        prev.map((item) =>
          item.id === user.id ? { ...item, isBlocked: updated.isBlocked } : item
        )
      );
      toast.success(
        updated.isBlocked
          ? `${user.email} blocked`
          : `${user.email} unblocked`
      );
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : "Action failed.";
      toast.error(message);
    }
    setActionId(null);
  }

  async function viewAs(user: AdminUser) {
    try {
      const session = await impersonateUser(user.id);
      startImpersonation(session);
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : "Impersonation failed.";
      toast.error(message);
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Users</h1>
        <p className="text-sm text-muted-foreground">
          Registered users ko manage karein — block/unblock actions.
        </p>
      </div>

      <Card className="border-border/60 bg-card/50">
        <CardHeader className="flex-row flex-wrap items-center justify-between gap-3 space-y-0">
          <div className="space-y-1">
            <CardTitle className="text-base">All Users</CardTitle>
            <CardDescription>{total} registered</CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search name/email…"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="w-56 pl-8"
              />
            </div>
            <Tabs
              value={statusFilter}
              onValueChange={(value) => {
                if (value === "all") router.push("/admin/users");
                else router.push(`/admin/users?status=${value}`);
              }}
            >
              <TabsList>
                <TabsTrigger value="all">Active+Blocked</TabsTrigger>
                <TabsTrigger value="blocked">Blocked</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="size-5 animate-spin text-primary" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Workspaces</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden sm:table-cell">Joined</TableHead>
                  <TableHead className="w-24 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow
                    key={user.id}
                    className="cursor-pointer"
                    onClick={() => router.push(`/admin/users/${user.id}`)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="size-8">
                          <AvatarFallback className="bg-primary/20 text-primary text-xs">
                            {(user.name || user.email)
                              .slice(0, 2)
                              .toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">
                            {user.name}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {user.email}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {user.role === "SUPERADMIN" ? (
                        <Badge className="gap-1 bg-red-500/15 text-red-500 hover:bg-red-500/15">
                          <ShieldCheck className="size-3" />
                          Admin
                        </Badge>
                      ) : (
                        <Badge variant="outline">User</Badge>
                      )}
                    </TableCell>
                    <TableCell className="tabular-nums">
                      {user.workspaceCount}
                    </TableCell>
                    <TableCell>
                      {user.isBlocked ? (
                        <Badge variant="secondary" className="bg-red-500/15 text-red-500">
                          Blocked
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-green-500/15 text-green-500">
                          Active
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground sm:table-cell">
                      {new Date(user.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </TableCell>
                    <TableCell
                      className="text-right"
                      onClick={(event) => event.stopPropagation()}
                    >
                      <div className="flex items-center justify-end gap-1.5">
                        {actionId === user.id ? (
                          <Loader2 className="size-4 animate-spin text-muted-foreground" />
                        ) : (
                          <>
                            {user.role !== "SUPERADMIN" ? (
                              <Button
                                size="sm"
                                variant="ghost"
                                title="View dashboard as this user"
                                onClick={() => void viewAs(user)}
                              >
                                <Eye />
                                View
                              </Button>
                            ) : null}
                            {user.isBlocked ? (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => void toggleBlock(user)}
                              >
                                <CheckCircle2 />
                                Unblock
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => void toggleBlock(user)}
                              >
                                <Ban />
                                Block
                              </Button>
                            )}
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {users.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="py-10 text-center text-muted-foreground"
                    >
                      Koi user nahi mila.
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function AdminUsersPage() {
  return (
    <Suspense>
      <UsersPageInner />
    </Suspense>
  );
}
