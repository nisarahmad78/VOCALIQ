"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  AlertTriangle,
  ExternalLink,
  Info,
  Megaphone,
  Sparkles,
  Wrench,
  X,
} from "lucide-react";

import { getActiveAnnouncements, type Announcement } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const TYPE_CONFIG = {
  INFO: {
    icon: Info,
    badgeBg: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    containerBg: "from-blue-500/10 via-blue-500/5 to-transparent border-blue-500/30",
  },
  WARNING: {
    icon: AlertTriangle,
    badgeBg: "bg-amber-500/20 text-amber-300 border-amber-500/30",
    containerBg: "from-amber-500/10 via-amber-500/5 to-transparent border-amber-500/30",
  },
  UPDATE: {
    icon: Sparkles,
    badgeBg: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    containerBg: "from-emerald-500/10 via-emerald-500/5 to-transparent border-emerald-500/30",
  },
  MAINTENANCE: {
    icon: Wrench,
    badgeBg: "bg-rose-500/20 text-rose-300 border-rose-500/30",
    containerBg: "from-rose-500/10 via-rose-500/5 to-transparent border-rose-500/30",
  },
};

export function AnnouncementBanner() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("vocaliq_dismissed_announcements");
      if (stored) {
        setDismissedIds(JSON.parse(stored));
      }
    } catch {
      // ignore
    }

    getActiveAnnouncements()
      .then((data) => {
        setAnnouncements(data || []);
      })
      .catch(() => {
        // ignore error silently
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const handleDismiss = (id: string) => {
    const updated = [...dismissedIds, id];
    setDismissedIds(updated);
    try {
      localStorage.setItem("vocaliq_dismissed_announcements", JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  const visibleAnnouncements = announcements.filter(
    (a) => !dismissedIds.includes(a.id)
  );

  if (loading || visibleAnnouncements.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2 mb-4">
      {visibleAnnouncements.map((item) => {
        const config = TYPE_CONFIG[item.type] || TYPE_CONFIG.INFO;
        const Icon = config.icon;

        return (
          <div
            key={item.id}
            className={cn(
              "relative flex items-center justify-between gap-3 rounded-lg border bg-gradient-to-r p-3 text-xs shadow-md transition-all",
              config.containerBg
            )}
          >
            <div className="flex items-center gap-2.5 flex-1 min-w-0">
              <span
                className={cn(
                  "flex size-6 shrink-0 items-center justify-center rounded-md border font-semibold",
                  config.badgeBg
                )}
              >
                <Icon className="size-3.5" />
              </span>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 min-w-0">
                <span className="font-semibold text-foreground">
                  {item.title}
                </span>
                <span className="text-muted-foreground line-clamp-1">
                  — {item.message}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {item.linkUrl && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-6 text-[11px] px-2 gap-1 border-border/80"
                  asChild
                >
                  <Link
                    href={item.linkUrl}
                    target={item.linkUrl.startsWith("http") ? "_blank" : undefined}
                    rel={item.linkUrl.startsWith("http") ? "noopener noreferrer" : undefined}
                  >
                    <span>Learn More</span>
                    <ExternalLink className="size-3" />
                  </Link>
                </Button>
              )}

              {Boolean(item.dismissible) && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-6 text-muted-foreground hover:text-foreground"
                  onClick={() => handleDismiss(item.id)}
                  title="Dismiss"
                >
                  <X className="size-3.5" />
                </Button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
