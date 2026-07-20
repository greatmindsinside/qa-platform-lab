/**
 * @fileoverview Playwright fixtures: API clients + UI login helpers.
 *
 * **What:** Extends Playwright test with `api`, `asAdmin`, `asMember`, `loginAs`.
 * **Why:** DRY auth bootstrap across API/E2E/cross-layer specs.
 */

import { test as base, expect } from '@playwright/test';
import { SEED_USERS } from '@lab/shared';
import { ApiClient } from '@lab/testkit';
import { loginAs as uiLoginAs, type SeedRole } from './helpers/auth';

const API = process.env.API_URL ?? 'http://127.0.0.1:3334';

type Fixtures = {
  api: ApiClient;
  asAdmin: ApiClient;
  asMember: ApiClient;
  /** UI helper: `await loginAs('member')` on the current page. */
  loginAs: (role: SeedRole) => Promise<void>;
};

export const test = base.extend<Fixtures>({
  // Playwright requires empty-object destructuring for unused fixtures.
  // eslint-disable-next-line no-empty-pattern
  api: async ({}, use) => {
    await use(new ApiClient({ baseUrl: API }));
  },
  asAdmin: async ({ api }, use) => {
    const res = await api.login(SEED_USERS.admin.email, SEED_USERS.admin.password);
    expect(res.status).toBe(200);
    await use(api.withToken(res.data.token));
  },
  asMember: async ({ api }, use) => {
    const res = await api.login(
      SEED_USERS.member.email,
      SEED_USERS.member.password,
    );
    expect(res.status).toBe(200);
    await use(api.withToken(res.data.token));
  },
  loginAs: async ({ page }, use) => {
    await use(async (role) => {
      await uiLoginAs(page, role);
    });
  },
});

export { expect };
