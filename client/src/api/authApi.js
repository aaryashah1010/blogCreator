const BASE_URL = import.meta.env.VITE_API_URL || "";
const TOKEN_KEY = "contentforge_token";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

async function parseErrorResponse(res, fallbackMessage) {
  const body = await res.json().catch(() => ({}));
  return body.error || fallbackMessage;
}

export async function signup(username, password) {
  const res = await fetch(`${BASE_URL}/api/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password })
  });
  if (!res.ok) throw new Error(await parseErrorResponse(res, "Sign up failed"));
  const { token, user } = await res.json();
  setToken(token);
  return user;
}

export async function login(username, password) {
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password })
  });
  if (!res.ok) throw new Error(await parseErrorResponse(res, "Sign in failed"));
  const { token, user } = await res.json();
  setToken(token);
  return user;
}

export async function me() {
  const token = getToken();
  if (!token) return null;
  const res = await fetch(`${BASE_URL}/api/auth/me`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) {
    clearToken();
    return null;
  }
  const { user } = await res.json();
  return user;
}

export async function logout() {
  const token = getToken();
  clearToken();
  if (!token) return;
  try {
    await fetch(`${BASE_URL}/api/auth/logout`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` }
    });
  } catch {
    // best-effort — token is already cleared locally
  }
}
