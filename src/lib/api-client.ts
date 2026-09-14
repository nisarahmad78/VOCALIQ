import { ApiError, httpFetch } from "./http";

const BASE_URL =
  process.env.NEXT_PUBLIC_AUTH_API_URL ?? "http://localhost:4000";

export { ApiError };

export async function apiFetch<T>(
  path: string,
  options: {
    method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
    body?: unknown;
    skipAuth?: boolean;
    retryOn401?: boolean;
  } = {}
): Promise<T> {
  const { method, body, skipAuth, retryOn401 } = options;
  return httpFetch<T>(BASE_URL, path, {
    method,
    json: body,
    skipAuth,
    retryOn401,
  });
}

export interface Announcement {
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

export function getActiveAnnouncements(): Promise<Announcement[]> {
  return apiFetch<Announcement[]>("/announcements/active", { skipAuth: true });
}
