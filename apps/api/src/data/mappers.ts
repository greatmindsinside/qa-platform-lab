/**
 * @fileoverview Row → DTO mappers (data shape → API contract).
 *
 * **What:** Converts SQLite row shapes into `@lab/shared` DTOs.
 * **Why:** Keeps stores persistence-focused and avoids leaking snake_case
 * into application/HTTP layers (SRP / clean boundaries).
 * GET/list never expose correctIndex (MCQ keys stay server-side).
 */

import type {
  AdventureChoice,
  AdventureEndingTone,
  AdventureSceneView,
  AdventureSummary,
  Card,
  Confidence,
  Deck,
  LearningTakeaway,
  PublicUser,
} from '@lab/shared';
import {
  deckMasteryPercent,
  levelFromXp,
  titleForLevel,
  xpIntoLevel,
  xpToNextLevel,
} from '../domain/progression.js';
import type {
  AdventureProgressRow,
  AdventureRow,
  ChoiceRow,
  SceneRow,
} from './adventure-store.js';
import type { CardRow, DeckRow } from './deck-store.js';
import type { UserRow } from './user-store.js';

/** Map a card row to the public Card DTO (never includes correctIndex). */
export function mapCard(row: CardRow): Card {
  const base: Card = {
    id: row.id,
    deckId: row.deck_id,
    kind: row.kind ?? 'open',
    prompt: row.prompt,
    answerHint: row.answer_hint,
    tags: JSON.parse(row.tags_json) as string[],
  };
  if (base.kind === 'mcq' && row.options_json) {
    const options = JSON.parse(row.options_json) as string[];
    if (options.length === 4) {
      base.options = options as [string, string, string, string];
    }
  }
  return base;
}

/** Map a deck row plus caller mastery confidences to Deck DTO. */
export function mapDeck(
  row: DeckRow,
  confidences: Array<Confidence | null | undefined>,
): Deck {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    ownerUserId: row.owner_user_id,
    masteryPercent: deckMasteryPercent(confidences),
    stage: row.stage ?? null,
    recommendedStart: Boolean(row.recommended_start),
  };
}

/**
 * Project persisted user aggregates into PublicUser (includes derived XP fields).
 */
export function toPublicUser(user: UserRow): PublicUser {
  const totalXp = user.total_xp;
  const level = levelFromXp(totalXp);
  return {
    id: user.id,
    email: user.email,
    displayName: user.display_name,
    role: user.role,
    totalXp,
    currentStreak: user.current_streak,
    level,
    title: titleForLevel(level),
    xpIntoLevel: xpIntoLevel(totalXp),
    xpToNextLevel: xpToNextLevel(totalXp),
  };
}

/** Map adventure row + optional progress into list summary DTO. */
export function mapAdventureSummary(
  row: AdventureRow,
  progress: AdventureProgressRow | null,
): AdventureSummary {
  const progressStatus = !progress
    ? 'not_started'
    : progress.status === 'completed'
      ? 'completed'
      : 'in_progress';
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    blurb: row.blurb,
    learningThemes: JSON.parse(row.learning_themes_json) as string[],
    progressStatus,
    awardGranted: Boolean(progress?.award_granted),
  };
}

export function mapChoice(row: ChoiceRow): AdventureChoice {
  return { id: row.id, label: row.label };
}

/** Build scene view; caller attaches takeaways / progression when needed. */
export function mapSceneView(
  adventureId: number,
  scene: SceneRow,
  choices: ChoiceRow[],
  extras?: {
    takeaways?: LearningTakeaway[];
    xpAwarded?: number;
    totalXp?: number;
    level?: number;
    title?: string;
    currentStreak?: number;
    xpIntoLevel?: number;
    xpToNextLevel?: number;
  },
): AdventureSceneView {
  const endingTone =
    (scene.ending_tone as AdventureEndingTone | null) ?? null;
  const view: AdventureSceneView = {
    adventureId,
    sceneId: scene.id,
    body: scene.body,
    isEnding: Boolean(scene.is_ending),
    endingTone,
    choices: choices.map(mapChoice),
  };
  if (extras?.takeaways) view.takeaways = extras.takeaways;
  if (extras?.xpAwarded !== undefined) view.xpAwarded = extras.xpAwarded;
  if (extras?.totalXp !== undefined) view.totalXp = extras.totalXp;
  if (extras?.level !== undefined) view.level = extras.level;
  if (extras?.title !== undefined) view.title = extras.title;
  if (extras?.currentStreak !== undefined) {
    view.currentStreak = extras.currentStreak;
  }
  if (extras?.xpIntoLevel !== undefined) view.xpIntoLevel = extras.xpIntoLevel;
  if (extras?.xpToNextLevel !== undefined) {
    view.xpToNextLevel = extras.xpToNextLevel;
  }
  return view;
}
