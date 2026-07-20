/**
 * @fileoverview API latency smoke for login + practice (@smoke @perf).
 *
 * Soft ceiling only — not a full load test (k6 remains out of MVP).
 */

import { SEED_USERS } from '@lab/shared';
import { expect, test } from '../fixtures';

const BUDGET_MS = 800;

test('login and practice respond under budget @smoke @perf', async ({
  api,
  asMember,
}) => {
  const loginStart = Date.now();
  const login = await api.login(
    SEED_USERS.member.email,
    SEED_USERS.member.password,
  );
  expect(login.status).toBe(200);
  expect(Date.now() - loginStart).toBeLessThan(BUDGET_MS);

  const decks = await asMember.decks();
  expect(decks.status).toBe(200);
  const deckList = decks.data as Array<{ id: number }>;
  const deck = deckList[0];
  expect(deck).toBeTruthy();

  const cards = await asMember.cards(deck!.id);
  expect(cards.status).toBe(200);
  const cardList = cards.data as Array<{ id: number; kind?: string }>;
  const open = cardList.find((c) => c.kind === 'open') ?? cardList[0];
  expect(open).toBeTruthy();

  const practiceStart = Date.now();
  const practice = await asMember.practice(open!.id, 'learning');
  expect(practice.status).toBe(200);
  expect(Date.now() - practiceStart).toBeLessThan(BUDGET_MS);
});
