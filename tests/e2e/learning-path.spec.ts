/**
 * @fileoverview E2E learning path on Decks page (@smoke @progression).
 */

import { CURRICULUM_DECKS, SEED_USERS } from '@lab/shared';
import { expect, test } from '../fixtures';

test('learning path shows stages and Start here @smoke @progression', async ({
  page,
}) => {
  await page.goto('/login');
  await page.getByLabel('Email').fill(SEED_USERS.member.email);
  await page.getByLabel('Password').fill(SEED_USERS.member.password);
  await page.getByRole('button', { name: 'Sign in' }).click();

  await page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Decks' }).click();
  await expect(page.getByRole('heading', { name: 'Beginner' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Intermediate' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Expert' })).toBeVisible();
  await expect(page.locator('.start-here-badge')).toHaveCount(1);

  await page
    .getByRole('listitem')
    .filter({ hasText: CURRICULUM_DECKS.strategy })
    .getByRole('link', { name: 'Practice' })
    .click();
  await expect(page.getByText(/Card 1 of/)).toBeVisible();
  await expect(page.getByRole('link', { name: '← End session' })).toBeVisible();
});
