"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  ChevronRight,
  Download,
  Loader2,
  MessagesSquare,
  ThumbsDown,
  ThumbsUp,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "@/components/providers/auth-provider";
import {
  deleteConversationApi,
  listConversations,
  type AiConversationSummary,
} from "@/lib/ai-client";
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

function formatDuration(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function StatusBadge({
  status,
}: {
  status: string;
}) {
  const config: Record<string, { label: string; className: string }> = {
    resolved: { label: "Resolved", className: "bg-green-500/15 text-green-500" },
    escalated: { label: "Escalated", className: "bg-yellow-500/15 text-yellow-500" },
    missed: { label: "Missed", className: "bg-red-500/15 text-red-500" },
  };
  const item = config[status] ?? { label: status, className: "" };
  return (
    <Badge variant="secondary" className={item.className}>
      {item.label}
    </Badge>
  );
}

type Filter = "all" | "resolved" | "escalated";

export default function ConversationsPage() {
  const { activeWorkspace } = useAuth();
  const [conversations, setConversations] = useState<
    AiConversationSummary[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!activeWorkspace) return;
    setLoading(true);
    try {
      const list = await listConversations(activeWorkspace.id);
      setConversations(list);
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : "Load failed.";
      toast.error(message);
    }
    setLoading(false);
  }, [activeWorkspace]);

  useEffect(() => {
    const handle = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(handle);
  }, [load]);

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      await deleteConversationApi(id);
      setConversations((prev) => prev.filter((item) => item.id !== id));
      toast.success("Conversation deleted");
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : "Delete failed.";
      toast.error(message);
    }
    setDeletingId(null);
  }

  const filtered = conversations.filter((conversation) => {
    if (filter !== "all" && conversation.status !== filter) return false;
    if (query) {
      const haystack = `${conversation.first_question ?? ""}`.toLowerCase();
      if (!haystack.includes(query.toLowerCase())) return false;
    }
    return true;
  });

  function exportCsv() {
    if (filtered.length === 0) return;
    const rows = [
      ["ID", "First Question", "Language", "Status", "Duration (s)", "Rating", "Messages", "Date"],
      ...filtered.map((c) => [
        c.id,
        `"${(c.first_question ?? "").replace(/"/g, "'")}"`,
        c.language,
        c.status,
        String(c.duration_sec),
        c.rating === 1 ? "positive" : c.rating === -1 ? "negative" : "none",
        String(c.message_count),
        new Date(c.created_at).toLocaleDateString(),
      ]),
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `conversations-${activeWorkspace?.name ?? "export"}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (!activeWorkspace) {
    return (
      <div className="py-16 text-center text-muted-foreground">
        Pehle workspace banayein.
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Conversations</h1>
          <p className="text-sm text-muted-foreground">
            Agent ki tamam calls — real data ({activeWorkspace.name})
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Input
            placeholder="Search transcript…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="w-48"
          />
          <Tabs
            value={filter}
            onValueChange={(value) => setFilter(value as Filter)}
          >
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="resolved">Resolved</TabsTrigger>
              <TabsTrigger value="escalated">Escalated</TabsTrigger>
            </TabsList>
          </Tabs>
          {filtered.length > 0 ? (
            <Button variant="outline" size="sm" onClick={exportCsv}>
              <Download />
              Export CSV
            </Button>
          ) : null}
        </div>
      </div>

      <Card className="border-border/60 bg-card/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <MessagesSquare className="size-4 text-primary" />
            History
            <Badge variant="secondary">{filtered.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="size-5 animate-spin text-primary" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <MessagesSquare className="size-10 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Abhi koi conversation nahi. Test Calls se call kar ke save
                karein.
              </p>
              <Button size="sm" asChild>
                <Link href="/dashboard/test-calls">Start Test Call</Link>
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Question</TableHead>
                  <TableHead>Language</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-20 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((conversation) => (
                  <TableRow key={conversation.id} className="group">
                    <TableCell>
                      <Link
                        href={`/dashboard/conversations/${conversation.id}`}
                        className="block max-w-[280px] truncate font-medium underline-offset-4 hover:underline"
                      >
                        {conversation.first_question ?? "(no question)"}
                      </Link>
                      <span className="font-mono text-xs text-muted-foreground">
                        #{conversation.id.slice(0, 8)} ·{" "}
                        {conversation.message_count} msgs
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="uppercase">
                        {conversation.language}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-sm tabular-nums text-muted-foreground">
                      {formatDuration(conversation.duration_sec)}
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground sm:table-cell">
                      {new Date(conversation.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <StatusBadge status={conversation.status} />
                        {conversation.rating === 1 ? (
                          <ThumbsUp className="size-3.5 text-green-500" />
                        ) : conversation.rating === -1 ? (
                          <ThumbsDown className="size-3.5 text-red-500" />
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          disabled={deletingId === conversation.id}
                          onClick={() => void handleDelete(conversation.id)}
                        >
                          {deletingId === conversation.id ? (
                            <Loader2 className="animate-spin" />
                          ) : (
                            <Trash2 />
                          )}
                          <span className="sr-only">Delete</span>
                        </Button>
                        <Link
                          href={`/dashboard/conversations/${conversation.id}`}
                          aria-label="Open"
                        >
                          <ChevronRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                        </Link>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
