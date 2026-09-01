import "dotenv/config";
import app from "./app.js";
import { applySchema } from "./repositories/db.js";

const PORT = process.env.PORT || 4000;

async function start() {
  await applySchema();
  console.log("Database schema ready.");

  app.listen(PORT, () => {
    console.log(`Content generator API listening on port ${PORT}`);
  });
}

start().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
