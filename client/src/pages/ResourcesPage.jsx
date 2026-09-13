import { useState } from "react";
import { BACKLINK_CATEGORIES } from "../data/backlinkResources";

export default function ResourcesPage() {
  const [copiedUrl, setCopiedUrl] = useState(null);

  async function handleCopy(url) {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = url;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(null), 2000);
  }

  return (
    <div className="card resources-page">
      <h2>Free backlink resources</h2>
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
