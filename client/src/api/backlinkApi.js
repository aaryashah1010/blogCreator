import { getToken, clearToken } from "./authApi";

const BASE_URL = import.meta.env.VITE_API_URL || "";

async function parseErrorResponse(res, fallbackMessage) {
  try {
    const body = await res.json();
    return body.detail || body.error || fallbackMessage;
  } catch {
    return fallbackMessage;
  }
}

export async function findSiteBacklinks(url) {
  const res = await fetch(`${BASE_URL}/api/backlinks/find`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`
    },
    body: JSON.stringify({ url })
  });

  if (res.status === 401) {
    clearToken();
    window.dispatchEvent(new Event("contentforge:unauthorized"));
  }

  if (!res.ok) throw new Error(await parseErrorResponse(res, "Failed to find backlink opportunities"));
  return res.json();
}
