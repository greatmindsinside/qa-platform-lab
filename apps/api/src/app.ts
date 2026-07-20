/**
 * @fileoverview Composition root for the Quest Deck API.
 *
 * **What:** Wires DB → stores → services → Fastify routes (and optional seed).
 * **Why:** DIP — tests inject memory DB / skip seed; production passes file path.
 * No business rules live here.
 */

import Fastify, { type FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import { openDb, openMemoryDb, type LabDb } from './data/db.js';
import { UserStore } from './data/user-store.js';
import { DeckStore } from './data/deck-store.js';
import { ProgressStore } from './data/progress-store.js';
import { AuthService } from './application/auth-service.js';
import { DeckService } from './application/deck-service.js';
import { PracticeService } from './application/practice-service.js';
import { registerErrorHandler } from './http/auth-guard.js';
import { registerRoutes } from './http/routes.js';
import { seedDatabase } from './seed.js';

export type BuildAppOptions = {
  db?: LabDb;
  dbPath?: string;
  seed?: boolean;
};

/** Build a fully wired Fastify app + underlying DB handle. */
export async function buildApp(options: BuildAppOptions = {}): Promise<{
  app: FastifyInstance;
  db: LabDb;
}> {
  const db: LabDb =
    options.db ??
    (options.dbPath ? openDb(options.dbPath) : openMemoryDb());

  if (options.seed !== false) {
    await seedDatabase(db);
  }

  const users = new UserStore(db);
  const decks = new DeckStore(db);
  const progress = new ProgressStore(db);
  const auth = new AuthService(users);
  const deckService = new DeckService(decks, users, progress);
  const practice = new PracticeService(db, users, decks, progress);

  const app = Fastify({ logger: false });
  await app.register(cors, { origin: true });
  registerErrorHandler(app);
  registerRoutes(app, { auth, decks: deckService, practice });

  return { app, db };
}
