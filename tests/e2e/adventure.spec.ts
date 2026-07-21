/**
 * @fileoverview E2E adventure smoke (@smoke @progression).
 */

import { ADVENTURE_COMPLETION_XP, SEED_USERS } from '@lab/shared';
import { expect, test } from '../fixtures';

/** Deterministic strong path through Flaky Friday seed. */
const STRONG_PATH = [
  'Open the failing CI run',
  'Investigate waits and signals before calling severity',
  'File a bug with steps, expected/actual, and the run link',
  'Ship after the flake is explained in the ticket',
] as const;

test('adventure completes with takeaways and XP @smoke @progression', async ({
  page,
}) => {
  test.setTimeout(60_000);

  await page.goto('/login');
  await page.getByLabel('Email').fill(SEED_USERS.member.email);
  await page.getByLabel('Password').fill(SEED_USERS.member.password);
  await page.getByRole('button', { name: 'Sign in' }).click();

  await expect(
    page.getByRole('heading', { name: SEED_USERS.member.displayName }),
  ).toBeVisible();
  const xpLine = page.getByText(/Level \d+ · \d+ XP/);
  await expect(xpLine).toBeVisible();
  const before = await xpLine.innerText();
  const beforeXp = Number(before.match(/·\s*(\d+)\s*XP/)?.[1] ?? '0');

  await page
    .getByRole('navigation', { name: 'Main' })
    .getByRole('link', { name: 'Quests' })
    .click();
  await expect(page.getByText('Flaky Friday').first()).toBeVisible();
  await page.getByRole('button', { name: 'Restart' }).click();
  await expect(page.getByRole('group', { name: 'Choices' })).toBeVisible();

  // Mid-run Restart offers Undo (no confirm dialog).
  await page.getByRole('button', { name: STRONG_PATH[0] }).click();
  await page.getByRole('button', { name: 'Restart' }).click();
  await expect(page.getByRole('button', { name: 'Undo' })).toBeVisible();
  await expect(page.getByRole('group', { name: 'Choices' })).toBeVisible();

  for (const label of STRONG_PATH) {
    const choice = page.getByRole('button', { name: label });
    await expect(choice).toBeEnabled();
    await choice.click();
  }

  await expect(
    page.getByRole('heading', { name: 'What you practiced' }),
  ).toBeVisible();
  await expect(page.locator('.adventure-takeaways li').first()).toBeVisible();

  await page.getByRole('link', { name: '← Home' }).click();
  await expect(page.getByText(/Level \d+ · \d+ XP/)).toBeVisible();
  const after = await page.getByText(/Level \d+ · \d+ XP/).innerText();
  const afterXp = Number(after.match(/·\s*(\d+)\s*XP/)?.[1] ?? '0');
  expect(afterXp).toBeGreaterThanOrEqual(beforeXp + ADVENTURE_COMPLETION_XP);
});
