/**
 * @fileoverview Unit tests for MCQ grading / XP / mastery mapping (002).
 */

import { describe, expect, it } from 'vitest';
import {
  confidenceAfterMcq,
  gradeMcq,
  xpForMcq,
} from '../../apps/api/src/domain/mcq.ts';

describe('mcq grading', () => {
  it('grades selected vs correct index', () => {
    expect(gradeMcq(2, 2)).toBe(true);
    expect(gradeMcq(0, 3)).toBe(false);
  });

  it('awards 15 XP correct and 5 XP incorrect', () => {
    expect(xpForMcq(true)).toBe(15);
    expect(xpForMcq(false)).toBe(5);
  });

  it('maps mastery confidence from MCQ outcomes', () => {
    expect(confidenceAfterMcq(null, false)).toBe('learning');
    expect(confidenceAfterMcq('solid', false)).toBe('learning');
    expect(confidenceAfterMcq(null, true)).toBe('solid');
    expect(confidenceAfterMcq('learning', true)).toBe('solid');
    expect(confidenceAfterMcq('solid', true)).toBe('mastered');
    expect(confidenceAfterMcq('mastered', true)).toBe('mastered');
  });
});
