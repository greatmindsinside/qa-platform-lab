/**
 * @fileoverview Lab pages: leaderboard, settings, support (@smoke).
 */

import { expect, test } from '../fixtures';

test('leaderboard settings and support pages @smoke @progression', async ({
  page,
  loginAs,
}) => {
  await loginAs('member');

  await page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Leaderboard' }).click();
  await expect(page.getByRole('heading', { name: 'Leaderboard' })).toBeVisible();
  await expect(page.getByRole('table')).toBeVisible();
  await expect(page.getByText('You', { exact: true })).toBeVisible();

  await page
    .locator('.shell-sidebar-foot')
    .getByRole('link', { name: 'Settings' })
    .click();
  await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();
  await page.getByLabel('Display name').fill('Member Updated');
  await page.getByRole('button', { name: 'Save profile' }).click();
  await expect(page.getByText('Profile saved.')).toBeVisible();

  await page
    .locator('.shell-sidebar-foot')
    .getByRole('link', { name: 'Support' })
    .click();
  await expect(page.getByRole('heading', { name: 'Support' })).toBeVisible();
  await page.getByLabel('Subject').fill('Practice feedback');
  await page.getByLabel('Message').fill('Thanks for the Quest Deck lab demo.');
  await page.getByRole('button', { name: 'Send message' }).click();
  await expect(page.getByText(/Ticket received/)).toBeVisible();

  // Restore display name for other tests sharing the e2e DB.
  await page
    .locator('.shell-sidebar-foot')
    .getByRole('link', { name: 'Settings' })
    .click();
  await page.getByLabel('Display name').fill('Lab Member');
  await page.getByRole('button', { name: 'Save profile' }).click();
  await expect(page.getByText('Profile saved.')).toBeVisible();
});
