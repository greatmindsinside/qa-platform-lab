/**
 * @fileoverview Process entry: listen on PORT with file DB + seed.
 *
 * **What:** Starts the Fastify server for local/dev/CI webServer.
 * **Why:** Separates listen/lifecycle from `buildApp` so inject tests never bind ports.
 */

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildApp } from './app.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const defaultDb = path.join(__dirname, '..', 'data', 'quest-deck.db');
const dbPath = process.env.DB_PATH ?? defaultDb;
const port = Number(process.env.PORT ?? 3333);
const host = process.env.HOST ?? '127.0.0.1';

const { app } = await buildApp({ dbPath, seed: true });
await app.listen({ port, host });
console.log(`API listening on http://${host}:${port}`);
