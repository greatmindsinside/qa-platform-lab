/**
 * @fileoverview E2E deck session via Start here (@smoke @progression).
 */

import { CURRICULUM_DECKS } from '@lab/shared';
import { expect, test } from '../fixtures';

test('practice deck auto-advances @smoke @progression', async ({
  page,
  loginAs,
}) => {
  await loginAs('admin');

  await page
    .getByRole('listitem')
    .filter({ hasText: CURRICULUM_DECKS.foundations })
    .getByRole('link', { name: 'Practice' })
    .click();
  await expect(page.getByText('Card 1 of 8')).toBeVisible();
  await expect(page.locator('.practice-guide')).toContainText(
    /Flip the card to reveal the hint/i,
  );

  await page.getByRole('button', { name: 'Show hint' }).click();
  await expect(page.locator('.flip-card.is-flipped')).toBeVisible();
  await page.getByRole('button', { name: 'Learning' }).click();
  await expect(page.locator('.xp-toast-amount')).toHaveText('+10 XP');
  await expect(page.getByText('Card 2 of 8')).toBeVisible({ timeout: 5000 });
  await expect(page.getByText('Card 3 of 8')).toHaveCount(0);
  await page.waitForTimeout(800);
  await expect(page.getByText('Card 2 of 8')).toBeVisible();

  await page.getByRole('link', { name: '← End session' }).click();
  await expect(
    page.getByRole('heading', { name: CURRICULUM_DECKS.foundations }),
  ).toBeVisible();
});
