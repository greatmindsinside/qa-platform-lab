/**
 * @fileoverview Shared contracts for API + web + tests.
 *
 * **What:** Roles, confidence, card kinds, DTOs, seed credentials, type guards.
 * **Why:** Single source of truth across workspaces (DRY / constitution IV).
 * Passwords here are intentional public demo secrets for the portfolio lab.
 */

export type Role = 'admin' | 'member';
export type Confidence = 'learning' | 'solid' | 'mastered';
export type CardKind = 'open' | 'mcq';
export type LearningStage = 'beginner' | 'intermediate' | 'expert';

export const CONFIDENCE_VALUES: readonly Confidence[] = [
  'learning',
  'solid',
  'mastered',
] as const;

export const ROLE_VALUES: readonly Role[] = ['admin', 'member'] as const;
export const CARD_KIND_VALUES: readonly CardKind[] = ['open', 'mcq'] as const;
export const LEARNING_STAGE_VALUES: readonly LearningStage[] = [
  'beginner',
  'intermediate',
  'expert',
] as const;

/** Type guard for Role union. */
export function isRole(value: unknown): value is Role {
  return typeof value === 'string' && (ROLE_VALUES as readonly string[]).includes(value);
}

/** Type guard for Confidence union. */
export function isConfidence(value: unknown): value is Confidence {
  return (
    typeof value === 'string' &&
    (CONFIDENCE_VALUES as readonly string[]).includes(value)
  );
}

/** Type guard for CardKind union. */
export function isCardKind(value: unknown): value is CardKind {
  return (
    typeof value === 'string' &&
    (CARD_KIND_VALUES as readonly string[]).includes(value)
  );
}

/** Type guard for LearningStage union. */
export function isLearningStage(value: unknown): value is LearningStage {
  return (
    typeof value === 'string' &&
    (LEARNING_STAGE_VALUES as readonly string[]).includes(value)
  );
}

export type PublicUser = {
  id: number;
  email: string;
  displayName: string;
  role: Role;
  totalXp: number;
  currentStreak: number;
  level: number;
  title: string;
  xpIntoLevel: number;
  xpToNextLevel: number;
};

export type Deck = {
  id: number;
  name: string;
  description: string;
  ownerUserId: number;
  masteryPercent?: number;
  /** Curriculum stage; null = outside the official learning path. */
  stage: LearningStage | null;
  /** Exactly one seeded Beginner deck should be true. */
  recommendedStart: boolean;
};

/** Canonical seeded curriculum deck names (003-learning-path). */
export const CURRICULUM_DECKS = {
  foundations: 'QA Foundations',
  applied: 'Applied Testing Practice',
  strategy: 'Quality Strategy & Influence',
} as const;

export const LEGACY_SEED_DECK_NAMES = [
  'Playwright & E2E',
  'API testing & authz',
  'Behavioral (STAR)',
  'QA fundamentals (MCQ)',
] as const;

/** Public card DTO — never includes correctIndex (graded only on practice). */
export type Card = {
  id: number;
  deckId: number;
  kind: CardKind;
  prompt: string;
  answerHint: string;
  tags: string[];
  /** Present when kind is mcq; exactly four strings in stored order. */
  options?: [string, string, string, string];
};

export type DeckMember = {
  deckId: number;
  userId: number;
  email: string;
  displayName: string;
  role: Role;
};

export type PracticeResult = {
  xpAwarded: number;
  totalXp: number;
  level: number;
  title: string;
  currentStreak: number;
  xpIntoLevel: number;
  xpToNextLevel: number;
  /** MCQ only — present after an MCQ practice attempt. */
  correct?: boolean;
  correctIndex?: number;
};

/** Public demo accounts — not production secrets. */
export const SEED_USERS = {
  admin: {
    email: 'admin@lab.local',
    password: 'Admin123!',
    displayName: 'Lab Admin',
    role: 'admin' as Role,
  },
  member: {
    email: 'member@lab.local',
    password: 'Member123!',
    displayName: 'Lab Member',
    role: 'member' as Role,
  },
} as const;
