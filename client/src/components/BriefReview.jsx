import { useState } from "react";

function toList(value) {
  return Array.isArray(value) ? value.join(", ") : value || "";
}

function fromList(value) {
  return value
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}

export default function BriefReview({ brief, onConfirm, loading }) {
  const [blogTitle, setBlogTitle] = useState(brief.blogTitle || "");
  const [companyName, setCompanyName] = useState(brief.companyName || "");
  const [productName, setProductName] = useState(brief.productName || "");
  const [websiteUrl, setWebsiteUrl] = useState(brief.websiteUrl || "");
  const [topic, setTopic] = useState(brief.topic || "");
  const [audience, setAudience] = useState(brief.audience || "");
  const [tone, setTone] = useState(brief.tone || "");
  const [primaryKeyword, setPrimaryKeyword] = useState(brief.primaryKeyword || "");
  const [secondaryKeywords, setSecondaryKeywords] = useState(toList(brief.secondaryKeywords));
  const [targetLocations, setTargetLocations] = useState(toList(brief.targetLocations));
  const [mustInclude, setMustInclude] = useState(toList(brief.mustInclude));
  const [callToAction, setCallToAction] = useState(brief.callToAction || "");
  const [wordCountTarget, setWordCountTarget] = useState(brief.wordCountTarget || 900);

  function handleSubmit(e) {
    e.preventDefault();
    onConfirm({
      blogTitle,
      companyName,
      productName,
      websiteUrl,
      topic,
      audience,
      tone,
      primaryKeyword,
      secondaryKeywords: fromList(secondaryKeywords),
      targetLocations: fromList(targetLocations),
      mustInclude: fromList(mustInclude),
      callToAction,
      wordCountTarget: Math.min(1000, Math.max(800, Number(wordCountTarget) || 900)),
      assumptions: brief.assumptions || []
    });
  }

  return (
    <form className="card" onSubmit={handleSubmit}>
      <h2>Review the brief</h2>
      <p className="hint">Fix anything that's off before we write the full post — this is the cheapest place to correct a misunderstanding.</p>

      <label>
        Blog title
        <input type="text" value={blogTitle} onChange={(e) => setBlogTitle(e.target.value)} />
      </label>

      <label>
        Company name
        <input type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
      </label>

      <label>
        Product / service name
        <input type="text" value={productName} onChange={(e) => setProductName(e.target.value)} />
      </label>

      <label>
        Website URL
        <input type="text" value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} />
      </label>

      <label>
        Topic
        <input type="text" value={topic} onChange={(e) => setTopic(e.target.value)} />
      </label>

      <label>
        Audience
        <input type="text" value={audience} onChange={(e) => setAudience(e.target.value)} />
      </label>

      <label>
        Tone
        <input type="text" value={tone} onChange={(e) => setTone(e.target.value)} />
      </label>

      <label>
        Primary keyword
        <input type="text" value={primaryKeyword} onChange={(e) => setPrimaryKeyword(e.target.value)} />
      </label>

      <label>
        Secondary keywords (comma-separated)
        <input type="text" value={secondaryKeywords} onChange={(e) => setSecondaryKeywords(e.target.value)} />
      </label>

      <label>
        Target locations (comma-separated)
        <input type="text" value={targetLocations} onChange={(e) => setTargetLocations(e.target.value)} />
      </label>

      <label>
        Must include (comma-separated)
        <input type="text" value={mustInclude} onChange={(e) => setMustInclude(e.target.value)} />
      </label>

      <label>
        Call to action
        <input type="text" value={callToAction} onChange={(e) => setCallToAction(e.target.value)} />
      </label>

      <label>
        Target word count (800-1000)
        <input
          type="number"
          min={800}
          max={1000}
          step={25}
          value={wordCountTarget}
          onChange={(e) => setWordCountTarget(e.target.value)}
        />
      </label>

      {brief.assumptions?.length > 0 && (
        <div className="assumptions">
          <strong>Assumptions made:</strong>
          <ul>
            {brief.assumptions.map((a, i) => (
              <li key={i}>{a}</li>
            ))}
          </ul>
        </div>
      )}

      <button type="submit" disabled={loading}>
        {loading ? "Writing your post..." : "Generate post"}
      </button>
    </form>
  );
}
