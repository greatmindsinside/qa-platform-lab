/**
 * @fileoverview E2E MCQ in mixed curriculum deck (@smoke @progression).
 */

import { CURRICULUM_DECKS } from '@lab/shared';
import { expect, test } from '../fixtures';

test('mcq deck session advances with Next @smoke @progression', async ({
  page,
  loginAs,
}) => {
  // Admin avoids member progress left by API smoke tests on the shared e2e DB.
  await loginAs('admin');

  await page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Decks' }).click();
  await page
    .getByRole('listitem')
    .filter({ hasText: CURRICULUM_DECKS.foundations })
    .getByRole('link', { name: /Start Deck|Resume Practice|Practice Again/ })
    .click();
  await expect(page.getByText(/^Card \d+ of 8$/)).toBeVisible();

  const mcqAnswer = page.getByRole('button', {
    name: /Critical path that proves the system boots/i,
  });

  for (let i = 0; i < 8; i++) {
    if (await mcqAnswer.isVisible()) break;
    const showHint = page.getByRole('button', { name: 'Show hint' });
    if (await showHint.isVisible()) {
      await showHint.click();
      await page.getByRole('button', { name: 'Learning' }).click();
      await page.getByRole('button', { name: /Next|Finish/ }).click();
      continue;
    }
    const advance = page.getByRole('button', { name: /Next|Finish/ });
    if (await advance.isVisible()) {
      await advance.click();
      continue;
    }
    await page.locator('.mcq-option').first().click();
    await page.getByRole('button', { name: /Next|Finish/ }).click();
  }

  await expect(mcqAnswer).toBeVisible();
  await mcqAnswer.click();
  await expect(page.getByText(/Correct|Incorrect/)).toBeVisible();
  await expect(page.getByText(/\+\d+ XP/)).toBeVisible();
  await page.getByRole('button', { name: /Next|Finish/ }).click();

  await page.getByRole('link', { name: '← Deck' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Home' }).click();
  await expect(page.getByText(/Level \d+ · \d+ XP/)).toBeVisible();
});
