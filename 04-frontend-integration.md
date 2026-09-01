# Frontend Integration (React)

## Component structure

```
src/
  components/
    ContentRequestForm.jsx   # website info, keywords, freeform description
    BriefReview.jsx          # shows Stage 1 output, editable, "Generate" button
    DraftPreview.jsx         # shows final post, editable, "Publish" button
  pages/
    NewPost.jsx              # ties the 3 components together as a wizard
  api/
    contentApi.js            # fetch wrappers for backend endpoints
```

## Flow (3-step wizard)

```
Step 1: ContentRequestForm  -->  POST /api/content/brief
Step 2: BriefReview         -->  POST /api/content/generate
Step 3: DraftPreview        -->  POST /api/content/:draftId/publish
```

## `api/contentApi.js`

```js
const BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:4000";

export async function getBrief({ websiteInfo, keywords, rawDescription }) {
  const res = await fetch(`${BASE_URL}/api/content/brief`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ websiteInfo, keywords, rawDescription })
  });
  if (!res.ok) throw new Error("Failed to generate brief");
  return res.json();
}

export async function generateContent({ briefId, brief }) {
  const res = await fetch(`${BASE_URL}/api/content/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ briefId, brief })
  });
  if (!res.ok) throw new Error("Failed to generate content");
  return res.json();
}

export async function publishDraft(draftId) {
  const res = await fetch(`${BASE_URL}/api/content/${draftId}/publish`, {
    method: "POST"
  });
  if (!res.ok) throw new Error("Failed to publish");
  return res.json();
}
```

## `pages/NewPost.jsx` (state machine sketch)

```jsx
import { useState } from "react";
import ContentRequestForm from "../components/ContentRequestForm";
import BriefReview from "../components/BriefReview";
import DraftPreview from "../components/DraftPreview";
import { getBrief, generateContent, publishDraft } from "../api/contentApi";

export default function NewPost() {
  const [step, setStep] = useState("form");   // form | brief | draft
  const [briefData, setBriefData] = useState(null);
  const [draftData, setDraftData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleFormSubmit(formInput) {
    setLoading(true);
    setError(null);
    try {
      const result = await getBrief(formInput);
      setBriefData(result);
      setStep("brief");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleBriefConfirm(editedBrief) {
    setLoading(true);
    setError(null);
    try {
      const result = await generateContent({
        briefId: briefData.briefId,
        brief: editedBrief
      });
      setDraftData(result);
      setStep("draft");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handlePublish() {
    setLoading(true);
    try {
      await publishDraft(draftData.draftId);
      // navigate to published posts list, show success toast, etc.
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      {error && <div className="error-banner">{error}</div>}
      {step === "form" && <ContentRequestForm onSubmit={handleFormSubmit} loading={loading} />}
      {step === "brief" && (
        <BriefReview brief={briefData.brief} onConfirm={handleBriefConfirm} loading={loading} />
      )}
      {step === "draft" && (
        <DraftPreview draft={draftData} onPublish={handlePublish} loading={loading} />
      )}
    </div>
  );
}
```

## UI notes

- **Loading states matter here** — each API call is a full LLM round trip (a few seconds each), so show a spinner with a stage label ("Understanding your brief...", "Writing your post...", "Polishing the tone...") rather than a generic spinner.
- **`BriefReview` should render every field as an editable input**, not read-only text — this is where the content manager corrects any misunderstanding before the expensive generation step runs.
- **`DraftPreview` should be editable too** (textarea or rich text editor over the markdown) — humanization gets you close, but manual touch-ups will still happen.
- If `content` comes back as markdown, render it with a markdown renderer (e.g. `react-markdown`) in the preview rather than dumping raw markdown text.

## Next steps once this is scaffolded

- Wire up actual publish behavior (push to your CMS or however the live site pulls content).
- Add a "regenerate" button at each step that re-runs just that stage with the same input.
- Add basic analytics (time per stage, how often manager edits the brief vs. accepts as-is) to see where the pipeline needs tuning.
