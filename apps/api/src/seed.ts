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
import { AdventureStore } from './data/adventure-store.js';
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
  /** Shown after practice so learners know why the key is correct. */
  answerHint: string;
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
          'Classic shape: many fast unit tests at the base, fewer integration/API tests in the middle, fewest slow UI/E2E at the tip. The base matters because defects found lower in the stack are cheaper and faster to fix, and you get feedback sooner.',
        tags: ['beginner', 'strategy'],
      },
      {
        kind: 'mcq',
        prompt: 'A healthy smoke suite should prioritize:',
        answerHint:
          'Smoke proves the build is basically alive: critical path / boot checks. It is not full regression, pixel-perfect coverage, or a place to skip hard auth.',
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
          'Prefer getByRole (and accessible name) when the control has a meaningful role — it mirrors how assistive tech sees the UI and survives class/layout churn. Use CSS/testid mainly for layout-only or non-semantic nodes.',
        tags: ['beginner', 'playwright', 'locators'],
      },
      {
        kind: 'mcq',
        prompt:
          'Which approach is most resilient when locating elements for assertions in Playwright?',
        answerHint:
          'Role + accessible name locators couple to user-visible semantics and work with Playwright’s auto-waiting assertions. Fixed sleeps, brittle XPath, and pixel-only checks flake or miss behavior.',
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
          '401 Unauthorized: the client must authenticate (missing/invalid credentials). 403 Forbidden: the server understood the request but refuses to authorize it — commonly “authenticated but not allowed,” though some systems also use 403 for other hard refusals. Interview shorthand: 401 = authN problem, 403 = authZ problem.',
        tags: ['beginner', 'http', 'authz'],
      },
      {
        kind: 'mcq',
        prompt: 'HTTP 403 most accurately means:',
        answerHint:
          '403 = Forbidden: the server refuses to authorize the request. Missing/invalid credentials are typically 401; missing resource is often 404; timeouts are not 403.',
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
        answerHint:
          'Situation, Task, Action, Result. Frame the story with context, your responsibility, what you did, and a measurable outcome.',
        tags: ['beginner', 'star', 'behavioral'],
      },
      {
        kind: 'mcq',
        prompt: 'Deck delete authorization should be based on:',
        answerHint:
          'In this lab (and solid multi-tenant design), delete rights come from membership role on that deck — not a global flag alone, file ownership myths, or hiding UI controls.',
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
          'Start page.waitForResponse (or a response promise) before the click/submit that triggers the request, then await it and assert UI. Tying the wait to the action avoids races; prefer this over fixed sleeps. expect.poll is useful when you assert a derived condition instead of a single response.',
        tags: ['intermediate', 'playwright', 'waits'],
      },
      {
        kind: 'mcq',
        prompt: 'Best flake-reduction habit for E2E suites:',
        answerHint:
          'Flakes come from timing and shared state. Assert readiness, isolate data, and diagnose before retrying — longer sleeps and “only run locally” hide problems.',
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
          'Examples that count: replace fixed sleeps with readiness assertions; isolate/seed test data per run; make locators user-facing; retry only after you know the failure mode — not blind triple-reruns.',
        tags: ['intermediate', 'playwright', 'flake'],
      },
      {
        prompt: 'Why assert error bodies on negative API tests?',
        answerHint:
          'Status codes can stay “correct” while the wrong handler or message ships. Asserting a stable error code/body (contract) catches regressions status alone would miss.',
        tags: ['intermediate', 'api', 'contracts'],
      },
      {
        kind: 'mcq',
        prompt: 'To prove membership-based RBAC you should:',
        answerHint:
          'Hold global role constant and vary deck membership: member of deck A can delete A; same user without membership (or lower role) on B is denied. UI hiding and JWT-only checks are not proof.',
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
          'Same user/global role, two decks: membership admin/member on deck A → delete allowed; no membership (or viewer) on deck B → delete denied. Assert API status, not just button visibility.',
        tags: ['intermediate', 'rbac', 'authz'],
      },
      {
        prompt: 'Tell me about a time you reduced flaky tests.',
        answerHint:
          'STAR: Situation (flake rate / noisy CI), Task (stabilize), Action (root cause: waits, data, locators — not blind sleeps), Result (lower flake %, faster green builds).',
        tags: ['intermediate', 'star', 'behavioral'],
      },
      {
        kind: 'mcq',
        prompt: 'Under a deadline, prioritize coverage by:',
        answerHint:
          'Risk-based: protect smoke/critical paths first, deepen where impact×likelihood is high, and say what you are not covering. “Only unit” or “happy path forever” are not strategies.',
        options: [
          'Writing every unit test first',
          'Risk-based selection: smoke vs deep, communicate trade-offs',
          'Skipping API tests entirely',
          'Only testing happy paths forever',
        ],
        correctIndex: 1,
        tags: ['intermediate', 'star', 'prioritization'],
      },
      {
        prompt:
          'How do you decide what belongs in the Definition of Done for a feature?',
        answerHint:
          'DoD is the team’s agreed quality bar before “done” — e.g. automated checks for the risk, a11y/security where relevant, observability/logging, docs/runbooks, and explicit owner acceptance. It is negotiated with eng/product, not “dev says done.”',
        tags: ['intermediate', 'process', 'senior'],
      },
      {
        kind: 'mcq',
        prompt: 'Best first move when a critical path E2E fails only in CI:',
        answerHint:
          'Treat it as a signal: save artifacts (trace, video, logs), compare env vs product, reproduce, then judge severity. Disabling the test or noisy Slack without evidence wastes the failure.',
        options: [
          'Disable the test and ship',
          'Capture artifacts, bisect environment vs product, then decide severity',
          'Rewrite the product to avoid the path',
          'Ping the whole company in Slack with no link',
        ],
        correctIndex: 1,
        tags: ['intermediate', 'ci', 'senior'],
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
          'Map risks and users; choose test layers (unit/contract/API/E2E) by risk; define ownership; add observability (SLIs, logs, traces); set release gates (smoke, rollback). Strategy is risk + feedback loops, not “automate everything.”',
        tags: ['expert', 'strategy', 'sdet'],
      },
      {
        kind: 'mcq',
        prompt: 'Risk-based testing most usefully focuses effort on:',
        answerHint:
          'Prioritize by impact × likelihood (and detectability). Equal coverage of all screens, only-new-features, or easiest-to-automate bias leave high-risk gaps.',
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
          'STAR: shared goal (user/reliability), show risk with data or a short demo, propose a small collaborative fix, leave a lasting process (lint, test, review checklist) — not mandates from title.',
        tags: ['expert', 'star', 'influence'],
      },
      {
        kind: 'mcq',
        prompt: 'A strong quality signal in CI is:',
        answerHint:
          'Fast feedback on critical paths with failures that tell you what broke and who owns it. Green-but-ignored flakes, manual-only cadence, or skipping tests on “hotfix” destroy signal.',
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
          'STAR: how you found it (test, review, exploratory), severity/impact, action (block, fix, flag), Result (incident avoided + what you changed so it cannot silently return).',
        tags: ['expert', 'star', 'quality'],
      },
      {
        prompt: 'What should a smoke API test cover first?',
        answerHint:
          'Prove the service boots for a real client: authenticate (or health if public) plus one critical read or mutation on the core path. Deep edge matrices belong in broader regression, not smoke.',
        tags: ['expert', 'api', 'smoke'],
      },
      {
        kind: 'mcq',
        prompt: 'Contract testing between services helps most when:',
        answerHint:
          'Contracts catch provider response/request shape drift before consumers break in integration or prod — especially valuable across service boundaries. Pretty UI and single-monolith forever are not the main win.',
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
          'STAR: risk map → smoke vs deep selection → explicit trade-offs to stakeholders → measurable outcome (what shipped protected, what residual risk remains).',
        tags: ['expert', 'star', 'prioritization'],
      },
      {
        prompt:
          'How would you measure whether the QA strategy is working for the org?',
        answerHint:
          'Prefer outcome signals: escaped defects / customer-impact incidents, time to detect and fix those escapes, flake rate (signal quality), and lead time for critical fixes — not raw test count or coverage % alone.',
        tags: ['expert', 'senior', 'metrics'],
      },
      {
        kind: 'mcq',
        prompt: 'A senior QA reviewing automation ROI should prioritize:',
        answerHint:
          'Automate stable, high-value checks with clear owners and a known response when red. Automating everything, brittle record/playback everywhere, or deleting all manual exploratory testing are poor ROI moves.',
        options: [
          'Automating every manual checklist item',
          'Stable high-value checks with clear ownership and failure action',
          'UI record/playback for all screens',
          'Deleting all manual testing',
        ],
        correctIndex: 1,
        tags: ['expert', 'senior', 'automation'],
      },
      {
        prompt:
          'How do you partner with product on release risk when shipping incomplete features?',
        answerHint:
          'Agree a risk matrix; use feature flags/canaries; define blast radius and rollback; set explicit go/no-go criteria and monitoring. Incomplete can ship safely if exposure is controlled and reversible.',
        tags: ['expert', 'senior', 'release'],
      },
      {
        kind: 'mcq',
        prompt:
          'Best senior response to “just add more E2E coverage” after an incident:',
        answerHint:
          'Find the real gap (wrong layer, missing signal, no owner) and add the smallest durable check. Piling brittle E2E, blame, or turning CI off repeats the incident pattern.',
        options: [
          'Add ten more brittle UI flows immediately',
          'Root-cause the gap (layer, signal, ownership) then add the smallest durable check',
          'Blame the developer who merged',
          'Turn off CI until headcount grows',
        ],
        correctIndex: 1,
        tags: ['expert', 'senior', 'strategy'],
      },
      {
        prompt:
          'How would you build a quality bar for accessibility without blocking every PR?',
        answerHint:
          'Automate axe/lint on critical paths in CI; triage by severity; schedule deeper manual/assistive-tech audits; share ownership with design/dev. Block merges for agreed severe issues; don’t invent a full audit on every PR.',
        tags: ['expert', 'senior', 'a11y'],
      },
      {
        kind: 'mcq',
        prompt: 'Observability supports quality most when teams:',
        answerHint:
          'Define SLIs/SLOs tied to user journeys and alert on those failure modes. Post-outage CPU staring, infinite DEBUG logs, or screenshots alone are not a quality feedback loop.',
        options: [
          'Only look at CPU graphs after outages',
          'Define SLIs/SLOs and alert on user-facing failure modes',
          'Log everything at DEBUG forever',
          'Rely on screenshots alone',
        ],
        correctIndex: 1,
        tags: ['expert', 'senior', 'observability'],
      },
      {
        prompt:
          'Tell me how you mentor a mid-level QA who over-indexes on UI automation.',
        answerHint:
          'STAR: coach the pyramid/risk layers, pair on API/contract wins that catch bugs earlier, agree metrics (speed, flake, escapes), and show a concrete win with faster feedback than another UI flow.',
        tags: ['expert', 'senior', 'leadership'],
      },
      {
        kind: 'mcq',
        prompt: 'In a blameless postmortem, a senior QA’s primary job is to:',
        answerHint:
          'Blameless means systemic learning: contributing factors, durable follow-ups, named owners — not personal fault scores, cover-ups, or empty closures.',
        options: [
          'Assign personal fault percentages',
          'Surface systemic gaps and durable follow-ups with owners',
          'Rewrite history to protect the release',
          'Close the incident ticket with no actions',
        ],
        correctIndex: 1,
        tags: ['expert', 'senior', 'incident'],
      },
      {
        prompt:
          'How would you design test data strategy for multi-tenant SaaS without polluting prod?',
        answerHint:
          'Prefer synthetic fixtures in isolated test tenants; automate cleanup/TTL; never copy production PII without legal/controls. Seed deterministically so tests don’t share mutable global state.',
        tags: ['expert', 'senior', 'testdata'],
      },
      {
        kind: 'mcq',
        prompt: 'Shift-left quality at senior level means:',
        answerHint:
          'Move risk discovery earlier: design/API reviews, contract checks, fast unit/integration feedback. It is not “test only in prod,” “QA writes all prod code,” or “skip staging.”',
        options: [
          'Moving all testing to production only',
          'Earlier risk discovery with design/API reviews and fast feedback loops',
          'QA writing all production code',
          'Skipping staging entirely',
        ],
        correctIndex: 1,
        tags: ['expert', 'senior', 'shift-left'],
      },
      {
        prompt:
          'You disagree with an engineering manager about shipping with known severity-1 risk. What do you do?',
        answerHint:
          'Document impact and likelihood, propose mitigations (hold, flag, canary, extra monitoring), escalate with evidence through the agreed path, then record the decision — including residual risk if they proceed.',
        tags: ['expert', 'senior', 'influence'],
      },
      {
        kind: 'mcq',
        prompt: 'A durable quality gate on the merge path should be:',
        answerHint:
          'Gates that teams respect are fast, deterministic, owned, and blocking only for agreed risk. Optional-when-busy, multi-hour UI on every commit, or email checklists fail in practice.',
        options: [
          'Optional and ignored when busy',
          'Fast, deterministic, owned, and blocking only for agreed risk',
          'A 3-hour full UI suite on every commit',
          'A manual spreadsheet checklist in email',
        ],
        correctIndex: 1,
        tags: ['expert', 'senior', 'ci'],
      },
    ],
  },
];

/** Prompt renames applied on upgrade so card counts stay stable. */
const CURRICULUM_PROMPT_RENAMES: Array<{ from: string; to: string }> = [
  {
    from: 'Which assertion style is most resilient in Playwright?',
    to: 'Which approach is most resilient when locating elements for assertions in Playwright?',
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
        answerHint: card.answerHint,
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

/** Insert missing cards and refresh answer hints (seed upgrades). */
function ensureMissingCards(
  decks: DeckStore,
  deckId: number,
  cards: SeedCard[],
): void {
  for (const rename of CURRICULUM_PROMPT_RENAMES) {
    decks.renameCardPrompt(deckId, rename.from, rename.to);
  }

  const existing = decks.listCards(deckId);
  const byPrompt = new Map(existing.map((c) => [c.prompt, c]));
  const missing: SeedCard[] = [];

  for (const card of cards) {
    const row = byPrompt.get(card.prompt);
    if (!row) {
      missing.push(card);
      continue;
    }
    if (row.answer_hint !== card.answerHint) {
      decks.updateCardAnswerHint(row.id, card.answerHint);
    }
  }

  if (missing.length > 0) insertCards(decks, deckId, missing);
}

function ensureCurriculum(
  decks: DeckStore,
  adminId: number,
  memberId: number,
): void {
  const foundations = decks.findDeckByName(CURRICULUM_DECKS.foundations);
  if (!foundations) {
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
    return;
  }

  // Upgrade path: backfill new curriculum cards onto existing decks by prompt.
  for (const deckDef of CURRICULUM) {
    const deck = decks.findDeckByName(deckDef.name);
    if (!deck) continue;
    ensureMissingCards(decks, deck.id, deckDef.cards);
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
  ensureFlakyFridayAdventure(new AdventureStore(db));
}

/**
 * Seed the Flaky Friday choice graph once (idempotent by slug).
 * Graph: intro → triage → investigate|rush → evidence|ship → endings.
 */
function ensureFlakyFridayAdventure(store: AdventureStore): void {
  if (store.findBySlug('flaky-friday')) return;

  const adventure = store.insertAdventure({
    slug: 'flaky-friday',
    title: 'Flaky Friday',
    blurb:
      'A release is wobbling. Investigate the flake, triage severity, and ship with evidence — or rush and learn the hard way.',
    learningThemes: ['flake-risk', 'severity', 'evidence', 'happy-vs-edge'],
  });

  const scenes = {
    intro: store.insertScene({
      adventureId: adventure.id,
      sceneKey: 'intro',
      body: 'It is Friday afternoon. CI is red on main — but only sometimes. Product wants the build out before the weekend. You are the QA on call.',
    }),
    triage: store.insertScene({
      adventureId: adventure.id,
      sceneKey: 'triage',
      body: 'The failing job is an E2E that clicks “Save” then asserts a toast. It passed locally. Logs show a 2s spinner that sometimes lasts longer. Leadership asks: “Is this a blocker?”',
    }),
    investigate: store.insertScene({
      adventureId: adventure.id,
      sceneKey: 'investigate',
      body: 'You treat it as a flake risk, not a product random. You capture the run URL, note the wait strategy, and reproduce with a slower network profile. The toast appears after the spinner — when you wait for the right signal, it is green.',
    }),
    rush: store.insertScene({
      adventureId: adventure.id,
      sceneKey: 'rush',
      body: 'You relaunch CI twice. It goes green. Someone says “ship it.” You skip deeper investigation to protect the Friday release window.',
    }),
    evidence: store.insertScene({
      adventureId: adventure.id,
      sceneKey: 'evidence',
      body: 'Time to communicate. Do you file a solid bug with steps and evidence, or a thin “CI flaky, ignore” note?',
    }),
    ship: store.insertScene({
      adventureId: adventure.id,
      sceneKey: 'ship',
      body: 'The build is tagged. Support chat lights up Monday: intermittent save failures for users on slow networks. Leadership asks what you knew on Friday.',
    }),
    endingStrong: store.insertScene({
      adventureId: adventure.id,
      sceneKey: 'ending-strong',
      body: 'You held the line: flake diagnosis, severity vs priority clarity, and a bug report with evidence. The release slipped a few hours — and Monday was quiet.',
      isEnding: true,
      endingTone: 'strong',
    }),
    endingWeak: store.insertScene({
      adventureId: adventure.id,
      sceneKey: 'ending-weak',
      body: 'The weekend ship looked fine until production matched the flake. Without evidence and edge-case coverage, triage turned into firefighting.',
      isEnding: true,
      endingTone: 'weak',
    }),
    edgeCheck: store.insertScene({
      adventureId: adventure.id,
      sceneKey: 'edge-check',
      body: 'Before you close the loop: do you add a wait-for-toast assertion (happy path only) or also cover a slow-network / retry edge?',
    }),
  };

  store.setStartScene(adventure.id, scenes.intro.id);

  store.insertChoice({
    sceneId: scenes.intro.id,
    label: 'Open the failing CI run',
    nextSceneId: scenes.triage.id,
    lessonTags: ['evidence'],
    sortOrder: 0,
  });
  store.insertChoice({
    sceneId: scenes.triage.id,
    label: 'Investigate waits and signals before calling severity',
    nextSceneId: scenes.investigate.id,
    lessonTags: ['flake-risk', 'severity'],
    sortOrder: 0,
  });
  store.insertChoice({
    sceneId: scenes.triage.id,
    label: 'Rerun until green and protect the Friday ship',
    nextSceneId: scenes.rush.id,
    lessonTags: ['flake-risk'],
    sortOrder: 1,
  });
  store.insertChoice({
    sceneId: scenes.investigate.id,
    label: 'File a bug with steps, expected/actual, and the run link',
    nextSceneId: scenes.evidence.id,
    lessonTags: ['evidence'],
    sortOrder: 0,
  });
  store.insertChoice({
    sceneId: scenes.rush.id,
    label: 'Approve the tag and go dark for the weekend',
    nextSceneId: scenes.ship.id,
    lessonTags: ['severity'],
    sortOrder: 0,
  });
  store.insertChoice({
    sceneId: scenes.evidence.id,
    label: 'Also add an edge-case check for slow networks',
    nextSceneId: scenes.edgeCheck.id,
    lessonTags: ['happy-vs-edge'],
    sortOrder: 0,
  });
  store.insertChoice({
    sceneId: scenes.evidence.id,
    label: 'Ship after the flake is explained in the ticket',
    nextSceneId: scenes.endingStrong.id,
    lessonTags: ['evidence', 'severity'],
    sortOrder: 1,
  });
  store.insertChoice({
    sceneId: scenes.edgeCheck.id,
    label: 'Land the stronger coverage and delay the tag',
    nextSceneId: scenes.endingStrong.id,
    lessonTags: ['happy-vs-edge', 'evidence'],
    sortOrder: 0,
  });
  store.insertChoice({
    sceneId: scenes.ship.id,
    label: 'Accept Monday firefighting as the cost of speed',
    nextSceneId: scenes.endingWeak.id,
    lessonTags: ['flake-risk', 'severity'],
    sortOrder: 0,
  });
}
