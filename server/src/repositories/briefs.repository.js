import { pool } from "./db.js";

export async function createBrief({ userId, brief }) {
  const result = await pool.query(
    `INSERT INTO briefs (user_id, brief) VALUES ($1, $2) RETURNING id`,
    [userId, brief]
  );
  return result.rows[0].id;
}
