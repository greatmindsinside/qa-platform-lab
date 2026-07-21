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
import { AdventureService } from './application/adventure-service.js';
import { AuthService } from './application/auth-service.js';
import { DeckService } from './application/deck-service.js';
import { PracticeService } from './application/practice-service.js';
import { AdventureStore } from './data/adventure-store.js';
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
  const adventureStore = new AdventureStore(db);
  const auth = new AuthService(users);
  const deckService = new DeckService(decks, users, progress);
  const practice = new PracticeService(db, users, decks, progress);
  const adventures = new AdventureService(db, adventureStore, users);

  const app = Fastify({ logger: false });
  // Explicit methods: @fastify/cors may omit PATCH/DELETE from preflight
  // when deriving from registered routes, which breaks browser profile updates.
  await app.register(cors, {
    origin: true,
    methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE'],
  });
  registerErrorHandler(app);
  registerRoutes(app, { auth, decks: deckService, practice, adventures });

  return { app, db };
}
