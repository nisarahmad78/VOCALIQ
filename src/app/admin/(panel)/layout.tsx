"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import {
  ArrowLeft,
  CreditCard,
  LayoutDashboard,
  Loader2,
  Megaphone,
  ShieldCheck,
  Users,
  Building2,
} from "lucide-react";

import { CommandPalette } from "@/components/command-palette";
import { useAuth } from "@/components/providers/auth-provider";
import { Logo } from "@/components/logo";
import { cn } from "@/lib/utils";

const adminNav = [
  { title: "Overview", href: "/admin", icon: LayoutDashboard },
  { title: "Users", href: "/admin/users", icon: Users },
  { title: "Workspaces", href: "/admin/workspaces", icon: Building2 },
  { title: "Payments", href: "/admin/payments", icon: CreditCard },
  { title: "Announcements", href: "/admin/announcements", icon: Megaphone },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.replace("/admin/login");
      return;
    }
    if (user.role !== "SUPERADMIN") {
      router.replace("/dashboard");
    }
  }, [isLoading, user, router]);

  if (isLoading || user?.role !== "SUPERADMIN") {
    return (
      <div className="flex min-h-screen items-center justify-center gap-3">
        <Loader2 className="size-5 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Verifying access…</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-border/60 bg-sidebar md:flex">
        <div className="flex h-16 items-center gap-3 border-b border-border/60 px-4">
          <Logo href="/admin" />
        </div>
        <div className="px-4 pt-4">
          <span className="inline-flex items-center gap-1.5 rounded-md bg-red-500/15 px-2 py-1 text-xs font-semibold text-red-500">
            <ShieldCheck className="size-3.5" />
            SUPER ADMIN
          </span>
        </div>
        <nav className="flex-1 space-y-1 p-4">
          {adminNav.map((item) => {
            const active =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary/15 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon className="size-4" />
                {item.title}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-border/60 p-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            User Dashboard
          </Link>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center gap-3 border-b border-border/60 bg-background/80 px-4 backdrop-blur md:hidden">
          <Link href="/admin" className="text-sm font-semibold">
            VocalIQ Admin
          </Link>
          <nav className="ml-auto flex gap-2 overflow-x-auto">
            {adminNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-label={item.title}
                className={cn(
                  "rounded-lg p-2",
                  pathname === item.href
                    ? "bg-primary/15 text-primary"
                    : "text-muted-foreground"
                )}
              >
                <item.icon className="size-4" />
              </Link>
            ))}
          </nav>
        </header>
        <div className="hidden h-12 items-center justify-end border-b border-border/60 bg-background/60 px-6 backdrop-blur md:flex">
          <CommandPalette portal="admin" />
        </div>
        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
