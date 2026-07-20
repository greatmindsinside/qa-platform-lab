/**
 * @fileoverview Home path grouping order (003-learning-path).
 */

import { describe, expect, it } from 'vitest';
import type { Deck } from '@lab/shared';
import { groupDecksByPath } from '../../apps/web/src/lib/path-grouping.ts';

function deck(
  partial: Partial<Deck> & Pick<Deck, 'id' | 'name' | 'stage'>,
): Deck {
  return {
    description: '',
    ownerUserId: 1,
    recommendedStart: false,
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
