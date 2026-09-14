"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Bot,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Circle,
  Mic,
  Sparkles,
  Users,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { WorkspaceSummary } from "@/lib/ai-client";

interface OnboardingChecklistProps {
  summary: WorkspaceSummary | null;
  totalConversations: number;
}

export function OnboardingChecklist({
  summary,
  totalConversations,
}: OnboardingChecklistProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [dismissed, setDismissed] = useState(true); // default true to prevent SSR flicker

  useEffect(() => {
    const isDismissed = localStorage.getItem("vocaliq_onboarding_dismissed") === "true";
    const timer = setTimeout(() => {
      setDismissed(isDismissed);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem("vocaliq_onboarding_dismissed", "true");
  };

  const hasDocs = (summary?.documentsCount ?? 0) > 0;
  const hasCalls = totalConversations > 0;
  // Check if agent configured in localStorage or defaults
  const agentCustomized = typeof window !== "undefined" && Boolean(localStorage.getItem("vocaliq_agent_config"));

  const steps = [
    {
      id: "workspace",
      title: "Workspace Activated",
      description: "Aapka multi-tenant workspace live aur ready hai",
      href: "/dashboard/settings?tab=workspace",
      actionText: "View Settings",
      completed: true,
      icon: Sparkles,
    },
    {
      id: "knowledge",
      title: "Upload Knowledge Base Documents",
      description: "Company FAQs ya manuals upload karein (PDF/DOCX/TXT)",
      href: "/dashboard/knowledge-bases",
      actionText: "Manage Knowledge Bases",
      completed: hasDocs,
      icon: BookOpen,
    },
    {
      id: "agent",
      title: "Configure AI Voice Agent",
      description: "Agent ka naam, system prompt instructions, aur neural voice set karein",
      href: "/dashboard/agent",
      actionText: "Customize Agent",
      completed: agentCustomized || hasCalls,
      icon: Bot,
    },
    {
      id: "test-call",
      title: "Make Your First Voice Test Call",
      description: "Browser mic se live Whisper STT aur Edge TTS voice call test karein",
      href: "/dashboard/test-calls",
      actionText: "Start Test Call",
      completed: hasCalls,
      icon: Mic,
    },
    {
      id: "team",
      title: "Invite Team Members",
      description: "Apni team ko invite karein taake wo collaborate kar sakein",
      href: "/dashboard/settings?tab=team",
      actionText: "Invite Members",
      completed: false,
      icon: Users,
    },
  ];

  const completedCount = steps.filter((s) => s.completed).length;
  const progressPercent = Math.round((completedCount / steps.length) * 100);

  if (dismissed) {
    return null;
  }

  return (
    <Card className="relative overflow-hidden border-border/60 bg-gradient-to-br from-violet-500/10 via-card to-background shadow-lg transition-all duration-300">
      <div className="absolute top-0 left-0 h-1 w-full bg-border/40">
        <div
          className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 transition-all duration-500"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <CardHeader className="pt-5 pb-3">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="flex size-6 items-center justify-center rounded-full bg-violet-500/20 text-xs font-bold text-violet-400">
                🚀
              </span>
              <CardTitle className="text-base font-semibold">
                Getting Started Checklist
              </CardTitle>
              <span className="rounded-full bg-violet-500/15 px-2.5 py-0.5 text-xs font-medium text-violet-400">
                {completedCount} of {steps.length} completed ({progressPercent}%)
              </span>
            </div>
            <CardDescription className="text-xs">
              Apne AI Voice Customer Agent ko deploy karne ke liye ye steps mukammal karein.
            </CardDescription>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="size-7 text-muted-foreground hover:text-foreground"
              onClick={() => setCollapsed(!collapsed)}
              title={collapsed ? "Expand" : "Collapse"}
            >
              {collapsed ? (
                <ChevronDown className="size-4" />
              ) : (
                <ChevronUp className="size-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-7 text-muted-foreground hover:text-foreground"
              onClick={handleDismiss}
              title="Dismiss Checklist"
            >
              <X className="size-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      {!collapsed && (
        <CardContent className="space-y-3 pt-1 pb-4">
          <div className="grid gap-2.5 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {steps.map((step) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.id}
                  className={cn(
                    "flex flex-col justify-between rounded-lg border p-3 transition-all",
                    step.completed
                      ? "border-violet-500/20 bg-violet-500/5"
                      : "border-border/60 bg-muted/20 hover:border-border hover:bg-muted/40"
                  )}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon
                          className={cn(
                            "size-4",
                            step.completed
                              ? "text-violet-400"
                              : "text-muted-foreground"
                          )}
                        />
                        <span
                          className={cn(
                            "text-xs font-semibold",
                            step.completed
                              ? "text-foreground line-through opacity-80"
                              : "text-foreground"
                          )}
                        >
                          {step.title}
                        </span>
                      </div>
                      {step.completed ? (
                        <CheckCircle2 className="size-4 text-emerald-400 shrink-0" />
                      ) : (
                        <Circle className="size-4 text-muted-foreground/50 shrink-0" />
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">
                      {step.description}
                    </p>
                  </div>

                  <div className="pt-2.5 mt-auto">
                    <Button
                      variant={step.completed ? "ghost" : "outline"}
                      size="sm"
                      className={cn(
                        "h-7 w-full text-xs font-medium gap-1.5",
                        step.completed
                          ? "text-muted-foreground hover:text-foreground"
                          : "border-violet-500/30 text-violet-300 hover:bg-violet-500/10"
                      )}
                      asChild
                    >
                      <Link href={step.href}>
                        <span>{step.actionText}</span>
                        <ArrowRight className="size-3" />
                      </Link>
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>

          {progressPercent === 100 && (
            <div className="mt-2 flex items-center justify-between rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-2.5 text-xs text-emerald-400">
              <span className="flex items-center gap-1.5 font-medium">
                🎉 Congratulations! All initial setup steps are completed.
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-xs text-emerald-300 hover:text-emerald-200"
                onClick={handleDismiss}
              >
                Hide Checklist
              </Button>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
