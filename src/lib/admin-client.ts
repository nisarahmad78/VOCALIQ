import { apiFetch } from "./api-client";

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: "USER" | "SUPERADMIN";
  isBlocked: boolean;
  createdAt: string;
  workspaceCount: number;
}

export interface AdminUsersResponse {
  items: AdminUser[];
  total: number;
  page: number;
  limit: number;
}

export interface AdminStats {
  totalUsers: number;
  blockedUsers: number;
  superadmins: number;
  totalWorkspaces: number;
  totalRevenue: number;
  totalPayments: number;
  pendingPayments: number;
  pendingFeatureRequests: number;
}

export interface AdminWorkspace {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  ownerName: string;
  ownerEmail: string;
  memberCount: number;
  documentsCount: number;
}

export type FeatureKey =
  | "VOICE_AGENT"
  | "KNOWLEDGE_BASE"
  | "PHONE_CALLS"
  | "HUMAN_HANDOFF"
  | "ANALYTICS";

export type FeatureStatus = "PENDING" | "APPROVED" | "REVOKED";

export interface AdminPayment {
  id: string;
  plan: string;
  amount: string;
  currency: string;
  status: "PAID" | "PENDING" | "FAILED" | "REFUNDED";
  paidAt: string | null;
  createdAt: string;
  workspaceName: string;
  workspaceSlug: string;
}

export interface AdminPaymentsResponse {
  items: AdminPayment[];
  total: number;
  page: number;
  limit: number;
  summary: {
    totalRevenue: number;
    monthlyRevenue: number;
  };
}

export function getAdminStats(): Promise<AdminStats> {
  return apiFetch<AdminStats>("/admin/stats");
}

export function getAdminUsers(params: {
  q?: string;
  status?: "all" | "active" | "blocked";
  page?: number;
  limit?: number;
}): Promise<AdminUsersResponse> {
  const search = new URLSearchParams();
  if (params.q) search.set("q", params.q);
  if (params.status && params.status !== "all") search.set("status", params.status);
  if (params.page) search.set("page", String(params.page));
  if (params.limit) search.set("limit", String(params.limit));
  const qs = search.toString();
  return apiFetch<AdminUsersResponse>(`/admin/users${qs ? `?${qs}` : ""}`);
}

export interface AdminUserDetail extends AdminUser {
  emailVerified: boolean;
  lastLoginAt: string | null;
  workspaces: Array<{
    workspaceId: string;
    workspaceName: string;
    workspaceSlug: string;
    role: string;
    joinedAt: string;
    isOwner: boolean;
  }>;
}

export function getAdminUserDetail(
  userId: string
): Promise<AdminUserDetail> {
  return apiFetch<AdminUserDetail>(
    `/admin/users/${encodeURIComponent(userId)}`
  );
}

export function blockUser(userId: string): Promise<AdminUser> {
  return apiFetch<AdminUser>(`/admin/users/${userId}/block`, {
    method: "PATCH",
  });
}

export function impersonateUser(userId: string): Promise<{
  accessToken: string;
  refreshToken: string;
  user: { id: string; name: string; email: string };
}> {
  return apiFetch(`/admin/users/${userId}/impersonate`, {
    method: "POST",
  });
}

export function unblockUser(userId: string): Promise<AdminUser> {
  return apiFetch<AdminUser>(`/admin/users/${userId}/unblock`, {
    method: "PATCH",
  });
}

export function getAdminWorkspaces(q?: string): Promise<AdminWorkspace[]> {
  const query = q ? `?q=${encodeURIComponent(q)}` : "";
  return apiFetch<AdminWorkspace[]>(`/admin/workspaces${query}`);
}

export function getAdminPayments(params?: {
  page?: number;
  limit?: number;
}): Promise<AdminPaymentsResponse> {
  const search = new URLSearchParams();
  if (params?.page) search.set("page", String(params.page));
  if (params?.limit) search.set("limit", String(params.limit));
  const qs = search.toString();
  return apiFetch<AdminPaymentsResponse>(`/admin/payments${qs ? `?${qs}` : ""}`);
}

export function setFeatureStatus(
  workspaceId: string,
  featureKey: FeatureKey,
  status: FeatureStatus
): Promise<{ id: string; featureKey: string; status: FeatureStatus }> {
  return apiFetch(
    `/admin/workspaces/${workspaceId}/features/${featureKey}`,
    { method: "PATCH", body: { status } }
  );
}

export interface WorkspaceDetail {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  ownerId: string;
  ownerName: string;
  ownerEmail: string;
  members: Array<{
    userId: string;
    role: string;
    name: string;
    email: string;
  }>;
  features: Array<{
    featureKey: string;
    status: FeatureStatus;
    updatedAt: string;
  }>;
  payments: AdminPayment[];
  usage: {
    documents: number;
    chunks: number;
    conversations: number;
  };
}

export function getWorkspaceDetail(workspaceId: string): Promise<WorkspaceDetail> {
  return apiFetch<WorkspaceDetail>(
    `/admin/workspaces/${encodeURIComponent(workspaceId)}`
  );
}

export interface AdminAnnouncement {
  id: string;
  title: string;
  message: string;
  type: "INFO" | "WARNING" | "UPDATE" | "MAINTENANCE";
  isActive: number;
  dismissible: number;
  linkUrl: string | null;
  createdBy: string;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export function getAdminAnnouncements(): Promise<AdminAnnouncement[]> {
  return apiFetch<AdminAnnouncement[]>("/admin/announcements");
}

export function createAdminAnnouncement(data: {
  title: string;
  message: string;
  type?: "INFO" | "WARNING" | "UPDATE" | "MAINTENANCE";
  isActive?: number;
  dismissible?: number;
  linkUrl?: string;
  expiresAt?: string;
}): Promise<AdminAnnouncement> {
  return apiFetch<AdminAnnouncement>("/admin/announcements", {
    method: "POST",
    body: data,
  });
}

export function updateAdminAnnouncement(
  id: string,
  data: Partial<{
    title: string;
    message: string;
    type: "INFO" | "WARNING" | "UPDATE" | "MAINTENANCE";
    isActive: number;
    dismissible: number;
    linkUrl: string;
    expiresAt: string;
  }>
): Promise<AdminAnnouncement> {
  return apiFetch<AdminAnnouncement>(`/admin/announcements/${id}`, {
    method: "PATCH",
    body: data,
  });
}

export function deleteAdminAnnouncement(id: string): Promise<{ success: boolean; id: string }> {
  return apiFetch<{ success: boolean; id: string }>(`/admin/announcements/${id}`, {
    method: "DELETE",
  });
}

