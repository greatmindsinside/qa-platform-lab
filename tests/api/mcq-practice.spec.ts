/**
 * @fileoverview API MCQ practice XP coverage (@smoke @progression).
 */

import { CURRICULUM_DECKS, SEED_USERS } from '@lab/shared';
import { expect, test } from '../fixtures';

test('mcq wrong answer awards +5 XP @smoke @progression', async ({ api }) => {
  const login = await api.login(SEED_USERS.member.email, SEED_USERS.member.password);
  expect(login.status).toBe(200);
  const asMember = api.withToken(
    (login.data as { token: string }).token,
  );

  const decks = await asMember.decks();
  const list = decks.data as Array<{ id: number; name: string }>;
  const foundations = list.find((d) => d.name === CURRICULUM_DECKS.foundations);
  expect(foundations).toBeTruthy();

  const cards = await asMember.cards(foundations!.id);
  const cardList = cards.data as Array<{ id: number; kind: string }>;
  const mcq = cardList.find((c) => c.kind === 'mcq');
  expect(mcq).toBeTruthy();

  // Foundations first MCQ correctIndex is 1 — pick 0 to force incorrect (+5)
  const result = await asMember.practiceMcq(mcq!.id, 0);
  expect(result.status).toBe(200);
  expect(result.data).toMatchObject({
    correct: false,
    correctIndex: 1,
    xpAwarded: 5,
  });
});
