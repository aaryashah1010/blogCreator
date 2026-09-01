import { pool } from "./db.js";

const SESSION_TTL_DAYS = 30;

export async function createSession(userId) {
  const result = await pool.query(
    `INSERT INTO sessions (user_id, expires_at)
     VALUES ($1, now() + interval '${SESSION_TTL_DAYS} days')
     RETURNING token`,
    [userId]
  );
  return result.rows[0].token;
}

export async function findUserIdForValidToken(token) {
  const result = await pool.query(
    `SELECT user_id FROM sessions WHERE token = $1 AND expires_at > now()`,
    [token]
  );
  return result.rows[0]?.user_id || null;
}

export async function deleteSession(token) {
  await pool.query(`DELETE FROM sessions WHERE token = $1`, [token]);
}
