/**
 * @fileoverview Pure RPG-lite progression formulas (locked by feature spec).
 *
 * **What:** XP awards, levels, titles, streak updates, deck mastery %.
 * **Why:** Domain stays framework-free so Vitest can lock formulas without
 * Fastify/SQLite; UI must never re-implement these (constitution IV).
 */

import type { Confidence } from '@lab/shared';

const RANK: Record<Confidence, number> = {
  learning: 0,
  solid: 1,
  mastered: 2,
};

/** Ordinal for confidence compare (learning < solid < mastered). */
export function confidenceRank(confidence: Confidence): number {
  return RANK[confidence];
}

/**
 * Base +10 XP; +5 improve bonus when confidence strictly increases.
 * First practice (`prev === null`) never gets the bonus.
 */
export function xpForPractice(
  prev: Confidence | null,
  next: Confidence,
): number {
  const base = 10;
  if (prev === null) return base;
  const improved = confidenceRank(next) > confidenceRank(prev);
  return base + (improved ? 5 : 0);
}

/** `floor(totalXp / 100) + 1` */
export function levelFromXp(totalXp: number): number {
  return Math.floor(totalXp / 100) + 1;
}

/** Title bands from the Quest Deck MVP assumptions. */
export function titleForLevel(level: number): string {
  if (level <= 2) return 'Apprentice';
  if (level <= 5) return 'Adventurer';
  if (level <= 9) return 'Challenger';
  if (level <= 14) return 'Veteran';
  return 'Staff Contender';
}

/** XP progress within the current 100-XP band (bar fill). */
export function xpIntoLevel(totalXp: number): number {
  return totalXp % 100;
}

/**
 * XP remaining to the next level boundary.
 * At exact multiples (including 0) the bar is empty → 100 to next.
 */
export function xpToNextLevel(totalXp: number): number {
  const into = xpIntoLevel(totalXp);
  return into === 0 ? 100 : 100 - into;
}

/**
 * Streak updates only on practice (UTC calendar days).
 * Same day → unchanged; yesterday → +1; else → 1.
 */
export function nextStreak(input: {
  lastPracticeDate: string | null;
  todayUtc: string;
  currentStreak: number;
}): number {
  const { lastPracticeDate, todayUtc, currentStreak } = input;
  if (lastPracticeDate === todayUtc) return currentStreak;
  if (lastPracticeDate === yesterdayUtc(todayUtc)) return currentStreak + 1;
  return 1;
}

/** Previous UTC calendar day as `YYYY-MM-DD`. */
export function yesterdayUtc(todayUtc: string): string {
  const d = new Date(`${todayUtc}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

/** Current UTC calendar day as `YYYY-MM-DD`. */
export function todayUtc(now = new Date()): string {
  return now.toISOString().slice(0, 10);
}

/**
 * Share of cards rated solid|mastered for a user in a deck (0–100).
 * Empty deck → 0.
 */
export function deckMasteryPercent(
  confidences: Array<Confidence | null | undefined>,
): number {
  if (confidences.length === 0) return 0;
  const mastered = confidences.filter(
    (c) => c === 'solid' || c === 'mastered',
  ).length;
  return Math.round((mastered / confidences.length) * 100);
}
