/**
 * @fileoverview MCQ display shuffle mapping.
 */

import { describe, expect, it } from 'vitest';
import {
  displayIndexForOriginal,
  orderMcqOptions,
  shuffleIndices,
  shuffleMcqOptions,
} from '../../apps/web/src/lib/mcq-order.ts';

describe('mcq-order', () => {
  it('shuffleIndices returns a permutation of 0..n-1', () => {
    const order = shuffleIndices(4, () => 0.5);
    expect([...order].sort((a, b) => a - b)).toEqual([0, 1, 2, 3]);
  });

  it('orderMcqOptions remaps text and round-trips original index', () => {
    const options = ['A-text', 'B-text', 'C-text', 'D-text'];
    const toOriginal = [2, 0, 3, 1];
    const ordered = orderMcqOptions(options, toOriginal);
    expect(ordered.displayOptions).toEqual([
      'C-text',
      'A-text',
      'D-text',
      'B-text',
    ]);
    expect(displayIndexForOriginal(ordered.toOriginal, 1)).toBe(3);
    expect(ordered.toOriginal[3]).toBe(1);
  });

  it('shuffleMcqOptions keeps all option texts', () => {
    const options = ['w', 'x', 'y', 'z'];
    let call = 0;
    const sequence = [0.9, 0.1, 0.5];
    const ordered = shuffleMcqOptions(options, () => sequence[call++] ?? 0);
    expect([...ordered.displayOptions].sort()).toEqual([...options].sort());
    expect(ordered.toOriginal).toHaveLength(4);
  });
});
