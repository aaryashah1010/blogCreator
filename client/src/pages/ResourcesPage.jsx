import { useState } from "react";
import { BACKLINK_CATEGORIES } from "../data/backlinkResources";
import { findSiteBacklinks } from "../api/backlinkApi";

export default function ResourcesPage() {
  const [copiedUrl, setCopiedUrl] = useState(null);
  const [siteUrl, setSiteUrl] = useState("");
  const [siteResults, setSiteResults] = useState(null);
  const [inferred, setInferred] = useState(null);
  const [loadingSite, setLoadingSite] = useState(false);
  const [siteError, setSiteError] = useState(null);

  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }
  }

  async function handleCopy(url) {
    await copyText(url);
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(null), 2000);
  }

  async function handleFindSiteBacklinks(e) {
    e.preventDefault();
    if (!siteUrl.trim()) return;
    setLoadingSite(true);
    setSiteError(null);
    setSiteResults(null);
    setInferred(null);
    try {
      const { results, inferred: inferredInfo } = await findSiteBacklinks(siteUrl.trim());
      setSiteResults(results);
      setInferred(inferredInfo);
    } catch (err) {
      setSiteError(err.message);
    } finally {
      setLoadingSite(false);
    }
  }

  return (
    <div className="card resources-page">
      <h2>Find opportunities for your site</h2>
      <p className="hint">
        Paste any website URL — doesn't need to be something generated in this app. We'll read the page, figure out
        what the business/product is, and run a real live search for backlink opportunities specific to it.
      </p>

      <form className="site-search-form" onSubmit={handleFindSiteBacklinks}>
        <input
          type="text"
          value={siteUrl}
          onChange={(e) => setSiteUrl(e.target.value)}
          placeholder="https://example.com/product-page"
        />
        <button type="submit" disabled={loadingSite}>
          {loadingSite ? "Analyzing..." : "Find opportunities"}
        </button>
      </form>

      {siteError && <div className="error-banner">{siteError}</div>}

      {inferred && (
        <div className="assumptions">
          <strong>What we understood about this page:</strong> {inferred.productName} from {inferred.companyName}
          {inferred.targetLocations?.length > 0 ? `, serving ${inferred.targetLocations.join(", ")}` : ""}. If that's
          off, the results below may be too — worth double-checking.
        </div>
      )}

      {siteResults && siteResults.length === 0 && (
        <p className="hint">No results came back — try a different page, or check the curated list below.</p>
      )}

      {siteResults && siteResults.length > 0 && (
        <ul className="resource-list">
          {siteResults.map((r) => (
            <li key={r.url}>
              <div className="resource-info">
                <a href={r.url} target="_blank" rel="noreferrer" className="resource-name">
                  {r.title || r.url}
                </a>
                {r.snippet && <p>{r.snippet}</p>}
              </div>
              <button type="button" className="link-button" onClick={() => handleCopy(r.url)}>
                {copiedUrl === r.url ? "Copied!" : "Copy link"}
              </button>
            </li>
          ))}
        </ul>
      )}

      <h2 className="resources-static-heading">Free backlink resources</h2>
      <p className="hint">
        A short, manually-verified list — not AI-generated. Quality over quantity: a handful of legitimate listings
        builds real trust signals; a long list of spammy directories can look like a link scheme to Google and hurt
        more than it helps.
      </p>

      {BACKLINK_CATEGORIES.map((group) => (
        <section key={group.category} className="resource-group">
          <h3>{group.category}</h3>
          {group.note && <p className="hint">{group.note}</p>}
          <ul className="resource-list">
            {group.resources.map((r) => (
              <li key={r.url}>
                <div className="resource-info">
                  <a href={r.url} target="_blank" rel="noreferrer" className="resource-name">
                    {r.name}
                  </a>
                  <p>{r.description}</p>
                </div>
                <button type="button" className="link-button" onClick={() => handleCopy(r.url)}>
                  {copiedUrl === r.url ? "Copied!" : "Copy link"}
                </button>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
