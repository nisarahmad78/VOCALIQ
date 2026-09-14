"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bot,
  BookOpen,
  Building2,
  Check,
  ChevronDown,
  Layers,
  LayoutDashboard,
  MessagesSquare,
  Mic,
  Plus,
  Settings,
  ShieldCheck,
} from "lucide-react";

import { useAuth } from "@/components/providers/auth-provider";
import { Logo } from "@/components/logo";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const mainNav = [
  { title: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { title: "AI Agent", href: "/dashboard/agent", icon: Bot },
  { title: "Knowledge Bases", href: "/dashboard/knowledge-bases", icon: Layers },
  { title: "Test Calls", href: "/dashboard/test-calls", icon: Mic },
  {
    title: "Conversations",
    href: "/dashboard/conversations",
    icon: MessagesSquare,
  },
];

const settingsNav = [
  { title: "Settings", href: "/dashboard/settings", icon: Settings },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { user, workspaces, activeWorkspace, switchWorkspace } = useAuth();

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  }

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="px-2 py-1.5">
          <Logo href="/dashboard" />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="mt-3 flex w-full items-center gap-2 rounded-lg border border-border/60 bg-muted/40 px-2.5 py-2 text-left transition-colors hover:bg-muted">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-primary/20 text-[10px] font-bold text-primary">
                  {(activeWorkspace?.name ?? "W").slice(0, 2).toUpperCase()}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-xs font-medium">
                    {activeWorkspace?.name ?? "No workspace"}
                  </span>
                  <span className="block text-[10px] uppercase text-muted-foreground">
                    {activeWorkspace?.role?.toLowerCase() ?? "member"}
                  </span>
                </span>
                <ChevronDown className="size-3.5 shrink-0 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuLabel>Workspaces</DropdownMenuLabel>
              {workspaces.map((workspace) => (
                <DropdownMenuItem
                  key={workspace.id}
                  onClick={() => switchWorkspace(workspace.id)}
                >
                  <Building2 />
                  <span className="flex-1 truncate">{workspace.name}</span>
                  {activeWorkspace?.id === workspace.id ? (
                    <Check className="size-3.5 text-primary" />
                  ) : null}
                </DropdownMenuItem>
              ))}
              {workspaces.length === 0 ? (
                <div className="px-2 py-1.5 text-xs text-muted-foreground">
                  Koi workspace nahi
                </div>
              ) : null}
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/onboarding/create-workspace">
                  <Plus />
                  New Workspace
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Platform</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNav.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.href)}
                    tooltip={item.title}
                  >
                    <Link href={item.href}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {settingsNav.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton asChild isActive={isActive(item.href)}>
                    <Link href={item.href}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              {user?.role === "SUPERADMIN" ? (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Admin Console">
                    <Link href="/admin">
                      <ShieldCheck />
                      <span>Admin Console</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ) : null}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarFooter>
    </Sidebar>
  );
}
