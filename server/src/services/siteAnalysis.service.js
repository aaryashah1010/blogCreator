const FETCH_TIMEOUT_MS = 10000;
const TEXT_SAMPLE_MAX_CHARS = 3000;

function fetchError(message) {
  const err = new Error(message);
  err.type = "search_error";
  return err;
}

function extractTag(html, regex) {
  const match = html.match(regex);
  return match ? match[1].trim() : "";
}

function stripHtml(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

// Fetches a URL server-side and pulls out just enough signal (title, meta description,
// a text sample) for an LLM to infer what the business/niche is — no new dependency,
// just a plain fetch + light regex extraction, no HTML parser library needed.
export async function fetchPageSummary(url) {
  let parsed;
  try {
    parsed = new URL(url);
    if (!["http:", "https:"].includes(parsed.protocol)) throw new Error("bad protocol");
  } catch {
    throw fetchError("That doesn't look like a valid website URL.");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  let html;
  try {
    const res = await fetch(parsed.toString(), {
      signal: controller.signal,
      headers: { "User-Agent": "Mozilla/5.0 (compatible; ContentForgeBot/1.0)" }
    });
    if (!res.ok) throw fetchError(`Could not read that page (HTTP ${res.status}). It may be blocking automated requests.`);
    html = await res.text();
  } catch (err) {
    if (err.type === "search_error") throw err;
    throw fetchError("Could not reach that URL — check it's correct and publicly accessible.");
  } finally {
    clearTimeout(timeout);
  }

  const title = extractTag(html, /<title[^>]*>([^<]*)<\/title>/i);
  const description = extractTag(
    html,
    /<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i
  );
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  const textSample = stripHtml(bodyMatch ? bodyMatch[1] : html).slice(0, TEXT_SAMPLE_MAX_CHARS);

  if (!title && !description && textSample.length < 50) {
    throw fetchError("Couldn't find any readable content on that page.");
  }

  return { title, description, textSample, url: parsed.toString() };
}
