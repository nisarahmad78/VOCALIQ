"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Activity,
  AlertTriangle,
  BadgeCheck,
  Building2,
  Camera,
  CreditCard,
  KeyRound,
  Loader2,
  LogOut,
  MailCheck,
  Save,
  Settings,
  Shield,
  Trash2,
  User,
  Users,
  Wrench,
} from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import { useAuth } from "@/components/providers/auth-provider";
import { TeamTab } from "@/components/settings/team-tab";
import { ActivityTab } from "@/components/settings/activity-tab";
import { BillingTab } from "@/components/settings/billing-tab";
import { WebhooksTab } from "@/components/settings/webhooks-tab";
import { apiFetch, ApiError } from "@/lib/api-client";
import {
  deleteWorkspaceApi,
  getWorkspaceMembers,
  leaveWorkspaceApi,
  transferOwnershipApi,
  updateWorkspaceApi,
  type MemberInfo,
} from "@/lib/ws-client";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-16">
      <div className="space-y-1.5">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
          <Settings className="size-3.5" />
          <span>Account & Preferences</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
          Settings
        </h1>
        <p className="text-sm text-muted-foreground">
          Manage your personal profile, authentication credentials, team collaboration, and workspace configuration.
        </p>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="mb-2">
          <TabsTrigger value="profile">
            <User className="size-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="security">
            <Shield className="size-4" />
            Security
          </TabsTrigger>
          <TabsTrigger value="team">
            <Users className="size-4" />
            Team
          </TabsTrigger>
          <TabsTrigger value="workspace">
            <Building2 className="size-4" />
            Workspace
          </TabsTrigger>
          <TabsTrigger value="billing">
            <CreditCard className="size-4" />
            Billing
          </TabsTrigger>
          <TabsTrigger value="activity">
            <Activity className="size-4" />
            Activity
          </TabsTrigger>
          <TabsTrigger value="webhooks">
            <Wrench className="size-4" />
            Live Tools &amp; Webhooks
          </TabsTrigger>
        </TabsList>
        <ProfileTab />
        <SecurityTab />
        <TeamTab />
        <WorkspaceTab />
        <BillingTab />
        <ActivityTab />
        <WebhooksTab />
      </Tabs>
    </div>
  );
}

function ProfileTab() {
  const { user, refreshUser } = useAuth();
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      if (user?.name) setName(user.name);
    }, 0);
    return () => window.clearTimeout(handle);
  }, [user?.name]);

  const initials =
    (user?.name ?? user?.email ?? "U")
      .split(/[\s@.]/)
      .filter(Boolean)
      .map((part) => part[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "U";

  async function handleAvatarChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Sirf image files (PNG, JPG, WebP) upload karein.");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image ka size 2MB se zyada nahi hona chahiye.");
      return;
    }

    setUploadingAvatar(true);
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      await apiFetch("/auth/avatar", {
        method: "PATCH",
        body: { avatarUrl: base64 },
      });
      await refreshUser();
      toast.success("Profile photo updated!");
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : "Avatar upload failed.";
      toast.error(message);
    }
    setUploadingAvatar(false);
  }

  async function handleRemoveAvatar() {
    setUploadingAvatar(true);
    try {
      await apiFetch("/auth/avatar", {
        method: "PATCH",
        body: { avatarUrl: null },
      });
      await refreshUser();
      toast.success("Profile photo removed.");
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : "Failed to remove photo.";
      toast.error(message);
    }
    setUploadingAvatar(false);
  }

  async function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    try {
      await apiFetch("/auth/profile", {
        method: "PATCH",
        body: { name },
      });
      await refreshUser();
      toast.success("Profile updated");
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : "Update failed.";
      toast.error(message);
    }
    setSaving(false);
  }

  return (
    <TabsContent value="profile" className="space-y-6">
      {!user?.emailVerified ? <EmailVerificationCard /> : null}
      <Card className="border-border/60 bg-card/60 backdrop-blur-md shadow-sm rounded-2xl overflow-hidden">
        <CardHeader className="border-b border-border/40 pb-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <CardTitle className="text-lg font-semibold flex items-center gap-2 text-foreground">
                <User className="size-4.5 text-primary" />
                Profile Information
              </CardTitle>
              <CardDescription>
                Update your avatar photo, display name, and view your registered email.
              </CardDescription>
            </div>
            {user?.role && (
              <span className="inline-flex w-fit items-center rounded-full bg-primary/10 border border-primary/20 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider text-primary">
                {user.role}
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <div className="relative group size-20 shrink-0">
              <Avatar className="size-20 border-2 border-border/80 shadow-md ring-2 ring-background">
                {user?.avatarUrl ? (
                  <AvatarImage src={user.avatarUrl} alt={user?.name ?? "Avatar"} />
                ) : null}
                <AvatarFallback className="bg-primary/15 text-primary text-xl font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              {uploadingAvatar ? (
                <div className="absolute inset-0 flex items-center justify-center rounded-full bg-background/80 backdrop-blur-xs">
                  <Loader2 className="size-6 animate-spin text-primary" />
                </div>
              ) : null}
            </div>

            <div className="space-y-1.5">
              <p className="text-sm font-medium text-foreground">Profile Photo</p>
              <p className="text-xs text-muted-foreground">
                Supported formats: PNG, JPG, WebP (Max 2MB)
              </p>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <label>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    onChange={handleAvatarChange}
                    disabled={uploadingAvatar}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="cursor-pointer gap-1.5 border-border/70 hover:bg-muted"
                    asChild
                  >
                    <span>
                      <Camera className="size-3.5" />
                      Change Photo
                    </span>
                  </Button>
                </label>
                {user?.avatarUrl ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10 gap-1.5"
                    onClick={handleRemoveAvatar}
                    disabled={uploadingAvatar}
                  >
                    <Trash2 className="size-3.5" />
                    Remove
                  </Button>
                ) : null}
              </div>
            </div>
          </div>

          <form id="profile-form" onSubmit={handleSave} className="space-y-4 pt-2">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="settings-name" className="text-sm font-medium">
                  Full Name
                </Label>
                <Input
                  id="settings-name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Enter your full name"
                  required
                  minLength={2}
                  className="bg-background/50 border-border/80 focus-visible:ring-primary/20"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="settings-email" className="text-sm font-medium">
                  Email Address
                </Label>
                <Input
                  id="settings-email"
                  value={user?.email ?? ""}
                  disabled
                  className="bg-muted/40 text-muted-foreground cursor-not-allowed border-border/60"
                />
              </div>
            </div>
          </form>
        </CardContent>
        <CardFooter className="justify-end border-t border-border/40 py-4 bg-muted/10">
          <Button type="submit" form="profile-form" disabled={saving} className="gap-2 shadow-sm">
            {saving ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Saving…
              </>
            ) : (
              <>
                <Save className="size-4" />
                Save Changes
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </TabsContent>
  );
}

function EmailVerificationCard() {
  const [sending, setSending] = useState(false);
  const [devLink, setDevLink] = useState<string | null>(null);

  async function sendLink() {
    setSending(true);
    try {
      const res = await apiFetch<{ message: string; verifyToken?: string }>(
        "/auth/send-verification",
        { method: "POST" }
      );
      if (res.verifyToken) {
        setDevLink(`/verify-email?token=${encodeURIComponent(res.verifyToken)}`);
      }
      toast.info(res.message);
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : "Failed to send verification link.";
      toast.error(message);
    }
    setSending(false);
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent p-4 sm:p-5 backdrop-blur-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3.5">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30">
            <MailCheck className="size-5" />
          </div>
          <div className="space-y-0.5">
            <p className="text-sm font-semibold text-foreground">Email Verification Pending</p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Verify your email address to enable team member invitations, workspace invites, and account recovery.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-center shrink-0">
          <Button
            size="sm"
            variant="outline"
            className="border-amber-500/30 bg-amber-500/10 text-amber-200 hover:bg-amber-500/20"
            onClick={() => void sendLink()}
            disabled={sending}
          >
            {sending ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              "Send Verification Link"
            )}
          </Button>
          {devLink ? (
            <Button size="sm" asChild variant="secondary">
              <a href={devLink}>Open link (dev mode)</a>
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function SecurityTab() {
  const { user, refreshUser } = useAuth();
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleChangePassword(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }
    setSaving(true);
    try {
      await apiFetch("/auth/password", {
        method: "PATCH",
        body: { currentPassword, newPassword },
      });
      toast.success("Password changed. Please login again.");
      setTimeout(() => {
        void refreshUser().finally(() => router.push("/login"));
      }, 1200);
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : "Change failed.";
      toast.error(message);
    }
    setSaving(false);
  }

  return (
    <TabsContent value="security" className="space-y-6">
      <div className="flex items-center justify-between rounded-xl border border-border/60 bg-card/60 backdrop-blur-md p-4 text-sm">
        <div className="flex items-center gap-3">
          <div
            className={`flex size-9 items-center justify-center rounded-lg ${
              user?.emailVerified
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
            }`}
          >
            {user?.emailVerified ? (
              <BadgeCheck className="size-5" />
            ) : (
              <AlertTriangle className="size-5" />
            )}
          </div>
          <div>
            <p className="font-semibold text-foreground">
              {user?.emailVerified ? "Email Verified" : "Email Unverified"}
            </p>
            <p className="text-xs text-muted-foreground">
              {user?.email}
            </p>
          </div>
        </div>
        {user?.emailVerified ? (
          <span className="inline-flex items-center rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-xs font-semibold text-emerald-400">
            Active
          </span>
        ) : (
          <span className="inline-flex items-center rounded-full bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 text-xs font-semibold text-amber-400">
            Pending
          </span>
        )}
      </div>

      <Card className="border-border/60 bg-card/60 backdrop-blur-md shadow-sm rounded-2xl overflow-hidden">
        <CardHeader className="border-b border-border/40 pb-5">
          <CardTitle className="text-lg font-semibold flex items-center gap-2 text-foreground">
            <KeyRound className="size-4.5 text-primary" />
            Change Password
          </CardTitle>
          <CardDescription>
            Ensure your account uses a strong, unique password. Changing password will sign out all other devices.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <form id="pw-form" onSubmit={handleChangePassword} className="space-y-4 max-w-lg">
            <div className="space-y-2">
              <Label htmlFor="cur-pw" className="text-sm font-medium">Current Password</Label>
              <Input
                id="cur-pw"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                className="bg-background/50 border-border/80 focus-visible:ring-primary/20"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="new-pw" className="text-sm font-medium">New Password</Label>
                <Input
                  id="new-pw"
                  type="password"
                  minLength={8}
                  placeholder="8+ characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  className="bg-background/50 border-border/80 focus-visible:ring-primary/20"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="conf-pw" className="text-sm font-medium">Confirm Password</Label>
                <Input
                  id="conf-pw"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="bg-background/50 border-border/80 focus-visible:ring-primary/20"
                />
              </div>
            </div>
          </form>
        </CardContent>
        <CardFooter className="justify-end border-t border-border/40 py-4 bg-muted/10">
          <Button type="submit" form="pw-form" disabled={saving} className="gap-2 shadow-sm">
            {saving ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Updating…
              </>
            ) : (
              "Update Password"
            )}
          </Button>
        </CardFooter>
      </Card>
    </TabsContent>
  );
}

function WorkspaceTab() {
  const {
    activeWorkspace,
    refreshWorkspaces,
    switchWorkspace,
    user,
  } = useAuth();
  const router = useRouter();

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [members, setMembers] = useState<MemberInfo[]>([]);
  const [transferTo, setTransferTo] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!activeWorkspace) return;
    const handle = window.setTimeout(() => {
      setName(activeWorkspace.name);
      setSlug(activeWorkspace.slug);
      getWorkspaceMembers(activeWorkspace.id)
        .then(setMembers)
        .catch(() => setMembers([]));
    }, 0);
    return () => window.clearTimeout(handle);
  }, [activeWorkspace]);

  if (!activeWorkspace) {
    return (
      <TabsContent value="workspace">
        <Card className="border-border/60 bg-card/60 backdrop-blur-md rounded-2xl">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center space-y-3">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-muted/60 text-muted-foreground">
              <Building2 className="size-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-semibold text-foreground">No Active Workspace</h3>
              <p className="text-xs text-muted-foreground max-w-sm">
                Create a new workspace or switch from the sidebar dropdown to configure workspace settings.
              </p>
            </div>
            <Button size="sm" asChild className="mt-2">
              <a href="/onboarding/create-workspace">Create Workspace</a>
            </Button>
          </CardContent>
        </Card>
      </TabsContent>
    );
  }

  const workspace = activeWorkspace;
  const isOwner = workspace.role === "OWNER";
  const others = members.filter((member) => member.userId !== user?.id);

  async function saveGeneral(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    try {
      await updateWorkspaceApi(workspace.id, { name, slug });
      await refreshWorkspaces();
      switchWorkspace(workspace.id);
      toast.success("Workspace updated");
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : "Update failed.";
      toast.error(message);
    }
    setBusy(false);
  }

  async function doTransfer() {
    if (!transferTo) return;
    setBusy(true);
    try {
      await transferOwnershipApi(workspace.id, transferTo);
      toast.success("Ownership transferred. Aap ab ADMIN hain.");
      await refreshWorkspaces();
      switchWorkspace(workspace.id);
      setTransferTo("");
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : "Transfer failed.";
      toast.error(message);
    }
    setBusy(false);
  }

  async function doLeave() {
    setBusy(true);
    try {
      await leaveWorkspaceApi(workspace.id);
      localStorage.removeItem("vocaliq_active_ws");
      await refreshWorkspaces();
      toast.success("Workspace left");
      router.push("/dashboard");
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : "Leave failed.";
      toast.error(message);
    }
    setBusy(false);
  }

  async function doDelete() {
    setBusy(true);
    try {
      await deleteWorkspaceApi(workspace.id);
      localStorage.removeItem("vocaliq_active_ws");
      await refreshWorkspaces();
      toast.success("Workspace deleted");
      router.push("/dashboard");
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : "Delete failed.";
      toast.error(message);
    }
    setBusy(false);
  }

  return (
    <TabsContent value="workspace" className="space-y-4">
      <Card className="border-border/60 bg-card/50">
        <CardHeader>
          <CardTitle className="text-base">General</CardTitle>
          <CardDescription>
            Role:{" "}
            <span className="font-medium text-foreground">
              {activeWorkspace.role}
            </span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form id="ws-form" onSubmit={saveGeneral} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="ws-name">Name</Label>
                <Input
                  id="ws-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  minLength={2}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ws-slug">Slug</Label>
                <Input
                  id="ws-slug"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  pattern="[a-z0-9\-]*"
                  required
                />
              </div>
            </div>
          </form>
        </CardContent>
        <CardFooter className="justify-end border-t border-border/60">
          <Button type="submit" form="ws-form" disabled={busy || !isOwner}>
            <Save />
            Save Changes
          </Button>
        </CardFooter>
      </Card>

      <Card className="border-border/60 bg-card/50">
        <CardHeader>
          <CardTitle className="text-base">Members ({members.length})</CardTitle>
          {isOwner ? (
            <CardDescription>
              Ownership transfer ke liye member select karein.
            </CardDescription>
          ) : null}
        </CardHeader>
        <CardContent className="space-y-2">
          {members.map((member) => (
            <div
              key={member.userId}
              className="flex items-center justify-between rounded-lg border border-border/60 px-3 py-2"
            >
              <div>
                <p className="text-sm font-medium">{member.name}</p>
                <p className="text-xs text-muted-foreground">{member.email}</p>
              </div>
              <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium">
                {member.role}
              </span>
            </div>
          ))}
          {isOwner && others.length > 0 ? (
            <div className="mt-4 flex flex-wrap items-end gap-3 rounded-xl border border-dashed border-border p-4">
              <div className="min-w-[220px] flex-1 space-y-2">
                <Label>Transfer ownership to</Label>
                <Select value={transferTo} onValueChange={setTransferTo}>
                  <SelectTrigger>
                    <SelectValue placeholder="Member select karein" />
                  </SelectTrigger>
                  <SelectContent>
                    {others.map((member) => (
                      <SelectItem key={member.userId} value={member.userId}>
                        {member.name} ({member.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" disabled={!transferTo || busy}>
                    Transfer Ownership
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Ownership transfer?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Aap ADMIN ban jayenge aur selected member OWNER. Ye
                      action undo nahi hota khud ba khud.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => void doTransfer()}>
                      Yes, transfer
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card className="border-red-500/40 bg-red-500/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base text-red-600 dark:text-red-400">
            <AlertTriangle className="size-4" />
            Danger Zone
          </CardTitle>
          <CardDescription>
            Ye actions undo nahi hote — dhyan se.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          {!isOwner ? (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" disabled={busy}>
                  <LogOut />
                  Leave Workspace
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Workspace chhorein?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Aap is workspace ka access kho denge.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => void doLeave()}>
                    Yes, leave
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ) : null}

          {isOwner ? (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" disabled={busy}>
                  Delete Workspace
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    &ldquo;{workspace.name}&rdquo; delete karein?
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    Members, features aur settings permanently delete ho
                    jayengi. Knowledge documents alag system mein rehte hain.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => void doDelete()}>
                    Yes, delete forever
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ) : null}
        </CardContent>
      </Card>
    </TabsContent>
  );
}
