import { useEffect, useState } from "react";
import { listDrafts } from "../api/contentApi";

function formatDate(iso) {
  return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export default function DashboardPage({ onNewPost, onOpenDraft }) {
  const [drafts, setDrafts] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    listDrafts()
      .then((result) => {
        if (!cancelled) setDrafts(result);
      })
      .catch((e) => {
        if (!cancelled) setError(e.message);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <h1>Your posts</h1>
          <p className="hint">Everything you've generated, saved automatically.</p>
        </div>
        <button type="button" onClick={onNewPost}>
          + New post
        </button>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {drafts && drafts.length === 0 && (
        <div className="dashboard-empty">
          <p>No posts yet.</p>
          <button type="button" onClick={onNewPost}>
            Create your first post
          </button>
        </div>
      )}

      {drafts && drafts.length > 0 && (
        <div className="dashboard-grid">
          {drafts.map((draft) => (
            <button key={draft.draftId} type="button" className="dashboard-card" onClick={() => onOpenDraft(draft.draftId)}>
              <span className={`status-badge status-${draft.status}`}>{draft.status}</span>
              <h3>{draft.title}</h3>
              {draft.primaryKeyword && <p className="dashboard-card-keyword">{draft.primaryKeyword}</p>}
              <p className="dashboard-card-meta">
                {draft.wordCount} words · {formatDate(draft.createdAt)}
              </p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
