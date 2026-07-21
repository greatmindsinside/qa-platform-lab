/**
 * @fileoverview Pure adventure progression helpers (005-qa-adventure).
 *
 * **What:** Completion XP, lesson tag → takeaway labels, path tag union.
 * **Why:** Framework-free domain so Vitest locks award/takeaway rules without DB.
 */

import {
  ADVENTURE_COMPLETION_XP,
  type LearningTakeaway,
} from '@lab/shared';

/** Plain-language catalog for seeded lesson tags. */
export const LESSON_TAG_CATALOG: Record<string, string> = {
  'flake-risk':
    'Flakes often come from timing and environment assumptions — stabilize waits and signals before blaming the app.',
  severity:
    'Severity describes user impact; priority is business urgency — keep them distinct when you triage.',
  evidence:
    'A useful bug report carries steps, expected vs actual, and evidence (logs, screenshots, IDs).',
  'happy-vs-edge':
    'Happy-path coverage is necessary but not sufficient — edge cases and failure modes catch expensive misses.',
};

/**
 * First completion awards locked XP; replays after awardGranted award 0.
 */
export function xpForAdventureCompletion(awardAlreadyGranted: boolean): number {
  return awardAlreadyGranted ? 0 : ADVENTURE_COMPLETION_XP;
}

/** Unique tags in order of first appearance. */
export function uniqueTags(tags: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const tag of tags) {
    if (!seen.has(tag)) {
      seen.add(tag);
      out.push(tag);
    }
  }
  return out;
}

/**
 * Map path tags to takeaways. If empty, use `fallbackTag` so summaries never blank.
 */
export function takeawaysFromTags(
  tags: string[],
  fallbackTag = 'evidence',
): LearningTakeaway[] {
  const ids = uniqueTags(tags.length > 0 ? tags : [fallbackTag]);
  return ids.map((id) => ({
    id,
    label: LESSON_TAG_CATALOG[id] ?? `You practiced: ${id}.`,
  }));
}
