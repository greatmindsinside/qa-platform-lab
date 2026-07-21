/**
 * @fileoverview E2E login + simplified home + curriculum via Decks (@smoke @auth).
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
  await expect(
    page.getByRole('heading', { name: SEED_USERS.member.displayName }),
  ).toBeVisible();
  await expect(page.getByText(/Level \d+ · \d+ XP/)).toBeVisible();
  await expect(page.getByRole('link', { name: 'Practice' })).toBeVisible();
  await expect(page.getByText(CURRICULUM_DECKS.foundations)).toBeVisible();

  await page
    .getByRole('navigation', { name: 'Main' })
    .getByRole('link', { name: 'Decks' })
    .click();
  await expect(page.getByRole('heading', { name: 'Decks', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'All Decks' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Beginner' })).toBeVisible();
  await expect(
    page.getByRole('link', { name: CURRICULUM_DECKS.foundations, exact: true }).first(),
  ).toBeVisible();
  await expect(
    page.getByRole('link', { name: CURRICULUM_DECKS.applied, exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('link', { name: CURRICULUM_DECKS.strategy, exact: true }),
  ).toBeVisible();
});
