"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Plus, Trash2, Wrench } from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "@/components/providers/auth-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TabsContent } from "@/components/ui/tabs";
import {
  listWorkspaceTools,
  createWorkspaceTool,
  deleteWorkspaceTool,
  type WorkspaceTool,
} from "@/lib/tools-client";

export function WebhooksTab() {
  const { activeWorkspace } = useAuth();
  const [tools, setTools] = useState<WorkspaceTool[]>([]);
  const [loadingTools, setLoadingTools] = useState(false);
  const [newToolName, setNewToolName] = useState("");
  const [newToolDesc, setNewToolDesc] = useState("");
  const [newToolUrl, setNewToolUrl] = useState("");

  const loadTools = useCallback(async () => {
    if (!activeWorkspace?.id) return;
    setLoadingTools(true);
    try {
      const data = await listWorkspaceTools(activeWorkspace.id);
      setTools(data);
    } catch {
      // Failed to load tools
    } finally {
      setLoadingTools(false);
    }
  }, [activeWorkspace?.id]);

  useEffect(() => {
    void loadTools();
  }, [loadTools]);

  async function handleAddTool(e: React.FormEvent) {
    e.preventDefault();
    if (!activeWorkspace?.id || !newToolName.trim() || !newToolUrl.trim()) return;
    try {
      const created = await createWorkspaceTool(activeWorkspace.id, {
        name: newToolName.trim(),
        description: newToolDesc.trim() || "Live API action",
        endpointUrl: newToolUrl.trim(),
        method: "POST",
        parametersSchema: { type: "object", properties: {} },
      });
      setTools((prev) => [created, ...prev]);
      setNewToolName("");
      setNewToolDesc("");
      setNewToolUrl("");
      toast.success("Tool added successfully!");
    } catch {
      toast.error("Failed to add tool.");
    }
  }

  async function handleDeleteTool(toolId: string) {
    if (!activeWorkspace?.id) return;
    try {
      await deleteWorkspaceTool(activeWorkspace.id, toolId);
      setTools((prev) => prev.filter((t) => t.id !== toolId));
      toast.success("Tool removed.");
    } catch {
      toast.error("Failed to remove tool.");
    }
  }

  return (
    <TabsContent value="webhooks" className="space-y-6">
      <Card className="border-border/60 bg-card/40">
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="space-y-1">
              <CardTitle className="text-lg flex items-center gap-2">
                <Wrench className="size-5 text-primary" />
                Live Actions &amp; Webhook Tools
              </CardTitle>
              <CardDescription>
                AI Agent ko live call ke doran external APIs (e.g. Appointment Booking, CRM Lead Update, Order Lookup) call karne ki ijazat dein.
              </CardDescription>
            </div>
            <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary">
              Function Calling Active
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <form
            onSubmit={handleAddTool}
            className="rounded-lg border border-border/60 bg-muted/30 p-4 space-y-3"
          >
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Add New Custom Tool / Webhook
            </h4>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="tool-name" className="text-xs">Tool Name</Label>
                <Input
                  id="tool-name"
                  placeholder="e.g. book_appointment"
                  value={newToolName}
                  onChange={(e) => setNewToolName(e.target.value)}
                  className="h-8 text-xs font-mono"
                  required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="tool-url" className="text-xs">Webhook Endpoint URL</Label>
                <Input
                  id="tool-url"
                  placeholder="https://api.yourdomain.com/book"
                  value={newToolUrl}
                  onChange={(e) => setNewToolUrl(e.target.value)}
                  className="h-8 text-xs font-mono"
                  required
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="tool-desc" className="text-xs">
                Description (When should AI call this?)
              </Label>
              <Input
                id="tool-desc"
                placeholder="e.g. Book a clinic appointment when customer provides date and time"
                value={newToolDesc}
                onChange={(e) => setNewToolDesc(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
            <div className="flex justify-end pt-1">
              <Button type="submit" size="sm" className="h-8 text-xs gap-1.5">
                <Plus className="size-3.5" />
                Add Action Tool
              </Button>
            </div>
          </form>

          {/* Tools List */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Configured Tools ({tools.length})
            </h4>
            {loadingTools ? (
              <div className="flex justify-center p-6">
                <Loader2 className="size-5 animate-spin text-muted-foreground" />
              </div>
            ) : tools.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border/60 p-8 text-center text-xs text-muted-foreground">
                No custom tools configured yet. Add your first webhook tool above to allow the agent to trigger live external actions during calls.
              </div>
            ) : (
              <div className="space-y-2">
                {tools.map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center justify-between rounded-lg border border-border/50 bg-background/60 p-3"
                  >
                    <div className="space-y-0.5 min-w-0 pr-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-medium text-xs text-foreground">
                          {t.name}
                        </span>
                        <Badge variant="outline" className="text-[10px] uppercase font-mono py-0 h-4">
                          {t.method}
                        </Badge>
                      </div>
                      <p className="font-mono text-[11px] text-muted-foreground truncate max-w-md">
                        {t.endpointUrl}
                      </p>
                      {t.description && (
                        <p className="text-xs text-muted-foreground/80 line-clamp-1">
                          {t.description}
                        </p>
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-7 text-muted-foreground hover:text-destructive shrink-0"
                      onClick={() => void handleDeleteTool(t.id)}
                      title="Remove tool"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </TabsContent>
  );
}
