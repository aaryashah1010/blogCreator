export function errorHandler(err, req, res, next) {
  console.error(err);

  if (err.type === "openai_error") {
    if (err.status === 429 || err.status === 503 || err.code === "ETIMEDOUT") {
      return res.status(503).json({ error: "LLM service busy, please retry", detail: err.message });
    }
    return res.status(502).json({ error: "LLM generation failed", detail: err.message });
  }

  if (err.type === "validation_error") {
    return res.status(400).json({ error: "Invalid request", detail: err.message });
  }

  if (err.type === "not_found") {
    return res.status(404).json({ error: err.message });
  }

  if (err.type === "unauthorized") {
    return res.status(401).json({ error: err.message });
  }

  if (err.type === "conflict") {
    return res.status(409).json({ error: err.message });
  }

  res.status(500).json({ error: "Internal server error" });
}
