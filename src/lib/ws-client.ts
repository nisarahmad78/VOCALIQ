import { apiFetch } from "./api-client";

export interface MemberInfo {
  userId: string;
  role: "OWNER" | "ADMIN" | "MEMBER";
  name: string;
  email: string;
  joinedAt: string;
}

export function getWorkspaceMembers(
  workspaceId: string
): Promise<MemberInfo[]> {
  return apiFetch<MemberInfo[]>(
    `/workspaces/${encodeURIComponent(workspaceId)}/members`
  );
}

export function updateWorkspaceApi(
  workspaceId: string,
  data: { name?: string; slug?: string }
): Promise<{ id: string; name: string; slug: string }> {
  return apiFetch(`/workspaces/${encodeURIComponent(workspaceId)}`, {
    method: "PATCH",
    body: data,
  });
}

export function deleteWorkspaceApi(
  workspaceId: string
): Promise<{ message: string }> {
  return apiFetch(`/workspaces/${encodeURIComponent(workspaceId)}`, {
    method: "DELETE",
  });
}

export function leaveWorkspaceApi(
  workspaceId: string
): Promise<{ message: string }> {
  return apiFetch(`/workspaces/${encodeURIComponent(workspaceId)}/leave`, {
    method: "POST",
  });
}

export function transferOwnershipApi(
  workspaceId: string,
  toUserId: string
): Promise<{ message: string }> {
  return apiFetch(`/workspaces/${encodeURIComponent(workspaceId)}/transfer`, {
    method: "POST",
    body: { toUserId },
  });
}
