import { getUserForToken } from "../services/auth.service.js";

export async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

    const user = await getUserForToken(token);
    if (!user) {
      const err = new Error("Please sign in again.");
      err.type = "unauthorized";
      return next(err);
    }

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}
