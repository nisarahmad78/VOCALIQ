"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  ArrowLeft,
  Bot,
  Clock,
  Languages,
  Loader2,
  ThumbsDown,
  ThumbsUp,
  User,
} from "lucide-react";
import { toast } from "sonner";

import {
  deleteConversationApi,
  getConversation,
  rateConversation,
  type AiConversationDetail,
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
import { Separator } from "@/components/ui/separator";

function formatDuration(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export default function ConversationDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [conversation, setConversation] =
    useState<AiConversationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [ratingBusy, setRatingBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getConversation(params.id);
      setConversation(data);
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : "Load failed.";
      toast.error(message);
    }
    setLoading(false);
  }, [params.id]);

  useEffect(() => {
    const handle = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(handle);
  }, [load]);

  async function handleRate(rating: 1 | -1) {
    setRatingBusy(true);
    try {
      await rateConversation(params.id, rating);
      setConversation((prev) =>
        prev ? { ...prev, rating } : prev
      );
      toast.success("Feedback saved");
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : "Failed.";
      toast.error(message);
    }
    setRatingBusy(false);
  }

  async function handleDelete() {
    try {
      await deleteConversationApi(params.id);
      toast.success("Deleted");
      router.push("/dashboard/conversations");
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : "Delete failed.";
      toast.error(message);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-3 py-24">
        <Loader2 className="size-5 animate-spin text-primary" />
        <span className="text-sm text-muted-foreground">Loading…</span>
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="py-16 text-center">
        <p className="text-muted-foreground">Conversation not found.</p>
        <Button variant="outline" className="mt-4" asChild>
          <Link href="/dashboard/conversations">Back</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="ghost" size="icon-sm" asChild>
          <Link href="/dashboard/conversations" aria-label="Back">
            <ArrowLeft />
          </Link>
        </Button>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-xl font-bold tracking-tight">
            {conversation.messages.find((m) => m.role === "customer")
              ?.content ?? "Conversation"}
          </h1>
          <p className="font-mono text-xs text-muted-foreground">
            #{conversation.id.slice(0, 8)} ·{" "}
            {new Date(conversation.created_at).toLocaleString()}
          </p>
        </div>
        <Badge variant="secondary" className="uppercase">
          {conversation.language}
        </Badge>
      </div>

      <Card className="border-border/60 bg-card/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-base">
            <span className="flex items-center gap-1.5 text-sm font-normal text-muted-foreground">
              <Clock className="size-4" />
              {formatDuration(conversation.duration_sec)}
            </span>
            <span className="flex items-center gap-1.5 text-sm font-normal text-muted-foreground">
              <Languages className="size-4" />
              {conversation.language}
            </span>
            <StatusChip status={conversation.status} />
          </CardTitle>
        </CardHeader>
        <Separator />
        <CardContent className="space-y-4 pt-6">
          {conversation.messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${
                message.role === "agent" ? "flex-row-reverse" : ""
              }`}
            >
              <span
                className={`flex size-8 shrink-0 items-center justify-center rounded-full ${
                  message.role === "customer"
                    ? "bg-muted text-muted-foreground"
                    : "bg-primary/20 text-primary"
                }`}
              >
                {message.role === "customer" ? (
                  <User className="size-4" />
                ) : (
                  <Bot className="size-4" />
                )}
              </span>
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  message.role === "customer"
                    ? "rounded-tl-sm bg-muted"
                    : "rounded-tr-sm bg-primary/15"
                }`}
              >
                <p className="mb-1 text-xs font-semibold">
                  {message.role === "customer" ? "Customer" : "AI Agent"}
                </p>
                <p className="whitespace-pre-wrap text-sm">{message.content}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="border-border/60 bg-card/50">
        <CardHeader>
          <CardTitle className="text-base">Was this helpful?</CardTitle>
          <CardDescription>
            Aap ka feedback agent quality improve karta hai.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center gap-2">
          <Button
            size="sm"
            variant={conversation.rating === 1 ? "default" : "outline"}
            disabled={ratingBusy}
            onClick={() => void handleRate(1)}
          >
            <ThumbsUp />
            Helpful
          </Button>
          <Button
            size="sm"
            variant={
              conversation.rating === -1 ? "destructive" : "outline"
            }
            disabled={ratingBusy}
            onClick={() => void handleRate(-1)}
          >
            <ThumbsDown />
            Not Helpful
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="ml-auto text-red-500 hover:text-red-500"
            onClick={() => void handleDelete()}
          >
            Delete
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function StatusChip({ status }: { status: string }) {
  const config: Record<string, string> = {
    resolved: "bg-green-500/15 text-green-500",
    escalated: "bg-yellow-500/15 text-yellow-500",
    missed: "bg-red-500/15 text-red-500",
  };
  return (
    <Badge variant="secondary" className={config[status] ?? ""}>
      {status}
    </Badge>
  );
}
