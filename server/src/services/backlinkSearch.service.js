const TAVILY_URL = "https://api.tavily.com/search";
const MAX_QUERIES_TO_SEARCH = 4;
const MAX_RESULTS_PER_QUERY = 5;
const MAX_TOTAL_RESULTS = 12;

function searchError(message) {
  const err = new Error(message);
  err.type = "search_error";
  return err;
}

function hostnameOf(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

async function tavilySearch(query, excludeDomains) {
  const res = await fetch(TAVILY_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.TAVILY_API_KEY}`
    },
    body: JSON.stringify({
      query,
      max_results: MAX_RESULTS_PER_QUERY,
      exclude_domains: excludeDomains
    })
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw searchError(`Tavily returned ${res.status}: ${body.slice(0, 200)}`);
  }

  const data = await res.json();
  return (data.results || []).map((r) => ({ title: r.title, url: r.url, snippet: r.content }));
}

// Runs a handful of the given queries through Tavily, merges + dedupes the results by URL,
// and excludes the client's own site so it never recommends linking to itself.
export async function findBacklinkOpportunities(queries, websiteUrl) {
  if (!process.env.TAVILY_API_KEY) {
    throw searchError("TAVILY_API_KEY is not configured on the server.");
  }

  const excludeDomains = [];
  const ownHost = hostnameOf(websiteUrl);
  if (ownHost) excludeDomains.push(ownHost);

  const queriesToRun = (queries || []).slice(0, MAX_QUERIES_TO_SEARCH);
  const resultSets = await Promise.all(
    queriesToRun.map((q) => tavilySearch(q, excludeDomains).catch(() => []))
  );

  const seen = new Set();
  const merged = [];
  for (const results of resultSets) {
    for (const r of results) {
      if (!r.url || seen.has(r.url)) continue;
      seen.add(r.url);
      merged.push(r);
      if (merged.length >= MAX_TOTAL_RESULTS) break;
    }
    if (merged.length >= MAX_TOTAL_RESULTS) break;
  }
  return merged;
}
