"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { TabsContent } from "@/components/ui/tabs";

import { useAuth } from "@/components/providers/auth-provider";
import {
  getWorkspaceActivity,
  type ActivityItem,
} from "@/lib/team-client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

function timeAgo(iso: string): string {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

const ACTION_LABELS: Record<string, string> = {
  "workspace.created": "created the workspace",
  "workspace.updated": "updated workspace settings",
  "workspace.deleted": "deleted the workspace",
  "member.left": "left the workspace",
  "member.removed": "removed a member",
  "member.role_changed": "changed a member's role",
  "ownership.transferred": "transferred ownership",
  "invite.sent": "invited",
  "invite.accepted": "invite accepted by",
  "invite.revoked": "revoked invite for",
  "invite.resent": "resent invite for",
  "feature.approved": "approved feature",
  "feature.revoked": "revoked feature",
  "feature.pending": "set feature pending:",
};

export function ActivityTab() {
  const { activeWorkspace } = useAuth();
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!activeWorkspace) return;
    setLoading(true);
    try {
      const feed = await getWorkspaceActivity(activeWorkspace.id);
      setItems(feed);
    } catch {
      setItems([]);
    }
    setLoading(false);
  }, [activeWorkspace]);

  useEffect(() => {
    const handle = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(handle);
  }, [load]);

  return (
    <TabsContent value="activity">
      <Card className="border-border/60 bg-card/50">
        <CardHeader>
          <CardTitle className="text-base">Activity Log</CardTitle>
          <CardDescription>
            Workspace mein kya kya hua — sab kuch yahan.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="size-5 animate-spin text-primary" />
            </div>
          ) : items.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Abhi koi activity nahi.
            </p>
          ) : (
            <ol className="relative space-y-4 border-l border-border/60 pl-5">
              {items.map((item) => (
                <li key={item.id} className="relative">
                  <span className="absolute -left-[26px] top-1 size-2.5 rounded-full bg-primary/70" />
                  <p className="text-sm">
                    <span className="font-medium">
                      {item.actorName ?? "System"}
                    </span>{" "}
                    {ACTION_LABELS[item.action] ?? item.action}{" "}
                    {item.targetSummary ? (
                      <span className="text-foreground">
                        {item.targetSummary}
                      </span>
                    ) : null}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {timeAgo(item.createdAt)}
                  </p>
                </li>
              ))}
            </ol>
          )}
        </CardContent>
      </Card>
    </TabsContent>
  );
}
