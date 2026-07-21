/**
 * @fileoverview E2E MCQ in mixed curriculum deck (@smoke @progression).
 */

import { CURRICULUM_DECKS, SEED_USERS } from '@lab/shared';
import { expect, test } from '../fixtures';

test('mcq deck session auto-advances @smoke @progression', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Email').fill(SEED_USERS.member.email);
  await page.getByLabel('Password').fill(SEED_USERS.member.password);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(
    page.getByRole('progressbar', { name: 'XP toward next level' }),
  ).toBeVisible();

  await page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Decks' }).click();
  await page
    .getByRole('listitem')
    .filter({ hasText: CURRICULUM_DECKS.foundations })
    .getByRole('link', { name: 'Practice' })
    .click();
  await expect(page.getByText('Card 1 of 8')).toBeVisible();

  // Card 1 is open — flip + rate to reach MCQ card 2
  await page.getByRole('button', { name: 'Show hint' }).click();
  await page.getByRole('button', { name: 'Learning' }).click();
  await expect(page.getByText('Card 2 of 8')).toBeVisible({ timeout: 5000 });

  // Card 2 MCQ — correct answer is B (index 1)
  await page.getByRole('button', { name: /B\s*Critical path that proves/i }).click();
  await expect(page.locator('.xp-toast')).toContainText(/Correct!/);
  await expect(page.locator('.xp-toast-amount')).toHaveText('+15 XP');
  await expect(page.getByText('Card 3 of 8')).toBeVisible({ timeout: 5000 });

  await page.getByRole('link', { name: '← End session' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Home' }).click();
  await expect(page.getByText(/Level \d+ · \d+ XP/)).toBeVisible();
});
