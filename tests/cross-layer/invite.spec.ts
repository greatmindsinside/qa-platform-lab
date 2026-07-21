/**
 * @fileoverview Cross-layer invite: API create + UI visibility (@smoke @mutation).
 */

import { SEED_USERS } from '@lab/shared';
import { expect, test } from '../fixtures';

test('invite then member sees deck @smoke @mutation', async ({
  asAdmin,
  asMember,
  page,
}) => {
  const deckName = `Cross-layer Invite ${Date.now()}`;
  const created = await asAdmin.createDeck(deckName, 'invite me');
  expect(created.status).toBe(201);
  const deckId = (created.data as { id: number }).id;
  const invite = await asAdmin.invite(
    deckId,
    SEED_USERS.member.email,
    'member',
  );
  expect(invite.status).toBe(200);

  const decks = await asMember.decks();
  const names = (decks.data as Array<{ name: string }>).map((d) => d.name);
  expect(names).toContain(deckName);

  await page.goto('/login');
  await page.getByLabel('Email').fill(SEED_USERS.member.email);
  await page.getByLabel('Password').fill(SEED_USERS.member.password);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Decks' }).click();
  await expect(
    page.getByRole('listitem').filter({ hasText: deckName }),
  ).toBeVisible();
});
