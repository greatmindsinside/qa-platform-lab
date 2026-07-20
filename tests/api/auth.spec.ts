/**
 * @fileoverview auth.spec.ts — layered quality coverage.
 */

import { SEED_USERS } from '@lab/shared';
import { expect, test } from '../fixtures';

test('login @smoke @auth', async ({ api }) => {
  const bad = await api.login(SEED_USERS.admin.email, 'wrong');
  expect(bad.status).toBe(401);

  const ok = await api.login(SEED_USERS.admin.email, SEED_USERS.admin.password);
  expect(ok.status).toBe(200);
  expect(ok.data.token).toBeTruthy();
});
