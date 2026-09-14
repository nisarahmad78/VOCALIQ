const ACCESS_TOKEN_KEY = "vocaliq_access_token";
const REFRESH_TOKEN_KEY = "vocaliq_refresh_token";
const IMPERSONATING_KEY = "vocaliq_impersonating";
const SNAPSHOT_KEY = "vocaliq_admin_snapshot";

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setTokens(accessToken: string, refreshToken: string) {
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
}

export function clearTokens() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

export function isImpersonating(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(IMPERSONATING_KEY) === "1";
}

export function startImpersonationSession(
  accessToken: string,
  refreshToken: string
) {
  const access = localStorage.getItem(ACCESS_TOKEN_KEY);
  const refresh = localStorage.getItem(REFRESH_TOKEN_KEY);
  sessionStorage.setItem(
    SNAPSHOT_KEY,
    JSON.stringify({ accessToken: access ?? "", refreshToken: refresh ?? "" })
  );
  setTokens(accessToken, refreshToken);
  localStorage.setItem(IMPERSONATING_KEY, "1");
}

export function endImpersonationSession(): boolean {
  const raw = sessionStorage.getItem(SNAPSHOT_KEY);
  localStorage.removeItem(IMPERSONATING_KEY);
  sessionStorage.removeItem(SNAPSHOT_KEY);
  if (!raw) return false;
  try {
    const snapshot = JSON.parse(raw) as {
      accessToken: string;
      refreshToken: string;
    };
    if (!snapshot.accessToken || !snapshot.refreshToken) return false;
    setTokens(snapshot.accessToken, snapshot.refreshToken);
    return true;
  } catch {
    return false;
  }
}
