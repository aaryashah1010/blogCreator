function validationError(message) {
  const err = new Error(message);
  err.type = "validation_error";
  return err;
}

export function validateBriefRequest(req, res, next) {
  const { companyName, productName, keywords } = req.body || {};
  if (!companyName || typeof companyName !== "string") {
    return next(validationError("companyName is required"));
  }
  if (!productName || typeof productName !== "string") {
    return next(validationError("productName is required"));
  }
  if (!Array.isArray(keywords) || keywords.length === 0) {
    return next(validationError("keywords must be a non-empty array"));
  }
  next();
}

export function validateGenerateRequest(req, res, next) {
  const { brief } = req.body || {};
  if (!brief || typeof brief !== "object") {
    return next(validationError("brief object is required"));
  }
  next();
}
