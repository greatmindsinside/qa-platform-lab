/**
 * @fileoverview Accessibility smoke on login + Home (@smoke @a11y).
 */

import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '../fixtures';

test('login and home have no serious a11y violations @smoke @a11y', async ({
  page,
  loginAs,
}) => {
  await page.goto('/login');
  const loginResults = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa'])
    .analyze();
  expect(
    loginResults.violations.filter((v) =>
      ['serious', 'critical'].includes(v.impact ?? ''),
    ),
  ).toEqual([]);

  await loginAs('member');
  const homeResults = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa'])
    .analyze();
  expect(
    homeResults.violations.filter((v) =>
      ['serious', 'critical'].includes(v.impact ?? ''),
    ),
  ).toEqual([]);
});
