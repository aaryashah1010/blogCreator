import { getToken, clearToken } from "./authApi";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

async function parseErrorResponse(res, fallbackMessage) {
  try {
    const body = await res.json();
    return body.detail || body.error || fallbackMessage;
  } catch {
    return fallbackMessage;
  }
}

async function authedFetch(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      ...(options.headers || {}),
      Authorization: `Bearer ${getToken()}`
    }
  });

  if (res.status === 401) {
    clearToken();
    window.dispatchEvent(new Event("contentforge:unauthorized"));
  }

  return res;
}

export async function getBrief(requestInput) {
  const res = await authedFetch("/api/content/brief", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(requestInput)
  });
  if (!res.ok) throw new Error(await parseErrorResponse(res, "Failed to generate brief"));
  return res.json();
}

export async function generateContent({ briefId, brief }) {
  const res = await authedFetch("/api/content/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ briefId, brief })
  });
  if (!res.ok) throw new Error(await parseErrorResponse(res, "Failed to generate content"));
  return res.json();
}

export async function publishDraft(draftId) {
  const res = await authedFetch(`/api/content/${draftId}/publish`, {
    method: "POST"
  });
  if (!res.ok) throw new Error(await parseErrorResponse(res, "Failed to publish"));
  return res.json();
}

export async function listDrafts() {
  const res = await authedFetch("/api/content");
  if (!res.ok) throw new Error(await parseErrorResponse(res, "Failed to load posts"));
  const { drafts } = await res.json();
  return drafts;
}

export async function getDraft(draftId) {
  const res = await authedFetch(`/api/content/${draftId}`);
  if (!res.ok) throw new Error(await parseErrorResponse(res, "Failed to load post"));
  return res.json();
}
