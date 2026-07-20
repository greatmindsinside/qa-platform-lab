/**
 * @fileoverview Unit tests for locked XP / streak / mastery formulas.
 */

import { describe, expect, it } from 'vitest';
import {
  deckMasteryPercent,
  levelFromXp,
  nextStreak,
  titleForLevel,
  xpForPractice,
  xpIntoLevel,
  xpToNextLevel,
} from '../../apps/api/src/domain/progression.ts';

describe('progression', () => {
  it('awards base and improve bonus XP', () => {
    expect(xpForPractice(null, 'learning')).toBe(10);
    expect(xpForPractice('learning', 'learning')).toBe(10);
    expect(xpForPractice('learning', 'solid')).toBe(15);
    expect(xpForPractice('solid', 'learning')).toBe(10);
  });

  it('computes level, titles, and XP bar fields', () => {
    expect(levelFromXp(0)).toBe(1);
    expect(levelFromXp(100)).toBe(2);
    expect(titleForLevel(1)).toBe('Apprentice');
    expect(titleForLevel(3)).toBe('Adventurer');
    expect(titleForLevel(15)).toBe('Staff Contender');
    expect(xpIntoLevel(0)).toBe(0);
    expect(xpToNextLevel(0)).toBe(100);
    expect(xpIntoLevel(10)).toBe(10);
    expect(xpToNextLevel(10)).toBe(90);
    expect(xpIntoLevel(100)).toBe(0);
    expect(xpToNextLevel(100)).toBe(100);
  });

  it('updates streak on practice days', () => {
    expect(
      nextStreak({
        lastPracticeDate: null,
        todayUtc: '2026-07-19',
        currentStreak: 0,
      }),
    ).toBe(1);
    expect(
      nextStreak({
        lastPracticeDate: '2026-07-19',
        todayUtc: '2026-07-19',
        currentStreak: 3,
      }),
    ).toBe(3);
    expect(
      nextStreak({
        lastPracticeDate: '2026-07-18',
        todayUtc: '2026-07-19',
        currentStreak: 3,
      }),
    ).toBe(4);
    expect(
      nextStreak({
        lastPracticeDate: '2026-07-10',
        todayUtc: '2026-07-19',
        currentStreak: 5,
      }),
    ).toBe(1);
  });

  it('computes deck mastery percent', () => {
    expect(deckMasteryPercent([])).toBe(0);
    expect(deckMasteryPercent([null, 'learning'])).toBe(0);
    expect(deckMasteryPercent(['solid', 'mastered', 'learning', null])).toBe(50);
  });
});
