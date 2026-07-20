/**
 * @fileoverview Practice / progression application service.
 *
 * **What:** Records open-confidence or MCQ practice, awards XP, updates streak.
 * **Why:** Single place that coordinates domain formulas + progress/user stores
 * so HTTP never owns XP math (constitution IV).
 */

import { isConfidence } from '@lab/shared';
import type { Confidence, PracticeResult } from '@lab/shared';
import {
  confidenceAfterMcq,
  gradeMcq,
  isMcqSelectedIndex,
  xpForMcq,
} from '../domain/mcq.js';
import {
  levelFromXp,
  nextStreak,
  titleForLevel,
  todayUtc,
  xpForPractice,
  xpIntoLevel,
  xpToNextLevel,
} from '../domain/progression.js';
import type { LabDb } from '../data/db.js';
import type { DeckStore } from '../data/deck-store.js';
import type { ProgressStore } from '../data/progress-store.js';
import type { UserStore } from '../data/user-store.js';
import { HttpError } from '../http/http-error.js';

export type PracticeBody = {
  confidence?: unknown;
  selectedIndex?: unknown;
};

/**
 * Practice use-cases for open and MCQ cards.
 */
export class PracticeService {
  constructor(
    private readonly db: LabDb,
    private readonly users: UserStore,
    private readonly decks: DeckStore,
    private readonly progress: ProgressStore,
  ) {}

  /**
   * Grade a practice attempt by card kind.
   * Open → confidence; MCQ → selectedIndex. One SQLite transaction per attempt.
   */
  practice(userId: number, cardId: number, body: PracticeBody): PracticeResult {
    const card = this.decks.getCard(cardId);
    if (!card) throw new HttpError(404, 'Card not found');
    const membership = this.decks.getMembership(card.deck_id, userId);
    if (membership === null) throw new HttpError(404, 'Card not found');

    const kind = card.kind ?? 'open';
    if (kind === 'mcq') {
      return this.practiceMcq(userId, cardId, card.correct_index, body);
    }
    return this.practiceOpen(userId, cardId, body.confidence);
  }

  private practiceOpen(
    userId: number,
    cardId: number,
    confidenceRaw: unknown,
  ): PracticeResult {
    if (!isConfidence(confidenceRaw)) {
      throw new HttpError(400, 'Invalid confidence');
    }
    const confidence = confidenceRaw;
    const user = this.requireUser(userId);
    const prev = this.progress.getProgress(userId, cardId);
    const xpAwarded = xpForPractice(prev?.confidence ?? null, confidence);
    return this.commitPractice({
      userId,
      cardId,
      user,
      confidence,
      xpAwarded,
    });
  }

  private practiceMcq(
    userId: number,
    cardId: number,
    correctIndex: number | null,
    body: PracticeBody,
  ): PracticeResult {
    if (body.confidence !== undefined) {
      throw new HttpError(400, 'MCQ practice uses selectedIndex, not confidence');
    }
    if (!isMcqSelectedIndex(body.selectedIndex)) {
      throw new HttpError(400, 'selectedIndex must be 0–3');
    }
    if (
      correctIndex === null ||
      !Number.isInteger(correctIndex) ||
      correctIndex < 0 ||
      correctIndex > 3
    ) {
      throw new HttpError(500, 'MCQ card missing correctIndex');
    }

    const selectedIndex = body.selectedIndex;
    const wasCorrect = gradeMcq(selectedIndex, correctIndex);
    const xpAwarded = xpForMcq(wasCorrect);
    const user = this.requireUser(userId);
    const prev = this.progress.getProgress(userId, cardId);
    const confidence = confidenceAfterMcq(prev?.confidence ?? null, wasCorrect);

    const result = this.commitPractice({
      userId,
      cardId,
      user,
      confidence,
      xpAwarded,
      selectedIndex,
      wasCorrect,
    });
    return {
      ...result,
      correct: wasCorrect,
      correctIndex,
    };
  }

  private requireUser(userId: number) {
    const user = this.users.findById(userId);
    if (!user) throw new HttpError(401, 'Unauthorized');
    return user;
  }

  private commitPractice(input: {
    userId: number;
    cardId: number;
    user: {
      total_xp: number;
      current_streak: number;
      last_practice_date: string | null;
    };
    confidence: Confidence;
    xpAwarded: number;
    selectedIndex?: number;
    wasCorrect?: boolean;
  }): PracticeResult {
    const practicedAt = new Date().toISOString();
    const day = todayUtc();
    const currentStreak = nextStreak({
      lastPracticeDate: input.user.last_practice_date,
      todayUtc: day,
      currentStreak: input.user.current_streak,
    });
    const totalXp = input.user.total_xp + input.xpAwarded;

    const commit = this.db.transaction(() => {
      this.progress.upsertProgress({
        userId: input.userId,
        cardId: input.cardId,
        confidence: input.confidence,
        practicedAt,
      });
      const event: {
        userId: number;
        cardId: number;
        confidence: Confidence;
        xpAwarded: number;
        practicedAt: string;
        selectedIndex?: number | null;
        wasCorrect?: boolean | null;
      } = {
        userId: input.userId,
        cardId: input.cardId,
        confidence: input.confidence,
        xpAwarded: input.xpAwarded,
        practicedAt,
      };
      if (input.selectedIndex !== undefined) {
        event.selectedIndex = input.selectedIndex;
      }
      if (input.wasCorrect !== undefined) {
        event.wasCorrect = input.wasCorrect;
      }
      this.progress.recordEvent(event);
      this.users.updateProgress(input.userId, {
        totalXp,
        currentStreak,
        lastPracticeDate: day,
      });
    });
    commit();

    const level = levelFromXp(totalXp);
    return {
      xpAwarded: input.xpAwarded,
      totalXp,
      level,
      title: titleForLevel(level),
      currentStreak,
      xpIntoLevel: xpIntoLevel(totalXp),
      xpToNextLevel: xpToNextLevel(totalXp),
    };
  }
}
