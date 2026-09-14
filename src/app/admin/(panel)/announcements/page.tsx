"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Info,
  Loader2,
  Megaphone,
  Plus,
  Radio,
  Sparkles,
  Trash2,
  Wrench,
} from "lucide-react";
import { toast } from "sonner";

import {
  getAdminAnnouncements,
  createAdminAnnouncement,
  updateAdminAnnouncement,
  deleteAdminAnnouncement,
  type AdminAnnouncement,
} from "@/lib/admin-client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const TYPE_CONFIG = {
  INFO: {
    icon: Info,
    label: "Info",
    badge: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  },
  WARNING: {
    icon: AlertTriangle,
    label: "Warning",
    badge: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  },
  UPDATE: {
    icon: Sparkles,
    label: "Update",
    badge: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  },
  MAINTENANCE: {
    icon: Wrench,
    label: "Maintenance",
    badge: "bg-rose-500/15 text-rose-400 border-rose-500/30",
  },
};

export default function AdminAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<AdminAnnouncement[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Form State
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [type, setType] = useState<"INFO" | "WARNING" | "UPDATE" | "MAINTENANCE">("INFO");
  const [linkUrl, setLinkUrl] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [dismissible, setDismissible] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAdminAnnouncements();
      setAnnouncements(data || []);
    } catch (err: any) {
      toast.error(err.message || "Failed to load announcements");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openCreateDialog = () => {
    setEditingId(null);
    setTitle("");
    setMessage("");
    setType("INFO");
    setLinkUrl("");
    setIsActive(true);
    setDismissible(true);
    setDialogOpen(true);
  };

  const openEditDialog = (item: AdminAnnouncement) => {
    setEditingId(item.id);
    setTitle(item.title);
    setMessage(item.message);
    setType(item.type);
    setLinkUrl(item.linkUrl || "");
    setIsActive(Boolean(item.isActive));
    setDismissible(Boolean(item.dismissible));
    setDialogOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      toast.error("Title and message are required");
      return;
    }

    setSaving(true);
    try {
      if (editingId) {
        await updateAdminAnnouncement(editingId, {
          title: title.trim(),
          message: message.trim(),
          type,
          linkUrl: linkUrl.trim() || undefined,
          isActive: isActive ? 1 : 0,
          dismissible: dismissible ? 1 : 0,
        });
        toast.success("Announcement updated successfully");
      } else {
        await createAdminAnnouncement({
          title: title.trim(),
          message: message.trim(),
          type,
          linkUrl: linkUrl.trim() || undefined,
          isActive: isActive ? 1 : 0,
          dismissible: dismissible ? 1 : 0,
        });
        toast.success("Broadcast created and published");
      }
      setDialogOpen(false);
      load();
    } catch (err: any) {
      toast.error(err.message || "Failed to save announcement");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (item: AdminAnnouncement) => {
    try {
      const nextActive = item.isActive ? 0 : 1;
      await updateAdminAnnouncement(item.id, { isActive: nextActive });
      setAnnouncements((prev) =>
        prev.map((a) => (a.id === item.id ? { ...a, isActive: nextActive } : a))
      );
      toast.success(nextActive ? "Announcement activated" : "Announcement paused");
    } catch (err: any) {
      toast.error(err.message || "Failed to update status");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this announcement?")) return;
    try {
      await deleteAdminAnnouncement(id);
      setAnnouncements((prev) => prev.filter((a) => a.id !== id));
      toast.success("Announcement deleted");
    } catch (err: any) {
      toast.error(err.message || "Failed to delete announcement");
    }
  };

  const activeCount = announcements.filter((a) => a.isActive).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Broadcast Announcements
          </h1>
          <p className="text-sm text-muted-foreground">
            Publish global alert banners and system updates to all active platform users.
          </p>
        </div>
        <Button onClick={openCreateDialog} className="gap-2 shrink-0">
          <Plus className="size-4" />
          <span>New Broadcast</span>
        </Button>
      </div>

      {/* Stats row */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-border/60 bg-card/60">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">Total Broadcasts</CardDescription>
            <CardTitle className="text-2xl font-bold">{announcements.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-border/60 bg-card/60">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">Active Right Now</CardDescription>
            <CardTitle className="text-2xl font-bold text-emerald-400">
              {activeCount}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-border/60 bg-card/60">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">Delivery Channel</CardDescription>
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1.5 pt-1">
              <Radio className="size-4 text-violet-400 animate-pulse" />
              Global User Dashboard Top Banner
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Announcements List */}
      <Card className="border-border/60 bg-card/60">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Broadcast History</CardTitle>
          <CardDescription className="text-xs">
            Manage live and past announcement broadcasts.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12 gap-3 text-muted-foreground">
              <Loader2 className="size-5 animate-spin text-primary" />
              <p className="text-sm">Loading broadcasts...</p>
            </div>
          ) : announcements.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Megaphone className="size-10 text-muted-foreground/40 mb-3" />
              <p className="text-sm font-medium">No announcements published yet</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                Create your first broadcast to notify users about new features, system updates, or maintenance schedules.
              </p>
              <Button onClick={openCreateDialog} size="sm" className="mt-4 gap-2">
                <Plus className="size-4" />
                <span>Create Announcement</span>
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-border/40">
              {announcements.map((item) => {
                const config = TYPE_CONFIG[item.type] || TYPE_CONFIG.INFO;
                const Icon = config.icon;

                return (
                  <div
                    key={item.id}
                    className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between transition-colors hover:bg-muted/10 px-2 rounded-lg"
                  >
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge
                          variant="outline"
                          className={cn("text-xs font-semibold gap-1", config.badge)}
                        >
                          <Icon className="size-3" />
                          {config.label}
                        </Badge>

                        <span className="font-semibold text-sm text-foreground">
                          {item.title}
                        </span>

                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px]",
                            item.isActive
                              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                              : "border-muted text-muted-foreground"
                          )}
                        >
                          {item.isActive ? "Live" : "Paused"}
                        </Badge>
                      </div>

                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {item.message}
                      </p>

                      <div className="flex flex-wrap items-center gap-4 text-[11px] text-muted-foreground pt-1">
                        <span>Created: {new Date(item.createdAt).toLocaleDateString()}</span>
                        {item.linkUrl && (
                          <a
                            href={item.linkUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-primary hover:underline"
                          >
                            <span>Link: {item.linkUrl}</span>
                            <ExternalLink className="size-3" />
                          </a>
                        )}
                        <span>Dismissible: {item.dismissible ? "Yes" : "No"}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <div className="flex items-center gap-1.5 mr-2">
                        <Label htmlFor={`switch-${item.id}`} className="text-xs text-muted-foreground">
                          Active
                        </Label>
                        <Switch
                          id={`switch-${item.id}`}
                          checked={Boolean(item.isActive)}
                          onCheckedChange={() => handleToggleActive(item)}
                        />
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs"
                        onClick={() => openEditDialog(item)}
                      >
                        Edit
                      </Button>

                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        onClick={() => handleDelete(item.id)}
                        title="Delete"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <form onSubmit={handleSave}>
            <DialogHeader>
              <DialogTitle>
                {editingId ? "Edit Announcement" : "Create New Broadcast"}
              </DialogTitle>
              <DialogDescription className="text-xs">
                This announcement will be displayed prominently at the top of user dashboards.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="space-y-1.5">
                <Label htmlFor="title" className="text-xs font-semibold">
                  Announcement Title
                </Label>
                <Input
                  id="title"
                  placeholder="e.g., Scheduled Maintenance / New Voice Feature Live"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="type" className="text-xs font-semibold">
                  Category / Severity
                </Label>
                <Select
                  value={type}
                  onValueChange={(val: any) => setType(val)}
                >
                  <SelectTrigger id="type">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INFO">ℹ️ Info (General updates)</SelectItem>
                    <SelectItem value="UPDATE">✨ Update (New feature launch)</SelectItem>
                    <SelectItem value="WARNING">⚠️ Warning (Important advisory)</SelectItem>
                    <SelectItem value="MAINTENANCE">🔧 Maintenance (Scheduled downtime)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="message" className="text-xs font-semibold">
                  Message Content
                </Label>
                <Textarea
                  id="message"
                  placeholder="Write clear, concise notification text..."
                  rows={3}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="linkUrl" className="text-xs font-semibold">
                  Action Link URL (Optional)
                </Label>
                <Input
                  id="linkUrl"
                  placeholder="https://... or /dashboard/test-calls"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                />
              </div>

              <div className="flex items-center justify-between border-t border-border/40 pt-3">
                <div className="space-y-0.5">
                  <Label htmlFor="isActiveSwitch" className="text-xs font-semibold">
                    Publish Immediately
                  </Label>
                  <p className="text-[11px] text-muted-foreground">
                    Enable this broadcast live right away
                  </p>
                </div>
                <Switch
                  id="isActiveSwitch"
                  checked={isActive}
                  onCheckedChange={setIsActive}
                />
              </div>

              <div className="flex items-center justify-between border-t border-border/40 pt-3">
                <div className="space-y-0.5">
                  <Label htmlFor="dismissibleSwitch" className="text-xs font-semibold">
                    Allow Users to Dismiss
                  </Label>
                  <p className="text-[11px] text-muted-foreground">
                    Users can click (X) to hide this banner
                  </p>
                </div>
                <Switch
                  id="dismissibleSwitch"
                  checked={dismissible}
                  onCheckedChange={setDismissible}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Saving...
                  </>
                ) : editingId ? (
                  "Update Announcement"
                ) : (
                  "Publish Broadcast"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
