"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Bot,
  BookOpen,
  Clock,
  Loader2,
  MessagesSquare,
  Mic,
  TrendingUp,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { useAuth } from "@/components/providers/auth-provider";
import { DashboardGreeting } from "@/components/dashboard/greeting";
import { AnnouncementBanner } from "@/components/announcement-banner";
import { OnboardingChecklist } from "@/components/dashboard/onboarding-checklist";
import {
  getWorkspaceSummary,
  listConversations,
  type WorkspaceSummary,
} from "@/lib/ai-client";
import { ApiError } from "@/lib/api-client";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const quickActions = [
  {
    title: "Test Your Agent",
    description: "Browser se voice call test karein",
    href: "/dashboard/test-calls",
    icon: Mic,
  },
  {
    title: "Knowledge Bases",
    description: "Products aur documents manage karein",
    href: "/dashboard/knowledge-bases",
    icon: BookOpen,
  },
  {
    title: "Configure Agent",
    description: "Agent ki settings update karein",
    href: "/dashboard/agent",
    icon: Bot,
  },
];

export default function DashboardOverviewPage() {
  const { activeWorkspace, user } = useAuth();
  const [summary, setSummary] = useState<WorkspaceSummary | null>(null);
  const [recent, setRecent] = useState<
    Array<{
      id: string;
      first_question: string | null;
      duration_sec: number;
      status: string;
      created_at: string;
    }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [allConversations, setAllConversations] = useState<
    Array<{
      id: string;
      first_question: string | null;
      duration_sec: number;
      status: string;
      created_at: string;
    }>
  >([]); 

  const load = useCallback(async () => {
    if (!activeWorkspace) return;
    setLoading(true);
    try {
      const [summaryData, convos] = await Promise.all([
        getWorkspaceSummary(activeWorkspace.id),
        listConversations(activeWorkspace.id),
      ]);
      setSummary(summaryData);
      setAllConversations(convos);
      setRecent(convos.slice(0, 4));
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : "Stats load failed.";
      toast.error(message);
    }
    setLoading(false);
     
  }, [activeWorkspace]);

  useEffect(() => {
    const handle = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(handle);
  }, [load]);

  return (
    <div className="space-y-6">
      <AnnouncementBanner />

      {!user?.emailVerified ? (
        <div className="rounded-xl border border-yellow-500/40 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-700 dark:text-yellow-400">
          Email verified nahi hai —{" "}
          <Link
            href="/dashboard/settings"
            className="font-medium underline underline-offset-4"
          >
            Settings
          </Link>{" "}
          mein ja kar verify karein.
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Overview</h1>
          <DashboardGreeting />
        </div>
        <Button asChild>
          <Link href="/dashboard/test-calls">
            <Mic />
            Start Test Call
          </Link>
        </Button>
      </div>

      {!activeWorkspace ? (
        <Card className="border-border/60 bg-card/50">
          <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
            <p className="font-medium">Pehle workspace banayein</p>
            <Button asChild size="sm">
              <Link href="/onboarding/create-workspace">Create Workspace</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {loading || !summary ? (
            <div className="flex justify-center py-16">
              <Loader2 className="size-5 animate-spin text-primary" />
            </div>
          ) : (
            <>
              <OnboardingChecklist
                summary={summary}
                totalConversations={allConversations.length}
              />

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard
                  label="Total Conversations"
                  value={summary.totalConversations.toString()}
                  icon={MessagesSquare}
                />
                <StatCard
                  label="Questions Answered"
                  value={summary.questionsAnswered.toLocaleString()}
                  icon={ArrowRight}
                />
                <StatCard
                  label="Talk Time"
                  value={`${Math.round(summary.totalDurationSec / 60)} min`}
                  icon={Clock}
                />
                <StatCard
                  label="Knowledge Documents"
                  value={summary.documentsCount.toString()}
                  icon={BookOpen}
                />
              </div>

              {/* ── Analytics Charts ── */}
              {allConversations.length > 0 ? (
                <div className="grid gap-6 lg:grid-cols-3">
                  {/* Trend Chart */}
                  <Card className="border-border/60 bg-card/50 lg:col-span-2">
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <TrendingUp className="size-4 text-primary" />
                        Conversations — Last 7 Days
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={180}>
                        <AreaChart data={(() => {
                          const days: Record<string, number> = {};
                          for (let i = 6; i >= 0; i--) {
                            const d = new Date();
                            d.setDate(d.getDate() - i);
                            days[d.toLocaleDateString("en", { weekday: "short" })] = 0;
                          }
                          allConversations.forEach((c) => {
                            const label = new Date(c.created_at).toLocaleDateString("en", { weekday: "short" });
                            if (label in days) days[label]++;
                          });
                          return Object.entries(days).map(([day, count]) => ({ day, count }));
                        })()}>
                          <defs>
                            <linearGradient id="convGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                              <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <XAxis dataKey="day" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                          <YAxis allowDecimals={false} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={24} />
                          <Tooltip
                            contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                            labelStyle={{ color: "hsl(var(--foreground))" }}
                          />
                          <Area type="monotone" dataKey="count" stroke="hsl(var(--primary))" fill="url(#convGrad)" strokeWidth={2} name="Conversations" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  {/* Status Pie */}
                  <Card className="border-border/60 bg-card/50">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Status Breakdown</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center">
                      <ResponsiveContainer width="100%" height={150}>
                        <PieChart>
                          <Pie
                            data={[
                              { name: "Resolved", value: allConversations.filter(c => c.status === "resolved").length, color: "#22c55e" },
                              { name: "Escalated", value: allConversations.filter(c => c.status === "escalated").length, color: "#eab308" },
                              { name: "Missed", value: allConversations.filter(c => c.status === "missed").length, color: "#ef4444" },
                            ].filter(d => d.value > 0)}
                            dataKey="value"
                            cx="50%"
                            cy="50%"
                            innerRadius={40}
                            outerRadius={65}
                            paddingAngle={3}
                          >
                            {["#22c55e","#eab308","#ef4444"].map((color, i) => (
                              <Cell key={i} fill={color} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="flex flex-wrap justify-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-green-500" />Resolved</span>
                        <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-yellow-500" />Escalated</span>
                        <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-red-500" />Missed</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : null}

              <div className="grid gap-6 lg:grid-cols-3">
                <Card className="border-border/60 bg-card/50 lg:col-span-2">
                  <CardHeader className="flex-row items-center justify-between space-y-0">
                    <div className="space-y-1">
                      <CardTitle>Recent Conversations</CardTitle>
                      <CardDescription>Aap ke agent ki latest calls</CardDescription>
                    </div>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href="/dashboard/conversations">
                        View all
                        <ArrowRight />
                      </Link>
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {recent.length === 0 ? (
                      <p className="py-8 text-center text-sm text-muted-foreground">
                        Abhi koi conversation nahi — Test Call kar ke shuru
                        karein!
                      </p>
                    ) : (
                      recent.map((conversation) => (
                        <Link
                          key={conversation.id}
                          href={`/dashboard/conversations/${conversation.id}`}
                          className="flex items-center gap-3 rounded-xl border border-transparent p-3 transition-colors hover:border-border hover:bg-muted/40"
                        >
                          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/15 text-sm font-semibold text-primary">
                            {(conversation.first_question ?? "?")
                              .slice(0, 1)
                              .toUpperCase()}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">
                              {conversation.first_question ?? "(no question)"}
                            </p>
                            <p className="font-mono text-xs text-muted-foreground">
                              {new Date(
                                conversation.created_at
                              ).toLocaleString()}
                            </p>
                          </div>
                          <Badge variant="secondary" className="uppercase">
                            {conversation.status}
                          </Badge>
                        </Link>
                      ))
                    )}
                  </CardContent>
                </Card>

                <Card className="border-border/60 bg-card/50 h-fit">
                  <CardHeader>
                    <CardTitle className="text-base">Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {quickActions.map((action) => (
                      <Link
                        key={action.href}
                        href={action.href}
                        className="group flex items-start gap-3 rounded-xl border border-border/60 p-3 transition-colors hover:border-primary/40 hover:bg-primary/5"
                      >
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
                          <action.icon className="size-4" />
                        </span>
                        <span>
                          <span className="block text-sm font-medium">
                            {action.title}
                          </span>
                          <span className="block text-xs text-muted-foreground">
                            {action.description}
                          </span>
                        </span>
                      </Link>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Card className="border-border/60 bg-card/50">
      <CardHeader className="pb-2">
        <CardDescription className="flex items-center justify-between">
          {label}
          <Icon className="size-4 text-muted-foreground" />
        </CardDescription>
        <CardTitle className="text-3xl tabular-nums">{value}</CardTitle>
      </CardHeader>
      <CardContent className="hidden" />
    </Card>
  );
}
