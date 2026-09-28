import { Router } from "express";
import { fetchPageSummary } from "../services/siteAnalysis.service.js";
import { inferBriefFromSite, generateBacklinkQueries } from "../services/pipeline.service.js";
import { findBacklinkOpportunities } from "../services/backlinkSearch.service.js";

const router = Router();

function validationError(message) {
  const err = new Error(message);
  err.type = "validation_error";
  return err;
}

// Given any URL (not necessarily a post generated in this app), infer what the site/business
// is about from its actual content, then find real backlink opportunities for it.
router.post("/find", async (req, res, next) => {
  try {
    const { url } = req.body || {};
    if (!url || typeof url !== "string") return next(validationError("A website URL is required."));

    const page = await fetchPageSummary(url);
    const inferred = await inferBriefFromSite(page);
    const queries = await generateBacklinkQueries(inferred);
    const results = await findBacklinkOpportunities(queries, url);

    res.json({ inferred, results });
  } catch (err) {
    next(err);
  }
});

export default router;
