import { pool } from "./db.js";

function mapRow(row) {
  return {
    draftId: row.id,
    userId: row.user_id,
    briefId: row.brief_id,
    brief: row.brief,
    rawDraft: row.raw_draft,
    humanizedDraft: row.humanized_draft,
    title: row.title,
    metaDescription: row.meta_description,
    status: row.status,
    createdAt: row.created_at,
    publishedAt: row.published_at
  };
}

export async function createDraft({ userId, briefId, brief, rawDraft, humanizedDraft, title, metaDescription }) {
  const result = await pool.query(
    `INSERT INTO drafts (user_id, brief_id, brief, raw_draft, humanized_draft, title, meta_description)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [userId, briefId, brief, rawDraft, humanizedDraft, title, metaDescription]
  );
  return mapRow(result.rows[0]);
}

export async function getDraftForUser(draftId, userId) {
  const result = await pool.query(`SELECT * FROM drafts WHERE id = $1 AND user_id = $2`, [draftId, userId]);
  return result.rows[0] ? mapRow(result.rows[0]) : null;
}

export async function listDraftsForUser(userId) {
  const result = await pool.query(
    `SELECT * FROM drafts WHERE user_id = $1 ORDER BY created_at DESC`,
    [userId]
  );
  return result.rows.map(mapRow);
}

export async function updateDraftStatusForUser(draftId, userId, status) {
  const result = await pool.query(
    `UPDATE drafts
     SET status = $3, published_at = CASE WHEN $3 = 'published' THEN now() ELSE published_at END
     WHERE id = $1 AND user_id = $2
     RETURNING *`,
    [draftId, userId, status]
  );
  return result.rows[0] ? mapRow(result.rows[0]) : null;
}
