/**
 * @fileoverview Leaderboard + profile + support API smoke.
 */

import { SEED_USERS } from '@lab/shared';
import { expect, test } from '../fixtures';

test('leaderboard ranks users and profile updates @smoke @auth', async ({
  asMember,
  asAdmin,
}) => {
  const board = await asMember.leaderboard();
  expect(board.status).toBe(200);
  const rows = board.data as Array<{ displayName: string; totalXp: number }>;
  expect(rows.length).toBeGreaterThanOrEqual(2);
  expect(rows[0]!.totalXp).toBeGreaterThanOrEqual(rows[1]!.totalXp);

  const patched = await asMember.updateProfile('Member Board');
  expect(patched.status).toBe(200);
  expect((patched.data as { displayName: string }).displayName).toBe(
    'Member Board',
  );

  const ticket = await asAdmin.submitSupport(
    'API check',
    'Support endpoint accepts demo tickets.',
  );
  expect(ticket.status).toBe(200);
  expect((ticket.data as { ok: boolean }).ok).toBe(true);

  // Restore seed display name for later UI tests.
  await asMember.updateProfile(SEED_USERS.member.displayName);
});
