"use client";

// Client-side only — this file never runs on the server. The admin "session"
// is just a JWT in localStorage; the actual security boundary is the API
// validating the token on every write (see Brava.Api's [Authorize] gates).
// This is UX gating (redirect to /admin/login when there's no usable token),
// not a security control by itself.
const TOKEN_KEY = "brava_admin_token";
const EXPIRES_KEY = "brava_admin_token_expires_at";

export function saveToken(token: string, expiresAtUtc: string) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(EXPIRES_KEY, expiresAtUtc);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(EXPIRES_KEY);
}

export function getToken(): string | null {
  const token = localStorage.getItem(TOKEN_KEY);
  const expiresAt = localStorage.getItem(EXPIRES_KEY);
  if (!token || !expiresAt) {
    return null;
  }
  if (new Date(expiresAt).getTime() <= Date.now()) {
    clearToken();
    return null;
  }
  return token;
}

export function isLoggedIn(): boolean {
  return getToken() !== null;
}
