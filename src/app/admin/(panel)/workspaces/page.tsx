"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Building2, ChevronRight, Loader2, Search } from "lucide-react";
import { toast } from "sonner";

import {
  getAdminWorkspaces,
  type AdminWorkspace,
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
import { Input } from "@/components/ui/input";

export default function AdminWorkspacesPage() {
  const [workspaces, setWorkspaces] = useState<AdminWorkspace[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (q: string) => {
    setLoading(true);
    try {
      const list = await getAdminWorkspaces(q || undefined);
      setWorkspaces(list);
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : "Workspaces load failed.";
      toast.error(message);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      void load(query);
    }, 250);
    return () => window.clearTimeout(handle);
  }, [load, query]);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Workspaces</h1>
        <p className="text-sm text-muted-foreground">
          Multi-tenant overview — har company ka owner, members aur usage.
        </p>
      </div>

      <Card className="border-border/60 bg-card/50">
        <CardHeader className="flex-row flex-wrap items-center justify-between gap-3 space-y-0">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-base">
              <Building2 className="size-4 text-primary" />
              All Workspaces
              <Badge variant="secondary">{workspaces.length}</Badge>
            </CardTitle>
            <CardDescription>
              Detail ke liye kisi workspace par click karein.
            </CardDescription>
          </div>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search workspace…"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="w-56 pl-8"
            />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="size-5 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-2">
              {workspaces.map((workspace) => (
                <Link
                  key={workspace.id}
                  href={`/admin/workspaces/${workspace.id}`}
                  className="group flex flex-wrap items-center gap-4 rounded-xl border border-border/60 p-4 transition-colors hover:border-primary/40 hover:bg-primary/5"
                >
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-sm font-semibold text-primary">
                    {(workspace.name || "W").slice(0, 2).toUpperCase()}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{workspace.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      Owner: {workspace.ownerName} · {workspace.ownerEmail}
                    </p>
                  </div>
                  <div className="hidden gap-6 sm:flex">
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Members</p>
                      <p className="text-sm font-semibold tabular-nums">
                        {workspace.memberCount}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Documents</p>
                      <p className="text-sm font-semibold tabular-nums">
                        {workspace.documentsCount}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Created</p>
                      <p className="text-sm">
                        {new Date(workspace.createdAt).toLocaleDateString(
                          "en-US",
                          { month: "short", day: "numeric" }
                        )}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                </Link>
              ))}
              {workspaces.length === 0 ? (
                <p className="py-10 text-center text-muted-foreground">
                  Koi workspace nahi mila.
                </p>
              ) : null}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
