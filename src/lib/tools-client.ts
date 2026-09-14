import { apiFetch } from "./api-client";

export interface WorkspaceTool {
  id: string;
  workspaceId: string;
  name: string;
  description: string;
  endpointUrl: string;
  method: string;
  headers: Record<string, string>;
  parametersSchema: Record<string, any>;
  isActive: number;
  createdAt: string;
}

export interface CreateToolPayload {
  name: string;
  description: string;
  endpointUrl: string;
  method?: string;
  headers?: Record<string, string>;
  parametersSchema: Record<string, any>;
}

export async function listWorkspaceTools(workspaceId: string): Promise<WorkspaceTool[]> {
  return apiFetch<WorkspaceTool[]>(`/workspaces/${workspaceId}/tools`);
}

export async function createWorkspaceTool(
  workspaceId: string,
  payload: CreateToolPayload
): Promise<WorkspaceTool> {
  return apiFetch<WorkspaceTool>(`/workspaces/${workspaceId}/tools`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function deleteWorkspaceTool(
  workspaceId: string,
  toolId: string
): Promise<{ success: boolean }> {
  return apiFetch<{ success: boolean }>(`/workspaces/${workspaceId}/tools/${toolId}`, {
    method: "DELETE",
  });
}
