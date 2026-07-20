/**
 * @fileoverview Pure MCQ grading, XP, and mastery-mapping rules.
 *
 * **What:** gradeMcq / xpForMcq / confidenceAfterMcq (spec 002 locked formulas).
 * **Why:** Keep objective scoring out of HTTP/UI; unit-testable without SQLite.
 */

import type { Confidence } from '@lab/shared';

/** True when the selected option index matches the key. */
export function gradeMcq(selectedIndex: number, correctIndex: number): boolean {
  return selectedIndex === correctIndex;
}

/** Correct → +15; incorrect → +5 (effort credit). No improve-bonus. */
export function xpForMcq(wasCorrect: boolean): number {
  return wasCorrect ? 15 : 5;
}

/**
 * Map MCQ outcome onto CardProgress.confidence for deck mastery %.
 * Incorrect → learning; first/isolated correct → solid; second correct in a row → mastered.
 */
export function confidenceAfterMcq(
  prev: Confidence | null,
  wasCorrect: boolean,
): Confidence {
  if (!wasCorrect) return 'learning';
  if (prev === 'solid' || prev === 'mastered') return 'mastered';
  return 'solid';
}

/** Valid MCQ option index (exactly four options A–D). */
export function isMcqSelectedIndex(value: unknown): value is 0 | 1 | 2 | 3 {
  return (
    typeof value === 'number' &&
    Number.isInteger(value) &&
    value >= 0 &&
    value <= 3
  );
}
