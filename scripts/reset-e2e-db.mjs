/**
 * Deletes the Playwright e2e SQLite DB (and WAL/SHM) so each smoke run starts fresh.
 * Keeps seed idempotent without accumulating XP/streaks/decks across local runs.
 */
import fs from 'node:fs';
import path from 'node:path';

const dbPath =
  process.env.DB_PATH ??
  path.join(process.cwd(), 'apps/api/data/e2e-quest-deck.db');

for (const p of [dbPath, `${dbPath}-wal`, `${dbPath}-shm`]) {
  try {
    fs.rmSync(p, { force: true });
  } catch {
    // ignore missing files
  }
}

console.log(`Reset e2e DB: ${dbPath}`);
