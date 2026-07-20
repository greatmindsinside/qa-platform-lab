/**
 * @fileoverview Playwright projects (api / e2e / cross-layer) + webServers.
 *
 * Ports 3334/5174 avoid colliding with local Vite on 5173.
 */

import { defineConfig, devices } from '@playwright/test';
import path from 'node:path';

const apiPort = 3334;
const webPort = 5174;
const dbPath = path.join(process.cwd(), 'apps/api/data/e2e-quest-deck.db');

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: `http://127.0.0.1:${webPort}`,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'api',
      testMatch: /tests\/api\/.*\.spec\.ts/,
    },
    {
      name: 'e2e',
      testMatch: /tests\/e2e\/.*\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'cross-layer',
      testMatch: /tests\/cross-layer\/.*\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: [
    {
      command: `node scripts/reset-e2e-db.mjs && yarn workspace @lab/api start:test`,
      url: `http://127.0.0.1:${apiPort}/api/health`,
      reuseExistingServer: false,
      env: {
        ...process.env,
        PORT: String(apiPort),
        DB_PATH: dbPath,
        JWT_SECRET: 'e2e-secret',
      },
      timeout: 120_000,
    },
    {
      command: `yarn workspace @lab/web dev --host 127.0.0.1 --port ${webPort}`,
      url: `http://127.0.0.1:${webPort}`,
      reuseExistingServer: false,
      env: {
        ...process.env,
        VITE_API_URL: `http://127.0.0.1:${apiPort}`,
      },
      timeout: 120_000,
    },
  ],
});
