import { Router } from "express";
import { signup, login, logout } from "../services/auth.service.js";
import { requireAuth } from "../middleware/requireAuth.js";

const router = Router();

router.post("/signup", async (req, res, next) => {
  try {
    const { username, password } = req.body || {};
    const { token, user } = await signup(username, password);
    res.status(201).json({ token, user });
  } catch (err) {
    next(err);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const { username, password } = req.body || {};
    const { token, user } = await login(username, password);
    res.json({ token, user });
  } catch (err) {
    next(err);
  }
});

router.post("/logout", requireAuth, async (req, res, next) => {
  try {
    const token = req.headers.authorization.slice(7);
    await logout(token);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

router.get("/me", requireAuth, (req, res) => {
  res.json({ user: req.user });
});

export default router;
