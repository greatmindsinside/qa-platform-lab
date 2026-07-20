/**
 * @fileoverview Idempotent demo seed — Beginner → Expert curriculum (003).
 *
 * **What:** Admin/member users + staged multi-topic decks (open+MCQ mixed).
 * **Why:** Soft learning path with Start here; replaces flat legacy demo decks.
 */

import {
  CURRICULUM_DECKS,
  LEGACY_SEED_DECK_NAMES,
  SEED_USERS,
  type LearningStage,
} from '@lab/shared';
import type { LabDb } from './data/db.js';
import { DeckStore } from './data/deck-store.js';
import { UserStore } from './data/user-store.js';
import { hashPassword } from './http/password.js';

type SeedOpenCard = {
  kind?: 'open';
  prompt: string;
  answerHint: string;
  tags: string[];
};

type SeedMcqCard = {
  kind: 'mcq';
  prompt: string;
  options: [string, string, string, string];
  correctIndex: number;
  tags: string[];
};

type SeedCard = SeedOpenCard | SeedMcqCard;

type CurriculumDeck = {
  name: string;
  description: string;
  stage: LearningStage;
  recommendedStart?: boolean;
  cards: SeedCard[];
};

const CURRICULUM: CurriculumDeck[] = [
  {
    name: CURRICULUM_DECKS.foundations,
    description:
      'Beginner foundations — vocabulary, why quality matters, and first wins across tracks.',
    stage: 'beginner',
    recommendedStart: true,
    cards: [
      {
        prompt: 'What is the test pyramid and why does the base matter?',
        answerHint:
          'Many fast unit/API checks under fewer slow E2E tests — catch defects early and cheaply.',
        tags: ['beginner', 'strategy'],
      },
      {
        kind: 'mcq',
        prompt: 'A healthy smoke suite should prioritize:',
        options: [
          'Every backlog edge case',
          'Critical path that proves the system boots',
          'Only pixel-perfect UI diffs',
          'Skipping auth because it is hard',
        ],
        correctIndex: 1,
        tags: ['beginner', 'smoke', 'strategy'],
      },
      {
        prompt: 'When should you prefer getByRole over CSS selectors in Playwright?',
        answerHint:
          'Prefer role/name for accessibility and stability; CSS for layout-only when needed.',
        tags: ['beginner', 'playwright', 'locators'],
      },
      {
        kind: 'mcq',
        prompt: 'Which assertion style is most resilient in Playwright?',
        options: [
          'Fixed sleep then querySelector',
          'getByRole with accessible name',
          'XPath counting sibling nodes',
          'Screenshot pixel diff only',
        ],
        correctIndex: 1,
        tags: ['beginner', 'playwright', 'locators'],
      },
      {
        prompt: 'Difference between HTTP 401 and 403?',
        answerHint:
          '401 = not authenticated (or bad credentials); 403 = authenticated but not authorized.',
        tags: ['beginner', 'http', 'authz'],
      },
      {
        kind: 'mcq',
        prompt: 'HTTP 403 most accurately means:',
        options: [
          'Credentials missing or invalid',
          'Resource does not exist',
          'Authenticated but not authorized',
          'Request timed out',
        ],
        correctIndex: 2,
        tags: ['beginner', 'http', 'authz'],
      },
      {
        prompt: 'What does STAR stand for in behavioral interviews?',
        answerHint: 'Situation, Task, Action, Result — structure stories with measurable outcomes.',
        tags: ['beginner', 'star', 'behavioral'],
      },
      {
        kind: 'mcq',
        prompt: 'Deck delete authorization should be based on:',
        options: [
          'Global admin role alone',
          'Whoever created the SQLite file',
          'Membership role on that deck',
          'Client-side hidden buttons only',
        ],
        correctIndex: 2,
        tags: ['beginner', 'rbac', 'authz'],
      },
    ],
  },
  {
    name: CURRICULUM_DECKS.applied,
    description:
      'Intermediate practice — waits, flakes, authz scenarios, and applied STAR stories.',
    stage: 'intermediate',
    cards: [
      {
        prompt: 'How do you wait for a network response before asserting UI?',
        answerHint:
          'Use page.waitForResponse (or expect.poll) tied to the action that triggers it.',
        tags: ['intermediate', 'playwright', 'waits'],
      },
      {
        kind: 'mcq',
        prompt: 'Best flake-reduction habit for E2E suites:',
        options: [
          'Add longer fixed sleeps everywhere',
          'Assert on readiness; isolate data; avoid blind retries',
          'Disable CI on Fridays',
          'Only run tests locally',
        ],
        correctIndex: 1,
        tags: ['intermediate', 'playwright', 'flake'],
      },
      {
        prompt: 'Name one flake-reduction tactic for E2E suites.',
        answerHint:
          'Avoid fixed sleeps; assert on readiness; isolate test data; retry only with diagnosis.',
        tags: ['intermediate', 'playwright', 'flake'],
      },
      {
        prompt: 'Why assert error bodies on negative API tests?',
        answerHint:
          'Status alone can drift; body/code contracts catch wrong handler regressions.',
        tags: ['intermediate', 'api', 'contracts'],
      },
      {
        kind: 'mcq',
        prompt: 'To prove membership-based RBAC you should:',
        options: [
          'Only test the global admin account',
          'Same global role, different deck membership → allow vs deny',
          'Hide the delete button in CSS',
          'Trust JWT claims without membership checks',
        ],
        correctIndex: 1,
        tags: ['intermediate', 'rbac', 'authz'],
      },
      {
        prompt: 'How do you prove membership-based RBAC in tests?',
        answerHint:
          'Same global role, different deck membership → allow vs deny delete.',
        tags: ['intermediate', 'rbac', 'authz'],
      },
      {
        prompt: 'Tell me about a time you reduced flaky tests.',
        answerHint:
          'STAR: Situation (flake rate), Task (stabilize CI), Action (root cause + waits), Result (metrics).',
        tags: ['intermediate', 'star', 'behavioral'],
      },
      {
        kind: 'mcq',
        prompt: 'Under a deadline, prioritize coverage by:',
        options: [
          'Writing every unit test first',
          'Risk-based selection: smoke vs deep, communicate trade-offs',
          'Skipping API tests entirely',
          'Only testing happy paths forever',
        ],
        correctIndex: 1,
        tags: ['intermediate', 'star', 'prioritization'],
      },
    ],
  },
  {
    name: CURRICULUM_DECKS.strategy,
    description:
      'Expert path — quality strategy, system thinking, influence, and hard edge cases.',
    stage: 'expert',
    cards: [
      {
        prompt: 'How would you design a quality strategy for a new microservice?',
        answerHint:
          'Risk map, test layers, contracts, observability hooks, ownership, and release gates.',
        tags: ['expert', 'strategy', 'sdet'],
      },
      {
        kind: 'mcq',
        prompt: 'Risk-based testing most usefully focuses effort on:',
        options: [
          'Random equal coverage of all screens',
          'Highest impact / likelihood failure modes first',
          'Only brand-new features',
          'Whatever is easiest to automate',
        ],
        correctIndex: 1,
        tags: ['expert', 'strategy'],
      },
      {
        prompt: 'Give an example of influencing developers without authority.',
        answerHint:
          'STAR: shared goal, data/demo of risk, collaborative fix, lasting process change.',
        tags: ['expert', 'star', 'influence'],
      },
      {
        kind: 'mcq',
        prompt: 'A strong quality signal in CI is:',
        options: [
          'Green builds with no ownership of flakes',
          'Fast feedback on critical paths plus actionable failures',
          'Manual-only releases every quarter',
          'Skipping tests when the branch name has “hotfix”',
        ],
        correctIndex: 1,
        tags: ['expert', 'strategy', 'ci'],
      },
      {
        prompt: 'Walk through a production bug you caught before release.',
        answerHint:
          'STAR: how found, severity, action (block/fix), Result (incident avoided + learning).',
        tags: ['expert', 'star', 'quality'],
      },
      {
        prompt: 'What should a smoke API test cover first?',
        answerHint:
          'Auth happy path + one critical mutation/read that proves the system boots.',
        tags: ['expert', 'api', 'smoke'],
      },
      {
        kind: 'mcq',
        prompt: 'Contract testing between services helps most when:',
        options: [
          'UI looks pretty',
          'Providers change response shapes without consumer notice',
          'You only have one monolith forever',
          'You never deploy',
        ],
        correctIndex: 1,
        tags: ['expert', 'api', 'contracts'],
      },
      {
        prompt: 'Describe how you prioritize test coverage under a deadline.',
        answerHint:
          'STAR: risk-based selection, smoke vs deep, communicate trade-offs, measurable outcome.',
        tags: ['expert', 'star', 'prioritization'],
      },
    ],
  },
];

function insertCards(
  decks: DeckStore,
  deckId: number,
  cards: SeedCard[],
): void {
  for (const card of cards) {
    if (card.kind === 'mcq') {
      decks.createCard({
        deckId,
        kind: 'mcq',
        prompt: card.prompt,
        answerHint: '',
        tags: card.tags,
        options: card.options,
        correctIndex: card.correctIndex,
      });
    } else {
      decks.createCard({
        deckId,
        kind: 'open',
        prompt: card.prompt,
        answerHint: card.answerHint,
        tags: card.tags,
      });
    }
  }
}

function removeLegacySeedDecks(decks: DeckStore): void {
  for (const name of LEGACY_SEED_DECK_NAMES) {
    const legacy = decks.findDeckByName(name);
    if (legacy) {
      decks.deleteDeck(legacy.id);
    }
  }
}

function ensureCurriculum(
  decks: DeckStore,
  adminId: number,
  memberId: number,
): void {
  if (decks.findDeckByName(CURRICULUM_DECKS.foundations)) return;

  for (const deckDef of CURRICULUM) {
    const deck = decks.createDeck({
      name: deckDef.name,
      description: deckDef.description,
      ownerUserId: adminId,
      stage: deckDef.stage,
      recommendedStart: Boolean(deckDef.recommendedStart),
    });
    decks.upsertMember(deck.id, adminId, 'admin');
    decks.upsertMember(deck.id, memberId, 'member');
    insertCards(decks, deck.id, deckDef.cards);
  }
}

export async function seedDatabase(db: LabDb): Promise<void> {
  const users = new UserStore(db);
  const decks = new DeckStore(db);

  let admin = users.findByEmail(SEED_USERS.admin.email);
  let member = users.findByEmail(SEED_USERS.member.email);

  if (!admin) {
    admin = users.create({
      email: SEED_USERS.admin.email,
      passwordHash: await hashPassword(SEED_USERS.admin.password),
      role: SEED_USERS.admin.role,
      displayName: SEED_USERS.admin.displayName,
    });
    member = users.create({
      email: SEED_USERS.member.email,
      passwordHash: await hashPassword(SEED_USERS.member.password),
      role: SEED_USERS.member.role,
      displayName: SEED_USERS.member.displayName,
    });
  }

  if (!admin || !member) {
    throw new Error('Seed users missing after bootstrap');
  }

  // Drop pre-003 demo decks so upgraded DBs don't pollute Your decks.
  removeLegacySeedDecks(decks);
  ensureCurriculum(decks, admin.id, member.id);
}
