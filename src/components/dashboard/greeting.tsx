"use client";

import { useAuth } from "@/components/providers/auth-provider";

export function DashboardGreeting() {
  const { user } = useAuth();
  const firstName = user?.name?.split(" ")[0] ?? user?.email ?? "there";

  return (
    <p className="text-sm text-muted-foreground">
      Welcome back, {firstName} — yahan aap ke workspace ki summary hai.
    </p>
  );
}
