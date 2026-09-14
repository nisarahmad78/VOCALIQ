"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Building2, Loader2, Mic, BookOpen } from "lucide-react";
import { toast } from "sonner";

import { apiFetch, ApiError } from "@/lib/api-client";
import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface WorkspaceResponse {
  id: string;
  name: string;
  slug: string;
  membership?: { role: string };
}

const steps = [
  {
    icon: Building2,
    title: "Create Workspace",
    description: "Your company ka dedicated space",
    active: true,
  },
  {
    icon: BookOpen,
    title: "Add Knowledge",
    description: "Documents upload karein",
    active: false,
  },
  {
    icon: Mic,
    title: "Go Live",
    description: "Agent ko test karein",
    active: false,
  },
];

export default function CreateWorkspacePage() {
  const router = useRouter();
  const { addWorkspace } = useAuth();
  const [workspaceName, setWorkspaceName] = useState("");
  const [loading, setLoading] = useState(false);

  function slugify(name: string) {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/[\s_]+/g, "-")
      .replace(/-+/g, "-");
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    try {
      const created = await apiFetch<WorkspaceResponse>("/workspaces", {
        method: "POST",
        body: { name: workspaceName },
      });
      addWorkspace({
        id: created.id,
        name: created.name,
        slug: created.slug,
        role: created.membership?.role,
      });
      toast.success(`Workspace "${workspaceName}" created!`);
      router.push("/dashboard");
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : "Workspace creation failed. Please try again.";
      toast.error(message);
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center px-4 py-10">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,--theme(--color-primary/15%),transparent)]"
      />
      <div className="mb-10 w-full max-w-xl">
        <ol className="flex items-center justify-between gap-2">
          {steps.map((step) => (
            <li
              key={step.title}
              className="flex flex-1 flex-col items-center gap-1.5 text-center"
            >
              <span
                className={
                  step.active
                    ? "flex size-11 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30"
                    : "flex size-11 items-center justify-center rounded-full border border-border bg-muted text-muted-foreground"
                }
              >
                <step.icon className="size-5" />
              </span>
              <p className="text-sm font-medium">{step.title}</p>
              <p className="hidden text-xs text-muted-foreground sm:block">
                {step.description}
              </p>
            </li>
          ))}
        </ol>
      </div>

      <div className="w-full max-w-md rounded-2xl border border-border/60 bg-card/80 p-6 text-center shadow-xl backdrop-blur sm:p-8">
        <h1 className="text-2xl font-bold tracking-tight">
          Create your workspace
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Ye aap ki company ka dedicated space hoga — agents, knowledge base
          aur conversations yahan rahengi.
        </p>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4 text-left">
          <div className="space-y-2">
            <Label htmlFor="workspaceName">Company / Workspace name</Label>
            <Input
              id="workspaceName"
              placeholder="e.g. My Company"
              value={workspaceName}
              onChange={(event) => setWorkspaceName(event.target.value)}
              required
              minLength={2}
            />
            {workspaceName ? (
              <p className="text-xs text-muted-foreground">
                URL:{" "}
                <span className="font-mono text-primary">
                  app.example.com/{slugify(workspaceName)}
                </span>
              </p>
            ) : null}
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Creating…
              </>
            ) : (
              "Create Workspace & Continue"
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
