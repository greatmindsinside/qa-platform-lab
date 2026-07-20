/**
 * @fileoverview Membership RBAC delete (@smoke @rbac).
 */

import { SEED_USERS } from '@lab/shared';
import { expect, test } from '../fixtures';

test('member cannot delete; membership admin can @smoke @rbac', async ({
  asAdmin,
  asMember,
}) => {
  const created = await asAdmin.createDeck(`RBAC Smoke Deck ${Date.now()}`);
  expect(created.status).toBe(201);
  const deckId = (created.data as { id: number }).id;

  const invited = await asAdmin.invite(
    deckId,
    SEED_USERS.member.email,
    'member',
  );
  expect(invited.status).toBe(200);

  const denied = await asMember.deleteDeck(deckId);
  expect(denied.status).toBe(403);

  const promoted = await asAdmin.invite(
    deckId,
    SEED_USERS.member.email,
    'admin',
  );
  expect(promoted.status).toBe(200);

  const allowed = await asMember.deleteDeck(deckId);
  expect(allowed.status).toBe(204);
});
