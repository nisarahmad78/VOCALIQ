"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Layers, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function KnowledgeRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/dashboard/knowledge-bases");
  }, [router]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-4 animate-pulse">
        <Layers className="h-7 w-7" />
      </div>
      <h2 className="text-xl font-bold tracking-tight">Redirecting to Knowledge Bases...</h2>
      <p className="mt-1.5 text-sm text-muted-foreground max-w-sm">
        We have upgraded to modular Multi-Product Knowledge Bases. Redirecting you now...
      </p>
      <div className="mt-6 flex items-center gap-3">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
        <Button asChild variant="outline" size="sm">
          <Link href="/dashboard/knowledge-bases">Click here if not redirected</Link>
        </Button>
      </div>
    </div>
  );
}
