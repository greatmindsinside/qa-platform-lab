/**
 * @fileoverview Home learning-path grouping helpers.
 *
 * **What:** Order decks Beginner → Intermediate → Expert, then unstaged.
 * **Why:** Soft curriculum guidance without a Path entity (003).
 */

import type { Deck, LearningStage } from '@lab/shared';

export const STAGE_ORDER: LearningStage[] = [
  'beginner',
  'intermediate',
  'expert',
];

export const STAGE_LABELS: Record<LearningStage, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  expert: 'Expert',
};

export type PathSection = {
  key: LearningStage | 'yours';
  title: string;
  decks: Deck[];
};

/** Sort recommended Start here deck first within a stage. */
export function sortStageDecks(decks: Deck[]): Deck[] {
  return [...decks].sort((a, b) => {
    if (a.recommendedStart === b.recommendedStart) return a.id - b.id;
    return a.recommendedStart ? -1 : 1;
  });
}

/** Group decks into curriculum sections + Your decks (stage null). */
export function groupDecksByPath(decks: Deck[]): PathSection[] {
  const sections: PathSection[] = STAGE_ORDER.map((stage) => ({
    key: stage,
    title: STAGE_LABELS[stage],
    decks: sortStageDecks(decks.filter((d) => d.stage === stage)),
  }));

  const yours = decks.filter((d) => d.stage == null);
  sections.push({
    key: 'yours',
    title: 'Your decks',
    decks: [...yours].sort((a, b) => a.id - b.id),
  });

  return sections.filter((s) => s.decks.length > 0 || s.key === 'yours');
}
