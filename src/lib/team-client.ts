import { apiFetch } from "./api-client";

export interface InviteInfo {
  id: string;
  email: string;
  role: "ADMIN" | "MEMBER";
  status: "PENDING" | "ACCEPTED" | "REVOKED" | "EXPIRED";
  expiresAt: string;
  createdAt?: string;
  invitedByName?: string;
}

export interface InvitePreview {
  workspaceName: string;
  inviterName: string;
  inviterEmail: string;
  role: string;
  email: string;
  expiresAt: string;
}

export function createInvite(
  workspaceId: string,
  email: string,
  role: "ADMIN" | "MEMBER"
): Promise<{ invitation: InviteInfo; token: string; inviteUrl: string }> {
  return apiFetch(`/workspaces/${encodeURIComponent(workspaceId)}/invites`, {
    method: "POST",
    body: { email, role },
  });
}

export function listInvites(workspaceId: string): Promise<InviteInfo[]> {
  return apiFetch(
    `/workspaces/${encodeURIComponent(workspaceId)}/invites`
  );
}

export function revokeInvite(
  workspaceId: string,
  invitationId: string
): Promise<{ message: string }> {
  return apiFetch(
    `/workspaces/${encodeURIComponent(workspaceId)}/invites/${invitationId}`,
    { method: "DELETE" }
  );
}

export function resendInvite(
  workspaceId: string,
  invitationId: string
): Promise<{ token: string }> {
  return apiFetch(
    `/workspaces/${encodeURIComponent(workspaceId)}/invites/${invitationId}/resend`,
    { method: "POST" }
  );
}

export function getInvitePreview(token: string): Promise<InvitePreview> {
  return apiFetch(
    `/invitations/preview/${encodeURIComponent(token)}`,
    { skipAuth: true }
  );
}

export function acceptInvite(token: string): Promise<{
  workspaceId: string;
  message: string;
}> {
  return apiFetch(`/invitations/accept/${encodeURIComponent(token)}`, {
    method: "POST",
  });
}

export function updateMemberRoleApi(
  workspaceId: string,
  memberUserId: string,
  role: "ADMIN" | "MEMBER"
): Promise<{ role: string }> {
  return apiFetch(
    `/workspaces/${encodeURIComponent(workspaceId)}/members/${memberUserId}`,
    { method: "PATCH", body: { role } }
  );
}

export function removeMemberApi(
  workspaceId: string,
  memberUserId: string
): Promise<{ message: string }> {
  return apiFetch(
    `/workspaces/${encodeURIComponent(workspaceId)}/members/${memberUserId}`,
    { method: "DELETE" }
  );
}

export interface ActivityItem {
  id: string;
  action: string;
  actorName: string | null;
  targetSummary: string | null;
  createdAt: string;
}

export function getWorkspaceActivity(
  workspaceId: string
): Promise<ActivityItem[]> {
  return apiFetch(
    `/workspaces/${encodeURIComponent(workspaceId)}/activity`
  );
}

export function getAdminActivity(): Promise<ActivityItem[]> {
  return apiFetch("/admin/activity");
}

export interface NotificationItem {
  id: string;
  type: string;
  title: string;
  body: string | null;
  isRead: boolean;
  createdAt: string;
}

export function listNotifications(): Promise<{
  items: NotificationItem[];
  unreadCount: number;
}> {
  return apiFetch("/notifications");
}

export function markNotificationRead(id: string) {
  return apiFetch(`/notifications/${id}/read`, { method: "PATCH" });
}

export function markAllNotificationsRead() {
  return apiFetch("/notifications/read-all", { method: "POST" });
}
