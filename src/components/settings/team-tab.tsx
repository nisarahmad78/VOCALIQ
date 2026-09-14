"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Check,
  Copy,
  Loader2,
  MailPlus,
  RotateCw,
  Trash2,
  UserMinus,
} from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "@/components/providers/auth-provider";
import {
  createInvite,
  listInvites,
  removeMemberApi,
  resendInvite,
  revokeInvite,
  updateMemberRoleApi,
  type InviteInfo,
} from "@/lib/team-client";
import { getWorkspaceMembers, type MemberInfo } from "@/lib/ws-client";
import { ApiError } from "@/lib/api-client";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { TabsContent } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function StatusBadge({ status }: { status: InviteInfo["status"] }) {
  const config = {
    PENDING: { label: "Pending", className: "bg-yellow-500/15 text-yellow-500" },
    ACCEPTED: { label: "Accepted", className: "bg-green-500/15 text-green-500" },
    REVOKED: { label: "Revoked", className: "bg-red-500/15 text-red-500" },
    EXPIRED: { label: "Expired", className: "bg-muted text-muted-foreground" },
  }[status];
  return (
    <Badge variant="secondary" className={config.className}>
      {config.label}
    </Badge>
  );
}

export function TeamTab() {
  const { activeWorkspace, refreshWorkspaces } = useAuth();
  const [members, setMembers] = useState<MemberInfo[]>([]);
  const [invites, setInvites] = useState<InviteInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"ADMIN" | "MEMBER">("MEMBER");
  const [inviting, setInviting] = useState(false);
  const [lastLink, setLastLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const isOwner = activeWorkspace?.role === "OWNER";
  const isAdmin = activeWorkspace?.role === "ADMIN" || isOwner;

  const load = useCallback(async () => {
    if (!activeWorkspace) return;
    setLoading(true);
    try {
      const [membersList, invitesList] = await Promise.all([
        getWorkspaceMembers(activeWorkspace.id),
        listInvites(activeWorkspace.id),
      ]);
      setMembers(membersList);
      setInvites(invitesList);
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : "Load failed.";
      toast.error(message);
    }
    setLoading(false);
  }, [activeWorkspace]);

  useEffect(() => {
    const handle = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(handle);
  }, [load]);

  async function handleInvite(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!activeWorkspace) return;
    setInviting(true);
    try {
      const result = await createInvite(
        activeWorkspace.id,
        inviteEmail,
        inviteRole
      );
      setLastLink(result.inviteUrl);
      toast.success(`Invite created for ${inviteEmail}`);
      await load();
      setInviteEmail("");
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : "Invite failed.";
      toast.error(message);
    }
    setInviting(false);
  }

  async function handleCopyLink() {
    if (!lastLink) return;
    const url = `${window.location.origin}${lastLink}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success("Invite link copied!");
    setTimeout(() => setCopied(false), 2500);
  }

  async function handleResend(invite: InviteInfo) {
    if (!activeWorkspace) return;
    setBusyId(invite.id);
    try {
      const result = await resendInvite(activeWorkspace.id, invite.id);
      setLastLink(`/invite/${result.token}`);
      setInviteOpen(true);
      toast.success("New link generated — copy kar ke share karein");
      await load();
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : "Resend failed.";
      toast.error(message);
    }
    setBusyId(null);
  }

  async function handleRevoke(invite: InviteInfo) {
    if (!activeWorkspace) return;
    setBusyId(invite.id);
    try {
      await revokeInvite(activeWorkspace.id, invite.id);
      toast.success("Invite revoked");
      await load();
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : "Revoke failed.";
      toast.error(message);
    }
    setBusyId(null);
  }

  async function handleRoleChange(member: MemberInfo, role: string) {
    if (!activeWorkspace) return;
    setBusyId(member.userId);
    try {
      await updateMemberRoleApi(
        activeWorkspace.id,
        member.userId,
        role as "ADMIN" | "MEMBER"
      );
      toast.success(`${member.name} ab ${role} hain`);
      await Promise.all([load(), refreshWorkspaces()]);
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : "Role change failed.";
      toast.error(message);
    }
    setBusyId(null);
  }

  async function handleRemove(member: MemberInfo) {
    if (!activeWorkspace) return;
    setBusyId(member.userId);
    try {
      await removeMemberApi(activeWorkspace.id, member.userId);
      toast.success(`${member.name} removed`);
      await Promise.all([load(), refreshWorkspaces()]);
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : "Remove failed.";
      toast.error(message);
    }
    setBusyId(null);
  }

  if (!isAdmin) {
    return (
      <TabsContent value="team">
        <Card className="border-border/60 bg-card/50">
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Team manage karne ke liye ADMIN ya OWNER hona zaroori hai.
          </CardContent>
        </Card>
      </TabsContent>
    );
  }

  return (
    <TabsContent value="team" className="space-y-4">
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <Card className="border-border/60 bg-card/50">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <div className="space-y-1">
              <CardTitle className="text-base">Team Members</CardTitle>
              <CardDescription>
                {members.length} member(s) · {activeWorkspace?.name}
              </CardDescription>
            </div>
            <DialogTrigger asChild>
              <Button size="sm">
                <MailPlus />
                Invite Member
              </Button>
            </DialogTrigger>
          </CardHeader>
          <CardContent className="space-y-2">
            {members.map((member) => (
              <div
                key={member.userId}
                className="flex flex-wrap items-center gap-3 rounded-lg border border-border/60 px-3 py-2.5"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">
                    {member.name}
                    {member.role === "OWNER" ? (
                      <Badge variant="secondary" className="ml-2 bg-primary/15 text-primary">
                        Owner
                      </Badge>
                    ) : null}
                  </p>
                  <p className="text-xs text-muted-foreground">{member.email}</p>
                </div>
                {member.role !== "OWNER" ? (
                  <>
                    <Select
                      value={member.role}
                      onValueChange={(value) =>
                        void handleRoleChange(member, value)
                      }
                      disabled={busyId === member.userId}
                    >
                      <SelectTrigger className="w-28">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ADMIN">ADMIN</SelectItem>
                        <SelectItem value="MEMBER">MEMBER</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      disabled={busyId === member.userId}
                      onClick={() => void handleRemove(member)}
                    >
                      <UserMinus />
                      <span className="sr-only">Remove member</span>
                    </Button>
                  </>
                ) : null}
              </div>
            ))}
            {loading ? (
              <div className="flex justify-center py-4">
                <Loader2 className="size-4 animate-spin" />
              </div>
            ) : null}
          </CardContent>
        </Card>

        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite Member</DialogTitle>
            <DialogDescription>
              Link generate hoga — copy kar ke email/WhatsApp par share karein.
            </DialogDescription>
          </DialogHeader>
          {lastLink ? (
            <div className="space-y-3">
              <div className="rounded-lg border border-green-500/40 bg-green-500/10 p-3">
                <p className="mb-2 text-xs font-medium text-green-600 dark:text-green-400">
                  Invite link ready:
                </p>
                <code className="block break-all rounded bg-background/60 p-2 text-xs">
                  {typeof window !== "undefined"
                    ? `${window.location.origin}${lastLink}`
                    : lastLink}
                </code>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setLastLink(null)}>
                  Done
                </Button>
                <Button onClick={() => void handleCopyLink()}>
                  {copied ? <Check /> : <Copy />}
                  {copied ? "Copied!" : "Copy Link"}
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <form id="invite-form" onSubmit={handleInvite} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="invite-email">Email address</Label>
                <Input
                  id="invite-email"
                  type="email"
                  placeholder="teammate@company.com"
                  value={inviteEmail}
                  onChange={(event) => setInviteEmail(event.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Select
                  value={inviteRole}
                  onValueChange={(value) =>
                    setInviteRole(value as "ADMIN" | "MEMBER")
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MEMBER">
                      MEMBER — agents use kar sakta hai
                    </SelectItem>
                    <SelectItem value="ADMIN">
                      ADMIN — members bhi manage kar sakta hai
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={inviting}>
                  {inviting ? (
                    <>
                      <Loader2 className="animate-spin" />
                      Creating…
                    </>
                  ) : (
                    "Generate Invite"
                  )}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <Card className="border-border/60 bg-card/50">
        <CardHeader>
          <CardTitle className="text-base">Sent Invites</CardTitle>
          <CardDescription>Pending invites ka link dobara copy/resend kar sakte hain.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {invites.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Abhi koi invite nahi bheji.
            </p>
          ) : (
            invites.map((invite) => (
              <div
                key={invite.id}
                className="flex flex-wrap items-center gap-3 rounded-lg border border-border/60 px-3 py-2.5"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{invite.email}</p>
                  <p className="text-xs text-muted-foreground">
                    {invite.role} · expires{" "}
                    {new Date(invite.expiresAt).toLocaleDateString()}
                  </p>
                </div>
                <StatusBadge status={invite.status} />
                {invite.status === "PENDING" ? (
                  <div className="flex gap-1.5">
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      title="Resend / new link"
                      disabled={busyId === invite.id}
                      onClick={() => void handleResend(invite)}
                    >
                      <RotateCw />
                    </Button>
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      title="Revoke"
                      disabled={busyId === invite.id}
                      onClick={() => void handleRevoke(invite)}
                    >
                      <Trash2 />
                    </Button>
                  </div>
                ) : null}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </TabsContent>
  );
}
