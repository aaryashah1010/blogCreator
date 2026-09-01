import { useEffect, useState } from "react";
import AppShell from "../components/AppShell";
import ContentRequestForm from "../components/ContentRequestForm";
import BriefReview from "../components/BriefReview";
import DraftPreview from "../components/DraftPreview";
import { getBrief, generateContent, publishDraft, getDraft } from "../api/contentApi";
import { logout } from "../api/authApi";

export default function NewPost({ onLoggedOut, onGoToDashboard, openDraftId }) {
  const [step, setStep] = useState(openDraftId ? null : "form"); // form | brief | draft
  const [briefData, setBriefData] = useState(null);
  const [draftData, setDraftData] = useState(null);
  const [published, setPublished] = useState(false);
  const [loading, setLoading] = useState(!!openDraftId);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!openDraftId) return;
    getDraft(openDraftId)
      .then((result) => {
        setDraftData(result);
        setPublished(result.status === "published");
        setStep("draft");
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [openDraftId]);

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
      setPublished(false);
      setStep("draft");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handlePublish() {
    setLoading(true);
    setError(null);
    try {
      await publishDraft(draftData.draftId);
      setPublished(true);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    await logout();
    onLoggedOut();
  }

  return (
    <AppShell step={step} published={published} onLogout={handleLogout} onGoToDashboard={onGoToDashboard}>
      {error && <div className="error-banner">{error}</div>}

      {loading && !step && <p className="hint">Loading...</p>}

      {step === "form" && <ContentRequestForm onSubmit={handleFormSubmit} loading={loading} />}

      {step === "brief" && (
        <BriefReview brief={briefData.brief} onConfirm={handleBriefConfirm} loading={loading} />
      )}

      {step === "draft" && draftData && (
        <>
          <DraftPreview draft={draftData} onPublish={handlePublish} loading={loading} published={published} />
          <button type="button" className="link-button" onClick={onGoToDashboard}>
            Back to dashboard
          </button>
        </>
      )}
    </AppShell>
  );
}
