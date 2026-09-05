import { Router } from "express";
import { normalizeInput, runFullPipeline, detectAiTellPhrases } from "../services/pipeline.service.js";
import { createBrief } from "../repositories/briefs.repository.js";
import { createDraft, getDraftForUser, listDraftsForUser, updateDraftStatusForUser } from "../repositories/drafts.repository.js";
import { validateBriefRequest, validateGenerateRequest } from "../middleware/validateRequest.js";

const router = Router();

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function notFound(message) {
  const err = new Error(message);
  err.type = "not_found";
  return err;
}

function countWords(text) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

const WORD_COUNT_TOLERANCE = 50;

function buildQualityFlags(draft) {
  const wordCount = countWords(draft.humanizedDraft);
  const targetWordCount = draft.brief?.wordCountTarget || null;
  return {
    targetWordCount,
    actualWordCount: wordCount,
    outsideWordCountTarget: targetWordCount != null && Math.abs(wordCount - targetWordCount) > WORD_COUNT_TOLERANCE,
    aiTellPhrasesFound: detectAiTellPhrases(draft.humanizedDraft)
  };
}

function toSummary(draft) {
  return {
    draftId: draft.draftId,
    title: draft.title,
    status: draft.status,
    primaryKeyword: draft.brief?.primaryKeyword || null,
    wordCount: countWords(draft.humanizedDraft),
    createdAt: draft.createdAt,
    publishedAt: draft.publishedAt
  };
}

// List the current user's past posts — powers the dashboard
router.get("/", async (req, res, next) => {
  try {
    const drafts = await listDraftsForUser(req.user.id);
    res.json({ drafts: drafts.map(toSummary) });
  } catch (err) {
    next(err);
  }
});

// Stage 1 only — lets the frontend show the brief for review before generating
router.post("/brief", validateBriefRequest, async (req, res, next) => {
  try {
    const { blogTitle, companyName, productName, websiteUrl, keywords, rawDescription, wordCountTarget } = req.body;
    const brief = await normalizeInput({ blogTitle, companyName, productName, websiteUrl, keywords, rawDescription, wordCountTarget });
    const briefId = await createBrief({ userId: req.user.id, brief });
    res.json({ briefId, brief });
  } catch (err) {
    next(err);
  }
});

// Stage 2 + 3 — runs generation + humanization on the (possibly edited) brief
router.post("/generate", validateGenerateRequest, async (req, res, next) => {
  try {
    const { briefId, brief } = req.body;
    const { rawDraft, final } = await runFullPipeline(brief);

    const draft = await createDraft({
      userId: req.user.id,
      briefId: UUID_RE.test(briefId || "") ? briefId : null,
      brief,
      rawDraft: rawDraft.content,
      humanizedDraft: final.content,
      title: final.title,
      metaDescription: final.metaDescription
    });

    res.json({
      draftId: draft.draftId,
      title: draft.title,
      metaDescription: draft.metaDescription,
      content: draft.humanizedDraft,
      wordCount: countWords(draft.humanizedDraft),
      qualityFlags: buildQualityFlags(draft),
      stages: {
        rawDraft: draft.rawDraft,
        humanizedDraft: draft.humanizedDraft
      }
    });
  } catch (err) {
    next(err);
  }
});

// Mark a draft published
router.post("/:draftId/publish", async (req, res, next) => {
  try {
    if (!UUID_RE.test(req.params.draftId)) return next(notFound("Draft not found"));
    const draft = await updateDraftStatusForUser(req.params.draftId, req.user.id, "published");
    if (!draft) return next(notFound("Draft not found"));
    res.json(draft);
  } catch (err) {
    next(err);
  }
});

// Fetch a stored draft
router.get("/:draftId", async (req, res, next) => {
  try {
    if (!UUID_RE.test(req.params.draftId)) return next(notFound("Draft not found"));
    const draft = await getDraftForUser(req.params.draftId, req.user.id);
    if (!draft) return next(notFound("Draft not found"));
    res.json({
      draftId: draft.draftId,
      title: draft.title,
      metaDescription: draft.metaDescription,
      content: draft.humanizedDraft,
      wordCount: countWords(draft.humanizedDraft),
      status: draft.status,
      qualityFlags: buildQualityFlags(draft),
      stages: {
        rawDraft: draft.rawDraft,
        humanizedDraft: draft.humanizedDraft
      }
    });
  } catch (err) {
    next(err);
  }
});

export default router;
