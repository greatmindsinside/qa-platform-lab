/**
 * @fileoverview Shell UX smoke: skip link, Decks route, delete confirm (@smoke).
 */

import { CURRICULUM_DECKS } from '@lab/shared';
import { expect, test } from '../fixtures';

test('shell skip link and Decks nav reach catalog @smoke @a11y', async ({
  page,
  loginAs,
}) => {
  await loginAs('member');
  await expect(page.getByRole('link', { name: 'Skip to main content' })).toHaveCount(
    1,
  );
  await expect(page.getByRole('heading', { name: 'Lab Member' })).toBeVisible();

  await page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Decks' }).click();
  await expect(page).toHaveURL(/\/decks$/);
  await expect(page.getByRole('heading', { name: 'Decks', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'All Decks' })).toBeVisible();

  await page
    .getByRole('link', { name: CURRICULUM_DECKS.foundations, exact: true })
    .first()
    .click();
  await expect(
    page.getByRole('heading', { name: CURRICULUM_DECKS.foundations }),
  ).toBeVisible();
  await expect(
    page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Decks' }),
  ).toHaveAttribute('aria-current', 'page');
});

test('delete deck asks for confirmation @smoke @rbac', async ({
  page,
  loginAs,
}) => {
  await loginAs('admin');
  const deckName = `UX Delete ${Date.now()}`;
  await page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Decks' }).click();
  await page.getByRole('button', { name: '+ Create Deck' }).click();
  await page.getByLabel('Deck name').fill(deckName);
  await page.getByRole('button', { name: 'Create deck', exact: true }).click();
  await page.getByRole('button', { name: 'My Decks' }).click();
  await page.getByRole('link', { name: deckName, exact: true }).click();
  await expect(page.getByRole('heading', { name: deckName })).toBeVisible();

  page.once('dialog', async (dialog) => {
    expect(dialog.message()).toMatch(/Delete/i);
    await dialog.dismiss();
  });
  await page.getByRole('button', { name: 'Delete Deck' }).click();
  await expect(page.getByRole('heading', { name: deckName })).toBeVisible();
});
