import { clearTokens, getAccessToken, getRefreshToken, setTokens } from "./auth-tokens";

export class ApiError extends Error {
  status: number;
  details?: unknown;

  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

interface ApiErrorResponse {
  message?: string | string[];
  detail?: string;
  statusCode?: number;
}

function extractMessage(data: ApiErrorResponse): string {
  if (Array.isArray(data.message)) return data.message[0];
  if (typeof data.message === "string") return data.message;
  if (typeof data.detail === "string") return data.detail;
  return "Something went wrong. Please try again.";
}

async function requestRefresh(base: string): Promise<boolean> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;

  try {
    const res = await fetch(`${base}/api/v1/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) return false;
    const data = (await res.json()) as {
      accessToken: string;
      refreshToken: string;
    };
    setTokens(data.accessToken, data.refreshToken);
    return true;
  } catch {
    return false;
  }
}

export interface HttpOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  json?: unknown;
  form?: FormData;
  skipAuth?: boolean;
  retryOn401?: boolean;
}

export async function httpFetch<T>(
  base: string,
  path: string,
  options: HttpOptions = {}
): Promise<T> {
  const {
    method = "GET",
    json,
    form,
    skipAuth = false,
    retryOn401 = true,
  } = options;

  const headers: Record<string, string> = {};
  if (!form) headers["Content-Type"] = "application/json";
  const token = getAccessToken();
  if (!skipAuth && token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const body = form ?? (json === undefined ? undefined : JSON.stringify(json));

  const res = await fetch(`${base}/api/v1${path}`, {
    method,
    headers,
    body,
  });

  if (res.status === 401 && !skipAuth && retryOn401) {
    const refreshed = await requestRefresh(base);
    if (refreshed) {
      return httpFetch<T>(base, path, { ...options, retryOn401: false });
    }
    clearTokens();
  }

  const data = (await res.json().catch(() => ({}))) as T & ApiErrorResponse;

  if (!res.ok) {
    throw new ApiError(res.status, extractMessage(data), data);
  }
  return data;
}
