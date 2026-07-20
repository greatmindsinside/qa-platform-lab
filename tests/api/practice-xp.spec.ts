/**
 * @fileoverview API practice XP + improve-bonus coverage (@smoke @progression).
 */

import { expect, test } from '../fixtures';

test('practice awards XP and improve bonus @smoke @progression', async ({
  asMember,
}) => {
  const decks = await asMember.decks();
  expect(decks.status).toBe(200);
  const deckList = decks.data as Array<{ id: number }>;
  expect(deckList.length).toBeGreaterThanOrEqual(3);

  // Use an open card so confidence practice stays valid on mixed curriculum decks.
  const cards = await asMember.cards(deckList[0]!.id);
  const cardList = cards.data as Array<{ id: number; kind?: string }>;
  const open = cardList.find((c) => c.kind === 'open') ?? cardList[0];
  const cardId = open!.id;

  const first = await asMember.practice(cardId, 'learning');
  expect(first.status).toBe(200);
  expect(first.data).toMatchObject({
    xpAwarded: 10,
    currentStreak: 1,
  });

  const improved = await asMember.practice(cardId, 'solid');
  expect(improved.status).toBe(200);
  expect(improved.data).toMatchObject({
    xpAwarded: 15,
    currentStreak: 1,
  });
});
