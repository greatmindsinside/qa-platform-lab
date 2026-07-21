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

export type DeckFilterTab = 'all' | LearningStage | 'yours';

function masteryOf(deck: Deck): number {
  return deck.masteryPercent ?? 0;
}

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

/** Curriculum continue target; null when all path decks are at 100% mastery. */
export function pickContinueLearningDeck(decks: Deck[]): Deck | null {
  const start = decks.find((d) => d.recommendedStart);
  if (start && masteryOf(start) < 100) return start;

  for (const stage of STAGE_ORDER) {
    const ordered = sortStageDecks(decks.filter((d) => d.stage === stage));
    const incomplete = ordered.find((d) => masteryOf(d) < 100);
    if (incomplete) return incomplete;
  }
  return null;
}

export function deckPrimaryCta(deck: Deck): {
  label: 'Start Deck' | 'Resume Practice' | 'Practice Again';
  to: string;
} {
  const mastery = masteryOf(deck);
  const to = `/decks/${deck.id}/play`;
  if (mastery >= 100) return { label: 'Practice Again', to };
  if ((deck.completedCount ?? 0) > 0) return { label: 'Resume Practice', to };
  return { label: 'Start Deck', to };
}

/** Path decks for all/stage tabs; custom decks for yours. */
export function filterDecksByTab(decks: Deck[], tab: DeckFilterTab): Deck[] {
  if (tab === 'yours') {
    return [...decks.filter((d) => d.stage == null)].sort((a, b) => a.id - b.id);
  }
  if (tab === 'all') {
    return STAGE_ORDER.flatMap((stage) =>
      sortStageDecks(decks.filter((d) => d.stage === stage)),
    );
  }
  return sortStageDecks(decks.filter((d) => d.stage === tab));
}
