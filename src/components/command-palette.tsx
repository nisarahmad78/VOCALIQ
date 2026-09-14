"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Bot,
  Building2,
  CreditCard,
  Layers,
  LayoutDashboard,
  MessagesSquare,
  Mic,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  Users,
} from "lucide-react";

import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";

interface PaletteItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const userItems: PaletteItem[] = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { label: "AI Agent", href: "/dashboard/agent", icon: Bot },
  { label: "Knowledge Bases", href: "/dashboard/knowledge-bases", icon: Layers },
  { label: "Test Calls", href: "/dashboard/test-calls", icon: Mic },
  { label: "Conversations", href: "/dashboard/conversations", icon: MessagesSquare },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
];

const userActionItems: PaletteItem[] = [
  { label: "New Workspace", href: "/onboarding/create-workspace", icon: Plus },
];

const adminItems: PaletteItem[] = [
  { label: "Overview", href: "/admin", icon: LayoutDashboard },
  { label: "Users", href: "/admin/users", icon: Users },
  { label: "Workspaces", href: "/admin/workspaces", icon: Building2 },
  { label: "Payments", href: "/admin/payments", icon: CreditCard },
  { label: "Admin Login Page", href: "/admin/login", icon: ShieldCheck },
];

export function CommandPalette({
  portal = "user",
}: {
  portal?: "user" | "admin";
}) {
  const router = useRouter();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);

  const items = useMemo(() => {
    if (portal === "admin") return adminItems;
    const base = [...userItems];
    if (user?.role === "SUPERADMIN") {
      base.push({ label: "Admin Console", href: "/admin", icon: ShieldCheck });
    }
    if (activeWorkspaceExists()) {
      base.push(...userActionItems);
    }
    return base;

    function activeWorkspaceExists() {
      // quick action sirf tab jab workspace ho — localStorage se sync check
      if (typeof window === "undefined") return false;
      return Boolean(localStorage.getItem("vocaliq_active_ws"));
    }
  }, [portal, user?.role]);

  const filtered = useMemo(() => {
    if (!query.trim()) return items;
    const q = query.toLowerCase();
    return items.filter((item) => item.label.toLowerCase().includes(q));
  }, [items, query]);

  const navigate = useCallback(
    (item: PaletteItem) => {
      setOpen(false);
      setQuery("");
      setActiveIndex(0);
      router.push(item.href);
    },
    [router]
  );

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((prev) => !prev);
        setQuery("");
        setActiveIndex(0);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    const handle = window.setTimeout(() => setActiveIndex(0), 0);
    return () => window.clearTimeout(handle);
  }, [query]);

  function onInputKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => (index + 1) % Math.max(1, filtered.length));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex(
        (index) =>
          (index - 1 + Math.max(1, filtered.length)) %
          Math.max(1, filtered.length)
      );
    } else if (event.key === "Enter" && filtered[activeIndex]) {
      event.preventDefault();
      navigate(filtered[activeIndex]);
    } else if (event.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="hidden items-center gap-2 rounded-lg border border-border/60 bg-muted/40 px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted sm:flex"
      >
        <Search className="size-3.5" />
        Search…
        <kbd className="rounded border border-border bg-background px-1.5 font-mono text-[10px]">
          Ctrl K
        </kbd>
      </button>
      <Button
        variant="ghost"
        size="icon"
        className="sm:hidden"
        onClick={() => setOpen(true)}
        aria-label="Search"
      >
        <Search className="size-4.5" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="top-[20%] translate-y-0 gap-0 p-0">
          <DialogTitle className="sr-only">Command palette</DialogTitle>
          <div className="flex items-center gap-2 border-b border-border/60 px-4 py-3">
            <Search className="size-4 shrink-0 text-muted-foreground" />
            <input
              autoFocus
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={onInputKeyDown}
              placeholder="Type a page or action…"
              className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
            <kbd className="rounded border border-border bg-muted px-1.5 font-mono text-[10px] text-muted-foreground">
              ESC
            </kbd>
          </div>
          <div className="max-h-72 overflow-y-auto p-1.5">
            {filtered.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Koi result nahi mila.
              </p>
            ) : (
              filtered.map((item, index) => (
                <button
                  key={item.href + item.label}
                  onClick={() => navigate(item)}
                  onMouseEnter={() => setActiveIndex(index)}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
                    index === activeIndex
                      ? "bg-primary/15 text-primary"
                      : "hover:bg-muted"
                  }`}
                >
                  <item.icon className="size-4 shrink-0" />
                  <span className="flex-1">{item.label}</span>
                  <ArrowRight className="size-3.5 opacity-50" />
                </button>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
