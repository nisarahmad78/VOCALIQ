"use client";

import { XCircle } from "lucide-react";

import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";

export function ImpersonationBanner() {
  const { impersonating, user, exitImpersonation } = useAuth();

  if (!impersonating || !user) return null;

  return (
    <div className="sticky top-0 z-[100] flex items-center justify-center gap-3 bg-red-600 px-4 py-2 text-white">
      <span className="text-sm">
        <strong>Viewing as:</strong> {user.name} ({user.email})
      </span>
      <Button
        size="xs"
        variant="outline"
        className="border-white/40 bg-transparent text-white hover:bg-white/15 hover:text-white"
        onClick={exitImpersonation}
      >
        <XCircle />
        Exit View — Back to Admin
      </Button>
    </div>
  );
}
