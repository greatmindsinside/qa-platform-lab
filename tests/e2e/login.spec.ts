/**
 * @fileoverview E2E login + staged curriculum + bad password (@smoke @auth).
 */

import { CURRICULUM_DECKS, SEED_USERS } from '@lab/shared';
import { expect, test } from '../fixtures';

test('login page @smoke @auth', async ({ page, loginAs }) => {
  await page.goto('/login');
  await expect(page.getByText('Quest Deck')).toBeVisible();

  await page.getByLabel('Email').fill(SEED_USERS.member.email);
  await page.getByLabel('Password').fill('wrong-password');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page.getByText(/Invalid email or password/i)).toBeVisible();

  await loginAs('member');
  await expect(page.getByText(/Streak/)).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Beginner' })).toBeVisible();
  await expect(page.getByText(CURRICULUM_DECKS.foundations)).toBeVisible();
  await expect(page.getByText(CURRICULUM_DECKS.applied)).toBeVisible();
  await expect(page.getByText(CURRICULUM_DECKS.strategy)).toBeVisible();
});
