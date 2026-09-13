import { useState } from "react";

function parseKeywords(text) {
  return text
    .split(/[\n,]/)
    .map((k) => k.trim())
    .filter(Boolean);
}

export default function ContentRequestForm({ contentType, onSubmit, loading }) {
  const isWebpage = contentType === "webpage";

  const [blogTitle, setBlogTitle] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [productName, setProductName] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [keywordsText, setKeywordsText] = useState("");
  const [primaryKeyword, setPrimaryKeyword] = useState("");
  const [secondaryKeyword, setSecondaryKeyword] = useState("");
  const [rawDescription, setRawDescription] = useState("");
  const [wordCountTarget, setWordCountTarget] = useState(isWebpage ? 200 : 900);
  const [validationError, setValidationError] = useState(null);

  function handleSubmit(e) {
    e.preventDefault();

    const keywords = isWebpage
      ? [primaryKeyword.trim(), secondaryKeyword.trim()].filter(Boolean)
      : parseKeywords(keywordsText);

    if (!companyName.trim() || !productName.trim() || keywords.length === 0) {
      setValidationError(
        isWebpage
          ? "Please fill in company name, product/service name, and the primary keyword."
          : "Please fill in company name, product/service name, and at least one keyword."
      );
      return;
    }

    setValidationError(null);
    onSubmit({
      blogTitle: blogTitle.trim(),
      companyName: companyName.trim(),
      productName: productName.trim(),
      websiteUrl: websiteUrl.trim(),
      keywords,
      rawDescription: rawDescription.trim(),
      wordCountTarget: Math.max(200, Number(wordCountTarget) || (isWebpage ? 200 : 900)),
      contentType: isWebpage ? "webpage" : "blog"
    });
  }

  return (
    <form className="card" onSubmit={handleSubmit}>
      <h2>{isWebpage ? "New webpage content" : "New blog post"}</h2>

      {validationError && <div className="error-banner">{validationError}</div>}

      <label>
        {isWebpage ? "Page headline (optional)" : "Blog title (optional)"}
        <input
          type="text"
          value={blogTitle}
          onChange={(e) => setBlogTitle(e.target.value)}
          placeholder={
            isWebpage
              ? "e.g. Hydraulic Hoses Built for Indian Industrial Operations"
              : "e.g. Hydraulic High Pressure Hose Selection Guide for Industrial Applications in India"
          }
        />
      </label>

      <label>
        Company name
        <input
          type="text"
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          placeholder="e.g. Aadarsh Hydropneumatics"
        />
      </label>

      <label>
        Product / service name
        <input
          type="text"
          value={productName}
          onChange={(e) => setProductName(e.target.value)}
          placeholder="e.g. Hydraulic Hose"
        />
      </label>

      <label>
        Website URL (optional)
        <input
          type="text"
          value={websiteUrl}
          onChange={(e) => setWebsiteUrl(e.target.value)}
          placeholder="https://example.com/product-page"
        />
      </label>

      {isWebpage ? (
        <>
          <label>
            Primary keyword
            <input
              type="text"
              value={primaryKeyword}
              onChange={(e) => setPrimaryKeyword(e.target.value)}
              placeholder="e.g. hydraulic hose supplier Ahmedabad"
            />
          </label>
          <label>
            Secondary keyword (optional)
            <input
              type="text"
              value={secondaryKeyword}
              onChange={(e) => setSecondaryKeyword(e.target.value)}
              placeholder="e.g. industrial hydraulic hose India"
            />
          </label>
        </>
      ) : (
        <label>
          Target keywords (one per line, or comma-separated)
          <textarea
            value={keywordsText}
            onChange={(e) => setKeywordsText(e.target.value)}
            placeholder={"hydraulic high pressure hose India\nhydraulic hose supplier India\nhydraulic hose supplier Ahmedabad"}
            rows={5}
          />
        </label>
      )}

      <label>
        Additional notes (optional)
        <textarea
          value={rawDescription}
          onChange={(e) => setRawDescription(e.target.value)}
          placeholder="anything else to focus on — doesn't need to be polished"
          rows={3}
        />
      </label>

      <label>
        Target word count
        <input
          type="number"
          min={200}
          step={50}
          value={wordCountTarget}
          onChange={(e) => setWordCountTarget(e.target.value)}
        />
      </label>
      <p className="hint">The {isWebpage ? "page" : "post"} will be kept within ±50 words of this.</p>

      <button type="submit" disabled={loading}>
        {loading ? "Understanding your brief..." : "Create brief"}
      </button>
    </form>
  );
}
