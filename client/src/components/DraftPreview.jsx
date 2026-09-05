import { useState } from "react";
import ReactMarkdown from "react-markdown";

export default function DraftPreview({ draft, onPublish, loading, published }) {
  const [title, setTitle] = useState(draft.title);
  const [metaDescription, setMetaDescription] = useState(draft.metaDescription);
  const [content, setContent] = useState(draft.content);
  const [editingContent, setEditingContent] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copiedSubtitle, setCopiedSubtitle] = useState(null);

  const flags = draft.qualityFlags;
  const hasWarnings = flags && (flags.outsideWordCountTarget || flags.aiTellPhrasesFound?.length > 0);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(content);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = content;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleCopySubtitle(text, index) {
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
    setCopiedSubtitle(index);
    setTimeout(() => setCopiedSubtitle(null), 2000);
  }

  return (
    <div className="card">
      <h2>Preview & publish</h2>
      <p className="hint">{draft.wordCount} words. Edit anything below before publishing.</p>

      {hasWarnings && (
        <div className="error-banner">
          {flags.outsideWordCountTarget && (
            <div>
              Target was {flags.targetWordCount} words — this came in at {flags.actualWordCount} (
              {flags.actualWordCount > flags.targetWordCount ? "+" : "-"}
              {Math.abs(flags.actualWordCount - flags.targetWordCount)}). Consider adjusting before publishing.
            </div>
          )}
          {flags.aiTellPhrasesFound?.length > 0 && (
            <div>Possible leftover AI-sounding phrases to check: {flags.aiTellPhrasesFound.join(", ")}</div>
          )}
        </div>
      )}

      <label>
        Title
        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} />
      </label>

      <label>
        Meta description
        <textarea value={metaDescription} onChange={(e) => setMetaDescription(e.target.value)} rows={2} />
      </label>

      <div className="content-toggle">
        <label>Content</label>
        <div className="content-toggle-actions">
          <button type="button" className="link-button" onClick={handleCopy}>
            {copied ? "Copied!" : "Copy content"}
          </button>
          <button type="button" className="link-button" onClick={() => setEditingContent((v) => !v)}>
            {editingContent ? "Preview" : "Edit markdown"}
          </button>
        </div>
      </div>

      {editingContent ? (
        <textarea
          className="content-editor"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={16}
        />
      ) : (
        <div className="markdown-preview">
          <ReactMarkdown>{content}</ReactMarkdown>
        </div>
      )}

      {draft.subtitles?.length > 0 && (
        <div className="subtitles-section">
          <label>Suggested subtitles</label>
          <p className="hint">Alternate H2-style headline options — for social captions, related posts, or headline testing. Not part of the post body.</p>
          <ul className="subtitles-list">
            {draft.subtitles.map((subtitle, i) => (
              <li key={i}>
                <span className="subtitle-text">{subtitle}</span>
                <button type="button" className="link-button" onClick={() => handleCopySubtitle(subtitle, i)}>
                  {copiedSubtitle === i ? "Copied!" : "Copy"}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {published ? (
        <div className="published-banner">Published</div>
      ) : (
        <button type="button" disabled={loading} onClick={onPublish}>
          {loading ? "Publishing..." : "Publish"}
        </button>
      )}
    </div>
  );
}
