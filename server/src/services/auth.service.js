import bcrypt from "bcryptjs";
import { createUser, findUserByUsername, findUserById } from "../repositories/users.repository.js";
import { createSession, findUserIdForValidToken, deleteSession } from "../repositories/sessions.repository.js";

const SALT_ROUNDS = 10;

function conflictError(message) {
  const err = new Error(message);
  err.type = "conflict";
  return err;
}

function unauthorizedError(message) {
  const err = new Error(message);
  err.type = "unauthorized";
  return err;
}

export async function signup(username, password) {
  if (!username || username.trim().length < 3) {
    const err = new Error("Username must be at least 3 characters.");
    err.type = "validation_error";
    throw err;
  }
  if (!password || password.length < 6) {
    const err = new Error("Password must be at least 6 characters.");
    err.type = "validation_error";
    throw err;
  }

  const existing = await findUserByUsername(username.trim());
  if (existing) throw conflictError("That username is already taken.");

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await createUser({ username: username.trim(), passwordHash });
  const token = await createSession(user.id);
  return { token, user: { id: user.id, username: user.username } };
}

export async function login(username, password) {
  const user = await findUserByUsername((username || "").trim());
  if (!user) throw unauthorizedError("Incorrect username or password.");

  const valid = await bcrypt.compare(password || "", user.password_hash);
  if (!valid) throw unauthorizedError("Incorrect username or password.");

  const token = await createSession(user.id);
  return { token, user: { id: user.id, username: user.username } };
}

export async function logout(token) {
  await deleteSession(token);
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function getUserForToken(token) {
  if (!token || !UUID_RE.test(token)) return null;
  const userId = await findUserIdForValidToken(token);
  if (!userId) return null;
  return findUserById(userId);
}
