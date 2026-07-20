/**
 * @fileoverview Thin UI login helpers (role locators, not CSS).
 */

import type { Page } from '@playwright/test';
import { SEED_USERS } from '@lab/shared';
import { expect } from '@playwright/test';

export type SeedRole = 'admin' | 'member';

/** Sign in via the login form as a seeded demo user. */
export async function loginAs(page: Page, role: SeedRole): Promise<void> {
  const user = SEED_USERS[role];
  await page.goto('/login');
  await page.getByLabel('Email').fill(user.email);
  await page.getByLabel('Password').fill(user.password);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(
    page.getByRole('progressbar', { name: 'XP toward next level' }),
  ).toBeVisible();
}
