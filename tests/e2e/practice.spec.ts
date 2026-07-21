/**
 * @fileoverview E2E deck session via Start here (@smoke @progression).
 */

import { CURRICULUM_DECKS } from '@lab/shared';
import { expect, test } from '../fixtures';

test('practice deck advances with Next @smoke @progression', async ({
  page,
  loginAs,
}) => {
  await loginAs('admin');

  await page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Decks' }).click();
  await page
    .getByRole('listitem')
    .filter({ hasText: CURRICULUM_DECKS.foundations })
    .getByRole('link', { name: /Start Deck|Resume Practice|Practice Again/ })
    .click();
  const progress = page.getByText(/^Card \d+ of 8$/);
  await expect(progress).toBeVisible();
  const startN = Number((await progress.innerText()).match(/Card (\d+)/)?.[1]);

  const showHint = page.getByRole('button', { name: 'Show hint' });
  if (await showHint.isVisible()) {
    await showHint.click();
    await expect(page.locator('.flip-card.is-flipped')).toBeVisible();
    await page.getByRole('button', { name: 'Learning' }).click();
    await expect(page.getByText(/\+\d+ XP/)).toBeVisible();
  } else {
    await page.locator('.mcq-option').first().click();
    await expect(page.getByText(/\+\d+ XP/)).toBeVisible();
  }
  await expect(page.getByText(`Card ${startN} of 8`)).toBeVisible();
  await page.getByRole('button', { name: /Next|Finish/ }).click();
  if (startN < 8) {
    await expect(page.getByText(`Card ${startN + 1} of 8`)).toBeVisible();
    await expect(page.getByText(`Card ${startN + 2} of 8`)).toHaveCount(0);
  }

  await page.getByRole('link', { name: '← Deck' }).click();
  await expect(
    page.getByRole('heading', { name: CURRICULUM_DECKS.foundations }),
  ).toBeVisible();
});

test('resume practice continues after first unpracticed card @smoke @progression', async ({
  page,
  loginAs,
}) => {
  await loginAs('member');

  await page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Decks' }).click();
  const foundations = page
    .getByRole('listitem')
    .filter({ hasText: CURRICULUM_DECKS.foundations });

  const practicedLine = foundations.getByText(/(\d+) \/ 8 practiced/);
  await expect(practicedLine.first()).toBeVisible();
  const practicedText = await practicedLine.first().innerText();
  const practicedCount = Number(practicedText.match(/(\d+)\s*\//)?.[1] ?? '0');

  await foundations
    .getByRole('link', { name: /Start Deck|Resume Practice|Practice Again/ })
    .first()
    .click();

  const progress = page.getByText(/^Card \d+ of 8$/);
  await expect(progress).toBeVisible();
  const startN = Number((await progress.innerText()).match(/Card (\d+)/)?.[1]);

  if (practicedCount >= 8) {
    // Deck fully practiced — resume starts a review from card 1.
    expect(startN).toBe(1);
    return;
  }

  if (practicedCount > 0) {
    expect(startN).toBe(practicedCount + 1);
  } else {
    expect(startN).toBe(1);
  }

  const showHint = page.getByRole('button', { name: 'Show hint' });
  if (await showHint.isVisible()) {
    await showHint.click();
    await page.getByRole('button', { name: 'Learning' }).click();
  } else {
    await page.locator('.mcq-option').first().click();
  }
  await page.getByRole('button', { name: /Next|Finish/ }).click();

  if (await page.getByText('Session complete').isVisible()) {
    return;
  }

  const nextN = startN + 1;
  await expect(page.getByText(`Card ${nextN} of 8`)).toBeVisible();

  await page.getByRole('link', { name: '← Deck' }).click();
  await page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Decks' }).click();
  await foundations
    .getByRole('link', { name: /Resume Practice|Practice Again/ })
    .first()
    .click();
  await expect(page.getByText(`Card ${nextN} of 8`)).toBeVisible();
  await expect(page.getByText(`Card ${startN} of 8`)).toHaveCount(0);
});
