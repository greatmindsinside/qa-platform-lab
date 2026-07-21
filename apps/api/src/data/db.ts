/**
 * @fileoverview SQLite connection + schema bootstrap.
 *
 * **What:** Opens file or in-memory DB and applies the Quest Deck DDL (+ MCQ cols).
 * **Why:** Persistence boundary only — no business rules (SRP). Tests inject
 * `:memory:` via `openMemoryDb` (DIP).
 */

import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';

export type LabDb = Database.Database;

const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'member')),
  display_name TEXT NOT NULL,
  total_xp INTEGER NOT NULL DEFAULT 0,
  current_streak INTEGER NOT NULL DEFAULT 0,
  last_practice_date TEXT
);

CREATE TABLE IF NOT EXISTS decks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  owner_user_id INTEGER NOT NULL REFERENCES users(id),
  stage TEXT CHECK (stage IS NULL OR stage IN ('beginner', 'intermediate', 'expert')),
  recommended_start INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS deck_members (
  deck_id INTEGER NOT NULL REFERENCES decks(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'member')),
  PRIMARY KEY (deck_id, user_id)
);

CREATE TABLE IF NOT EXISTS cards (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  deck_id INTEGER NOT NULL REFERENCES decks(id) ON DELETE CASCADE,
  kind TEXT NOT NULL DEFAULT 'open' CHECK (kind IN ('open', 'mcq')),
  prompt TEXT NOT NULL,
  answer_hint TEXT NOT NULL DEFAULT '',
  tags_json TEXT NOT NULL DEFAULT '[]',
  options_json TEXT,
  correct_index INTEGER
);

CREATE TABLE IF NOT EXISTS card_progress (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  card_id INTEGER NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  confidence TEXT NOT NULL CHECK (confidence IN ('learning', 'solid', 'mastered')),
  practice_count INTEGER NOT NULL DEFAULT 0,
  last_practiced_at TEXT,
  PRIMARY KEY (user_id, card_id)
);

CREATE TABLE IF NOT EXISTS practice_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  card_id INTEGER NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  confidence TEXT,
  xp_awarded INTEGER NOT NULL,
  practiced_at TEXT NOT NULL,
  selected_index INTEGER,
  was_correct INTEGER
);

CREATE TABLE IF NOT EXISTS adventures (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  blurb TEXT NOT NULL,
  start_scene_id INTEGER,
  learning_themes_json TEXT NOT NULL DEFAULT '[]'
);

CREATE TABLE IF NOT EXISTS scenes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  adventure_id INTEGER NOT NULL REFERENCES adventures(id) ON DELETE CASCADE,
  scene_key TEXT NOT NULL,
  body TEXT NOT NULL,
  is_ending INTEGER NOT NULL DEFAULT 0,
  ending_tone TEXT CHECK (ending_tone IS NULL OR ending_tone IN ('strong', 'weak')),
  UNIQUE (adventure_id, scene_key)
);

CREATE TABLE IF NOT EXISTS choices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  scene_id INTEGER NOT NULL REFERENCES scenes(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  next_scene_id INTEGER NOT NULL REFERENCES scenes(id),
  lesson_tags_json TEXT NOT NULL DEFAULT '[]',
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS adventure_progress (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  adventure_id INTEGER NOT NULL REFERENCES adventures(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('in_progress', 'completed')),
  current_scene_id INTEGER NOT NULL REFERENCES scenes(id),
  award_granted INTEGER NOT NULL DEFAULT 0,
  chosen_choice_ids_json TEXT NOT NULL DEFAULT '[]',
  updated_at TEXT NOT NULL,
  PRIMARY KEY (user_id, adventure_id)
);
`;

/** Add MCQ columns to older DBs created before 002; stage cols before 003. */
function migrate(db: LabDb): void {
  const cardCols = new Set(
    (db.prepare(`PRAGMA table_info(cards)`).all() as Array<{ name: string }>).map(
      (c) => c.name,
    ),
  );
  if (!cardCols.has('kind')) {
    db.exec(`ALTER TABLE cards ADD COLUMN kind TEXT NOT NULL DEFAULT 'open'`);
  }
  if (!cardCols.has('options_json')) {
    db.exec(`ALTER TABLE cards ADD COLUMN options_json TEXT`);
  }
  if (!cardCols.has('correct_index')) {
    db.exec(`ALTER TABLE cards ADD COLUMN correct_index INTEGER`);
  }

  const eventCols = new Set(
    (
      db.prepare(`PRAGMA table_info(practice_events)`).all() as Array<{
        name: string;
      }>
    ).map((c) => c.name),
  );
  if (!eventCols.has('selected_index')) {
    db.exec(`ALTER TABLE practice_events ADD COLUMN selected_index INTEGER`);
  }
  if (!eventCols.has('was_correct')) {
    db.exec(`ALTER TABLE practice_events ADD COLUMN was_correct INTEGER`);
  }

  const deckCols = new Set(
    (db.prepare(`PRAGMA table_info(decks)`).all() as Array<{ name: string }>).map(
      (c) => c.name,
    ),
  );
  if (!deckCols.has('stage')) {
    db.exec(`ALTER TABLE decks ADD COLUMN stage TEXT`);
  }
  if (!deckCols.has('recommended_start')) {
    db.exec(
      `ALTER TABLE decks ADD COLUMN recommended_start INTEGER NOT NULL DEFAULT 0`,
    );
  }
}

function prepare(db: LabDb): LabDb {
  db.pragma('foreign_keys = ON');
  db.exec(SCHEMA);
  migrate(db);
  return db;
}

/** Open (or create) a file-backed SQLite database and apply schema. */
export function openDb(dbPath: string): LabDb {
  const dir = path.dirname(dbPath);
  fs.mkdirSync(dir, { recursive: true });
  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  return prepare(db);
}

/** Ephemeral DB for unit/inject tests. */
export function openMemoryDb(): LabDb {
  return prepare(new Database(':memory:'));
}
