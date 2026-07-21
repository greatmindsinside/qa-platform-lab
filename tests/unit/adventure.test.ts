/**
 * @fileoverview Domain tests for adventure XP + takeaways (005).
 */

import { describe, expect, it } from 'vitest';
import { ADVENTURE_COMPLETION_XP } from '@lab/shared';
import {
  takeawaysFromTags,
  uniqueTags,
  xpForAdventureCompletion,
} from '../../apps/api/src/domain/adventure.ts';

describe('adventure domain', () => {
  it('awards completion XP once then zero on replay', () => {
    expect(xpForAdventureCompletion(false)).toBe(ADVENTURE_COMPLETION_XP);
    expect(xpForAdventureCompletion(true)).toBe(0);
  });

  it('dedupes tags and maps takeaways with fallback', () => {
    expect(uniqueTags(['flake-risk', 'evidence', 'flake-risk'])).toEqual([
      'flake-risk',
      'evidence',
    ]);
    const tipped = takeawaysFromTags(['severity', 'evidence']);
    expect(tipped).toHaveLength(2);
    expect(tipped[0]!.id).toBe('severity');
    expect(tipped[0]!.label.length).toBeGreaterThan(10);

    const empty = takeawaysFromTags([]);
    expect(empty).toHaveLength(1);
    expect(empty[0]!.id).toBe('evidence');
  });
});
