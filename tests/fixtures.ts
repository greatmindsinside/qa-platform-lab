/**
 * @fileoverview Playwright fixtures: ApiClient + seeded admin/member sessions.
 *
 * **What:** Extends Playwright test with `api`, `asAdmin`, `asMember`.
 * **Why:** DRY auth bootstrap across API/E2E/cross-layer specs.
 */

import { test as base, expect } from '@playwright/test';
import { SEED_USERS } from '@lab/shared';
import { ApiClient } from '@lab/testkit';

const API = process.env.API_URL ?? 'http://127.0.0.1:3334';

type Fixtures = {
  api: ApiClient;
  asAdmin: ApiClient;
  asMember: ApiClient;
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
});

export { expect };
