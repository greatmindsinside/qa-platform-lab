/**
 * @fileoverview Per-user card progress and practice event log.
 *
 * **What:** Upserts confidence progress and appends immutable practice events.
 * **Why:** Separates history/mastery storage from XP formula evaluation.
 */

import type { Confidence } from '@lab/shared';
import type { LabDb } from './db.js';

export type ProgressRow = {
  user_id: number;
  card_id: number;
  confidence: Confidence;
  practice_count: number;
  last_practiced_at: string | null;
};

export class ProgressStore {
  constructor(private readonly db: LabDb) {}

  getProgress(userId: number, cardId: number): ProgressRow | null {
    return (
      this.db
        .prepare(
          `SELECT * FROM card_progress WHERE user_id = ? AND card_id = ?`,
        )
        .get(userId, cardId) as ProgressRow | undefined
    ) ?? null;
  }

  upsertProgress(input: {
    userId: number;
    cardId: number;
    confidence: Confidence;
    practicedAt: string;
  }): ProgressRow {
    const existing = this.getProgress(input.userId, input.cardId);
    const practiceCount = (existing?.practice_count ?? 0) + 1;
    this.db
      .prepare(
        `INSERT INTO card_progress (user_id, card_id, confidence, practice_count, last_practiced_at)
         VALUES (@userId, @cardId, @confidence, @practiceCount, @practicedAt)
         ON CONFLICT(user_id, card_id) DO UPDATE SET
           confidence = excluded.confidence,
           practice_count = excluded.practice_count,
           last_practiced_at = excluded.last_practiced_at`,
      )
      .run({
        userId: input.userId,
        cardId: input.cardId,
        confidence: input.confidence,
        practiceCount,
        practicedAt: input.practicedAt,
      });
    const row = this.getProgress(input.userId, input.cardId);
    if (!row) throw new Error('Progress missing after upsert');
    return row;
  }

  recordEvent(input: {
    userId: number;
    cardId: number;
    confidence: Confidence;
    xpAwarded: number;
    practicedAt: string;
    selectedIndex?: number | null;
    wasCorrect?: boolean | null;
  }): void {
    this.db
      .prepare(
        `INSERT INTO practice_events (
           user_id, card_id, confidence, xp_awarded, practiced_at,
           selected_index, was_correct
         ) VALUES (
           @userId, @cardId, @confidence, @xpAwarded, @practicedAt,
           @selectedIndex, @wasCorrect
         )`,
      )
      .run({
        userId: input.userId,
        cardId: input.cardId,
        confidence: input.confidence,
        xpAwarded: input.xpAwarded,
        practicedAt: input.practicedAt,
        selectedIndex: input.selectedIndex ?? null,
        wasCorrect:
          input.wasCorrect === undefined || input.wasCorrect === null
            ? null
            : input.wasCorrect
              ? 1
              : 0,
      });
  }

  listConfidencesForDeck(userId: number, deckId: number): Array<Confidence | null> {
    const rows = this.db
      .prepare(
        `SELECT c.id, p.confidence
         FROM cards c
         LEFT JOIN card_progress p
           ON p.card_id = c.id AND p.user_id = ?
         WHERE c.deck_id = ?
         ORDER BY c.id`,
      )
      .all(userId, deckId) as Array<{ id: number; confidence: Confidence | null }>;
    return rows.map((r) => r.confidence);
  }
}
