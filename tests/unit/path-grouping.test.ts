/**
 * @fileoverview Home path grouping order (003-learning-path).
 */

import { describe, expect, it } from 'vitest';
import type { Deck } from '@lab/shared';
import {
  groupDecksByPath,
  pickContinueLearningDeck,
  deckPrimaryCta,
  filterDecksByTab,
} from '../../apps/web/src/lib/path-grouping.ts';

function deck(
  partial: Partial<Deck> & Pick<Deck, 'id' | 'name' | 'stage'>,
): Deck {
  return {
    description: '',
    ownerUserId: 1,
    recommendedStart: false,
    cardCount: 10,
    completedCount: 0,
    masteryPercent: 0,
    ...partial,
  };
}

describe('groupDecksByPath', () => {
  it('orders Beginner → Intermediate → Expert then Your decks; Start here first', () => {
    const decks = [
      deck({ id: 3, name: 'Expert A', stage: 'expert' }),
      deck({ id: 2, name: 'Beginner B', stage: 'beginner' }),
      deck({
        id: 1,
        name: 'Beginner A',
        stage: 'beginner',
        recommendedStart: true,
      }),
      deck({ id: 4, name: 'Mid', stage: 'intermediate' }),
      deck({ id: 5, name: 'Custom', stage: null }),
    ];

    const sections = groupDecksByPath(decks);
    expect(sections.map((s) => s.key)).toEqual([
      'beginner',
      'intermediate',
      'expert',
      'yours',
    ]);
    expect(sections[0]!.decks.map((d) => d.name)).toEqual([
      'Beginner A',
      'Beginner B',
    ]);
    expect(sections[3]!.decks[0]!.name).toBe('Custom');
  });
});

describe('pickContinueLearningDeck', () => {
  it('prefers recommendedStart until mastery 100', () => {
    const decks = [
      deck({
        id: 1,
        name: 'Start',
        stage: 'beginner',
        recommendedStart: true,
        masteryPercent: 13,
        completedCount: 2,
      }),
      deck({
        id: 2,
        name: 'Mid',
        stage: 'intermediate',
        masteryPercent: 50,
        completedCount: 5,
      }),
    ];
    expect(pickContinueLearningDeck(decks)?.name).toBe('Start');
  });

  it('moves to next incomplete stage after start deck is complete', () => {
    const decks = [
      deck({
        id: 1,
        name: 'Start',
        stage: 'beginner',
        recommendedStart: true,
        masteryPercent: 100,
        completedCount: 10,
      }),
      deck({
        id: 2,
        name: 'Mid',
        stage: 'intermediate',
        masteryPercent: 0,
        completedCount: 0,
      }),
      deck({
        id: 3,
        name: 'Hard',
        stage: 'expert',
        masteryPercent: 0,
        completedCount: 0,
      }),
    ];
    expect(pickContinueLearningDeck(decks)?.name).toBe('Mid');
  });

  it('returns null when all path decks are complete', () => {
    const decks = [
      deck({
        id: 1,
        name: 'Start',
        stage: 'beginner',
        recommendedStart: true,
        masteryPercent: 100,
        completedCount: 10,
      }),
      deck({
        id: 2,
        name: 'Mid',
        stage: 'intermediate',
        masteryPercent: 100,
        completedCount: 10,
      }),
      deck({ id: 3, name: 'Custom', stage: null, masteryPercent: 0 }),
    ];
    expect(pickContinueLearningDeck(decks)).toBeNull();
  });
});

describe('deckPrimaryCta', () => {
  it('labels by progress state', () => {
    expect(
      deckPrimaryCta(deck({ id: 1, name: 'A', stage: 'beginner', completedCount: 0 }))
        .label,
    ).toBe('Start Deck');
    expect(
      deckPrimaryCta(
        deck({
          id: 1,
          name: 'A',
          stage: 'beginner',
          completedCount: 2,
          masteryPercent: 13,
        }),
      ).label,
    ).toBe('Resume Practice');
    expect(
      deckPrimaryCta(
        deck({
          id: 1,
          name: 'A',
          stage: 'beginner',
          completedCount: 10,
          masteryPercent: 100,
        }),
      ).label,
    ).toBe('Practice Again');
  });
});

describe('filterDecksByTab', () => {
  const decks = [
    deck({ id: 1, name: 'B', stage: 'beginner' }),
    deck({ id: 2, name: 'I', stage: 'intermediate' }),
    deck({ id: 3, name: 'E', stage: 'expert' }),
    deck({ id: 4, name: 'Mine', stage: null }),
  ];

  it('filters path and custom decks', () => {
    expect(filterDecksByTab(decks, 'all').map((d) => d.name)).toEqual([
      'B',
      'I',
      'E',
    ]);
    expect(filterDecksByTab(decks, 'beginner').map((d) => d.name)).toEqual([
      'B',
    ]);
    expect(filterDecksByTab(decks, 'yours').map((d) => d.name)).toEqual([
      'Mine',
    ]);
  });
});
