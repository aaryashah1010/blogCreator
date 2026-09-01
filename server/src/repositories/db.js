import pg from "pg";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

export const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

export async function applySchema() {
  const schemaPath = join(__dirname, "..", "db", "schema.sql");
  const schema = readFileSync(schemaPath, "utf-8");
  await pool.query(schema);
}
