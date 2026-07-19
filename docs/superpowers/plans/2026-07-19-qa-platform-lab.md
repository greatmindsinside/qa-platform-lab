# Quest Deck (Week-1 MVP) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build Quest Deck so it does two jobs at once: (1) a prep tool the author actually uses for QA/SDET interviews, and (2) a portfolio quality system hiring managers can clone and run in ≤5 minutes.

**Architecture:** Yarn workspaces with strict TypeScript. `@lab/shared` owns types and seed credentials. `apps/api` uses domain → data → application → http; pure functions own XP/level/streak/RBAC. `apps/web` is a thin React client. `packages/testkit` provides `ApiClient`. Root `tests/` holds Vitest + Playwright. Spec is source of truth: `docs/superpowers/specs/2026-07-19-qa-platform-lab-portfolio-design.md`.

**Tech Stack:** Node 22+, TypeScript 5 (strict), Fastify 5, better-sqlite3, jose, Vite 6, React 19, Vitest, Playwright, ESLint, GitHub Actions

## Global Constraints

- Spec: `docs/superpowers/specs/2026-07-19-qa-platform-lab-portfolio-design.md` (1:1 coverage required)
- **Dual north star:** every task must serve interview prep usefulness *and* the job-portfolio quality narrative — if only one is true, stop and redesign
- Repo root (already exists): `C:/Users/great/Desktop/Code/portfilo-qa/qa-platform-lab`
- Node **≥ 22**; package manager **yarn 1** (classic)
- Seed passwords: `admin@lab.local` / `Admin123!` and `member@lab.local` / `Member123!`
- Seed **three** decks (≥4 cards each): Playwright & E2E, API testing & authz, Behavioral (STAR)
- Deck delete authz uses **membership role**, not global `users.role`
- Progression formulas must match the spec exactly (XP +10 / +5 improve; level `floor(xp/100)+1`; titles; streak UTC rules)
- Practice UI must support **Show hint** (`answerHint`) so solo prep is useful
- MVP out of scope: AI, boss fights, spaced-rep, streak freezes, leaderboards, OAuth, email, Postgres, Allure, axe, k6, Pact
- Commit only when the user explicitly asks
- Prefer role/label Playwright locators over CSS
- No `any`; no XP math in React; no circular imports; web must not import `@lab/testkit`

---

## File structure

| Path | Responsibility |
| ---- | -------------- |
| `package.json` | Workspaces root + scripts |
| `tsconfig.base.json` | Shared strict TS |
| `packages/shared/src/index.ts` | `Role`, `Confidence`, DTOs, `SEED_USERS` |
| `apps/api/src/domain/rbac.ts` | `canDeleteDeck` |
| `apps/api/src/domain/progression.ts` | XP, level, title, streak, mastery % |
| `apps/api/src/data/db.ts` | open + migrate only |
| `apps/api/src/data/user-store.ts` | User persistence |
| `apps/api/src/data/deck-store.ts` | Deck, members, cards |
| `apps/api/src/data/progress-store.ts` | CardProgress, PracticeEvent |
| `apps/api/src/application/*.ts` | Auth, deck, practice services |
| `apps/api/src/http/*` | password, token, auth-guard, routes, http-error |
| `apps/api/src/seed.ts` | Users + QA decks/cards |
| `apps/api/src/app.ts` | Composition root |
| `apps/web/src/` | Login, Home, DeckDetail, Practice |
| `packages/testkit/src/index.ts` | `ApiClient` |
| `tests/unit/*.test.ts` | Domain + inject API |
| `tests/api|e2e|cross-layer/` | Playwright |
| `.github/workflows/ci.yml` | PR smoke / main full |
| `README.md`, `docs/quality-architecture.md`, `docs/demo.md` | Portfolio packaging |

---

### Task 1: Scaffold workspaces

**Files:**
- Create: `package.json`, `tsconfig.base.json`, `.gitignore`
- Create: `apps/api/package.json`, `apps/web/package.json`, `packages/shared/package.json`, `packages/testkit/package.json`
- Modify: `README.md` (stub)

**Interfaces:**
- Produces: workspaces `@lab/api`, `@lab/web`, `@lab/shared`, `@lab/testkit`

- [ ] **Step 1: Confirm repo**

```bash
cd "C:/Users/great/Desktop/Code/portfilo-qa/qa-platform-lab"
git status -sb
```

Expected: this repo; do not create a second clone.

- [ ] **Step 2: Write root `package.json`**

```json
{
  "name": "qa-platform-lab",
  "private": true,
  "workspaces": ["apps/*", "packages/*"],
  "scripts": {
    "dev:api": "yarn workspace @lab/api dev",
    "dev:web": "yarn workspace @lab/web dev",
    "dev": "yarn dev:api & yarn dev:web",
    "build": "yarn workspace @lab/shared build && yarn workspace @lab/api build && yarn workspace @lab/web build",
    "typecheck": "yarn workspace @lab/shared typecheck && yarn workspace @lab/api typecheck && yarn workspace @lab/web typecheck && yarn workspace @lab/testkit typecheck",
    "test:unit": "vitest run",
    "test:smoke": "playwright test --grep @smoke",
    "test:all": "vitest run && playwright test",
    "lint": "echo \"lint wired in Task 9\""
  },
  "devDependencies": {
    "typescript": "^5.8.2",
    "vitest": "^3.0.0",
    "@playwright/test": "^1.51.0"
  },
  "engines": { "node": ">=22" }
}
```

- [ ] **Step 3: Write `tsconfig.base.json` and `.gitignore`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitOverride": true,
    "noFallthroughCasesInSwitch": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  }
}
```

```
node_modules/
dist/
coverage/
test-results/
playwright-report/
blob-report/
*.db
*.db-journal
.env
.DS_Store
```

- [ ] **Step 4: Stub packages**

`packages/shared/package.json`:

```json
{
  "name": "@lab/shared",
  "version": "0.0.1",
  "private": true,
  "type": "module",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    }
  },
  "scripts": {
    "build": "tsc -p tsconfig.json",
    "typecheck": "tsc -p tsconfig.json --noEmit"
  }
}
```

`apps/api/package.json`:

```json
{
  "name": "@lab/api",
  "version": "0.0.1",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "build": "tsc -p tsconfig.json",
    "typecheck": "tsc -p tsconfig.json --noEmit",
    "start": "node dist/server.js"
  },
  "dependencies": { "@lab/shared": "0.0.1" }
}
```

Mirror `@lab/web` and `@lab/testkit` with `"type": "module"` and `typecheck`; testkit depends on `@lab/shared`.

- [ ] **Step 5: Install**

```bash
yarn install
```

Expected: lockfile; workspaces linked.

- [ ] **Step 6: Commit only if user asks**

---

### Task 2: Shared types + domain progression & RBAC (TDD)

**Files:**
- Create: `packages/shared/src/index.ts`, `packages/shared/tsconfig.json`
- Create: `apps/api/src/domain/rbac.ts`, `apps/api/src/domain/progression.ts`, `apps/api/tsconfig.json`
- Create: `vitest.config.ts`
- Test: `tests/unit/rbac.test.ts`, `tests/unit/progression.test.ts`

**Interfaces:**

```ts
// @lab/shared
export type Role = 'admin' | 'member';
export type Confidence = 'learning' | 'solid' | 'mastered';
export const SEED_USERS: readonly SeedUser[];
export function isRole(value: unknown): value is Role;
export function isConfidence(value: unknown): value is Confidence;

// domain
export function canDeleteDeck(membershipRole: Role): boolean;
export function confidenceRank(c: Confidence): number;
export function xpForPractice(prev: Confidence | null, next: Confidence): number;
export function levelFromXp(totalXp: number): number;
export function titleForLevel(level: number): string;
export function nextStreak(args: {
  lastPracticeDate: string | null;
  todayUtc: string;
  currentStreak: number;
}): number;
export function deckMasteryPercent(confidences: Confidence[]): number;
```

- [ ] **Step 1: Write failing tests**

```ts
// tests/unit/rbac.test.ts
import { describe, expect, it } from 'vitest';
import { canDeleteDeck } from '../../apps/api/src/domain/rbac.js';

describe('canDeleteDeck', () => {
  it('allows deck admin', () => {
    expect(canDeleteDeck('admin')).toBe(true);
  });
  it('denies deck member', () => {
    expect(canDeleteDeck('member')).toBe(false);
  });
});
```

```ts
// tests/unit/progression.test.ts
import { describe, expect, it } from 'vitest';
import {
  confidenceRank,
  deckMasteryPercent,
  levelFromXp,
  nextStreak,
  titleForLevel,
  xpForPractice,
} from '../../apps/api/src/domain/progression.js';

describe('xpForPractice', () => {
  it('awards 10 on first practice', () => {
    expect(xpForPractice(null, 'learning')).toBe(10);
  });
  it('awards 15 when confidence improves', () => {
    expect(xpForPractice('learning', 'solid')).toBe(15);
  });
  it('awards 10 when confidence does not improve', () => {
    expect(xpForPractice('solid', 'solid')).toBe(10);
    expect(xpForPractice('mastered', 'learning')).toBe(10);
  });
});

describe('levelFromXp / titleForLevel', () => {
  it('maps xp to level', () => {
    expect(levelFromXp(0)).toBe(1);
    expect(levelFromXp(99)).toBe(1);
    expect(levelFromXp(100)).toBe(2);
    expect(levelFromXp(250)).toBe(3);
  });
  it('maps level to title', () => {
    expect(titleForLevel(1)).toBe('Apprentice');
    expect(titleForLevel(3)).toBe('Adventurer');
    expect(titleForLevel(6)).toBe('Challenger');
    expect(titleForLevel(10)).toBe('Veteran');
    expect(titleForLevel(15)).toBe('Staff Contender');
  });
});

describe('nextStreak', () => {
  it('increments when last practice was yesterday', () => {
    expect(
      nextStreak({
        lastPracticeDate: '2026-07-18',
        todayUtc: '2026-07-19',
        currentStreak: 3,
      }),
    ).toBe(4);
  });
  it('unchanged when already practiced today', () => {
    expect(
      nextStreak({
        lastPracticeDate: '2026-07-19',
        todayUtc: '2026-07-19',
        currentStreak: 3,
      }),
    ).toBe(3);
  });
  it('resets to 1 after a gap', () => {
    expect(
      nextStreak({
        lastPracticeDate: '2026-07-10',
        todayUtc: '2026-07-19',
        currentStreak: 3,
      }),
    ).toBe(1);
  });
});

describe('deckMasteryPercent', () => {
  it('returns 0 for empty', () => {
    expect(deckMasteryPercent([])).toBe(0);
  });
  it('counts solid and mastered', () => {
    expect(deckMasteryPercent(['learning', 'solid', 'mastered'])).toBeCloseTo(66.666, 0);
  });
});

describe('confidenceRank', () => {
  it('orders learning < solid < mastered', () => {
    expect(confidenceRank('learning')).toBeLessThan(confidenceRank('solid'));
    expect(confidenceRank('solid')).toBeLessThan(confidenceRank('mastered'));
  });
});
```

- [ ] **Step 2: Run — expect FAIL**

```bash
yarn vitest run tests/unit/rbac.test.ts tests/unit/progression.test.ts
```

- [ ] **Step 3: Implement shared + domain**

```ts
// packages/shared/src/index.ts
export type Role = 'admin' | 'member';
export type Confidence = 'learning' | 'solid' | 'mastered';

export type SeedUser = {
  email: string;
  password: string;
  role: Role;
  displayName: string;
};

export const SEED_USERS = [
  {
    email: 'admin@lab.local',
    password: 'Admin123!',
    role: 'admin',
    displayName: 'Lab Admin',
  },
  {
    email: 'member@lab.local',
    password: 'Member123!',
    role: 'member',
    displayName: 'Lab Member',
  },
] as const satisfies readonly SeedUser[];

export type PublicUser = {
  id: number;
  email: string;
  role: Role;
  displayName: string;
};

export type Deck = {
  id: number;
  name: string;
  description: string;
  ownerUserId: number;
  masteryPercent?: number;
};

export type DeckMember = {
  deckId: number;
  userId: number;
  email: string;
  role: Role;
};

export type Card = {
  id: number;
  deckId: number;
  prompt: string;
  answerHint: string;
  tags: string[];
};

export function isRole(value: unknown): value is Role {
  return value === 'admin' || value === 'member';
}

export function isConfidence(value: unknown): value is Confidence {
  return value === 'learning' || value === 'solid' || value === 'mastered';
}
```

```ts
// apps/api/src/domain/rbac.ts
import type { Role } from '@lab/shared';

export function canDeleteDeck(membershipRole: Role): boolean {
  return membershipRole === 'admin';
}
```

```ts
// apps/api/src/domain/progression.ts
import type { Confidence } from '@lab/shared';

export function confidenceRank(c: Confidence): number {
  if (c === 'learning') return 0;
  if (c === 'solid') return 1;
  return 2;
}

export function xpForPractice(prev: Confidence | null, next: Confidence): number {
  const base = 10;
  if (prev !== null && confidenceRank(next) > confidenceRank(prev)) {
    return base + 5;
  }
  return base;
}

export function levelFromXp(totalXp: number): number {
  return Math.floor(totalXp / 100) + 1;
}

export function titleForLevel(level: number): string {
  if (level >= 15) return 'Staff Contender';
  if (level >= 10) return 'Veteran';
  if (level >= 6) return 'Challenger';
  if (level >= 3) return 'Adventurer';
  return 'Apprentice';
}

function utcDayBefore(todayUtc: string): string {
  const d = new Date(`${todayUtc}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

export function nextStreak(args: {
  lastPracticeDate: string | null;
  todayUtc: string;
  currentStreak: number;
}): number {
  const { lastPracticeDate, todayUtc, currentStreak } = args;
  if (lastPracticeDate === todayUtc) return currentStreak;
  if (lastPracticeDate === utcDayBefore(todayUtc)) return currentStreak + 1;
  return 1;
}

export function deckMasteryPercent(confidences: Confidence[]): number {
  if (confidences.length === 0) return 0;
  const mastered = confidences.filter((c) => c === 'solid' || c === 'mastered').length;
  return (mastered / confidences.length) * 100;
}
```

`packages/shared/tsconfig.json` and `apps/api/tsconfig.json` extend base with `outDir`/`rootDir`. Root `vitest.config.ts` includes `tests/unit/**/*.test.ts`.

```bash
yarn workspace @lab/shared build
```

- [ ] **Step 4: Run — expect PASS**

```bash
yarn vitest run tests/unit/rbac.test.ts tests/unit/progression.test.ts
```

- [ ] **Step 5: Commit only if user asks**

---

### Task 3: SQLite schema + seed (users + QA decks)

**Files:**
- Create: `apps/api/src/data/db.ts`, `apps/api/src/http/password.ts`, `apps/api/src/seed.ts`
- Modify: `apps/api/package.json` (better-sqlite3, bcryptjs, tsx, types)
- Test: `tests/unit/seed.test.ts`

**Interfaces:**

```ts
export type Db = import('better-sqlite3').Database;
export function openDb(path?: string): Db;
export function migrate(db: Db): void;
export function seed(db: Db): void;
```

- [ ] **Step 1: Add deps**

```bash
yarn workspace @lab/api add better-sqlite3 bcryptjs
yarn workspace @lab/api add -D @types/better-sqlite3 @types/bcryptjs tsx
```

- [ ] **Step 2: Write failing seed test**

```ts
// tests/unit/seed.test.ts
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { openDb, migrate } from '../../apps/api/src/data/db.js';
import { seed } from '../../apps/api/src/seed.js';

describe('seed', () => {
  const dbPath = path.join(os.tmpdir(), `lab-seed-${Date.now()}.db`);
  afterEach(() => {
    try {
      fs.unlinkSync(dbPath);
    } catch {
      /* test cleanup */
    }
  });

  it('inserts users and three QA decks with enough cards to practice', () => {
    const db = openDb(dbPath);
    migrate(db);
    seed(db);
    seed(db);
    const users = db.prepare('SELECT email FROM users ORDER BY email').all();
    expect(users).toEqual([
      { email: 'admin@lab.local' },
      { email: 'member@lab.local' },
    ]);
    const decks = db.prepare('SELECT name FROM decks ORDER BY name').all() as { name: string }[];
    expect(decks.length).toBeGreaterThanOrEqual(3);
    expect(decks.some((d) => /playwright/i.test(d.name))).toBe(true);
    expect(decks.some((d) => /api/i.test(d.name))).toBe(true);
    expect(decks.some((d) => /behavioral|star/i.test(d.name))).toBe(true);
    const cards = db.prepare('SELECT COUNT(*) AS c FROM cards').get() as { c: number };
    expect(cards.c).toBeGreaterThanOrEqual(12);
    db.close();
  });
});
```

- [ ] **Step 3: Run — expect FAIL**

```bash
yarn vitest run tests/unit/seed.test.ts
```

- [ ] **Step 4: Implement db + password + seed**

```ts
// apps/api/src/data/db.ts
import Database from 'better-sqlite3';
import path from 'node:path';

export type Db = Database.Database;

export function openDb(
  dbPath = process.env.LAB_DB_PATH ?? path.join(process.cwd(), 'lab.db'),
): Db {
  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  return db;
}

export function migrate(db: Db): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('admin','member')),
      display_name TEXT NOT NULL,
      total_xp INTEGER NOT NULL DEFAULT 0,
      current_streak INTEGER NOT NULL DEFAULT 0,
      last_practice_date TEXT
    );
    CREATE TABLE IF NOT EXISTS decks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      owner_user_id INTEGER NOT NULL REFERENCES users(id)
    );
    CREATE TABLE IF NOT EXISTS deck_members (
      deck_id INTEGER NOT NULL REFERENCES decks(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id),
      role TEXT NOT NULL CHECK(role IN ('admin','member')),
      PRIMARY KEY (deck_id, user_id)
    );
    CREATE TABLE IF NOT EXISTS cards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      deck_id INTEGER NOT NULL REFERENCES decks(id) ON DELETE CASCADE,
      prompt TEXT NOT NULL,
      answer_hint TEXT NOT NULL DEFAULT '',
      tags TEXT NOT NULL DEFAULT '[]'
    );
    CREATE TABLE IF NOT EXISTS card_progress (
      user_id INTEGER NOT NULL REFERENCES users(id),
      card_id INTEGER NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
      confidence TEXT NOT NULL CHECK(confidence IN ('learning','solid','mastered')),
      practice_count INTEGER NOT NULL DEFAULT 0,
      last_practiced_at TEXT,
      PRIMARY KEY (user_id, card_id)
    );
    CREATE TABLE IF NOT EXISTS practice_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      card_id INTEGER NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
      confidence TEXT NOT NULL,
      xp_awarded INTEGER NOT NULL,
      practiced_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
}
```

```ts
// apps/api/src/http/password.ts
import bcrypt from 'bcryptjs';

export function hashPassword(plain: string): string {
  return bcrypt.hashSync(plain, 8);
}

export function verifyPassword(plain: string, hash: string): boolean {
  return bcrypt.compareSync(plain, hash);
}
```

```ts
// apps/api/src/seed.ts
import { SEED_USERS } from '@lab/shared';
import type { Db } from './data/db.js';
import { hashPassword } from './http/password.js';

const SEED_DECKS = [
  {
    name: 'Playwright & E2E',
    description: 'UI automation interview prompts you will actually rehearse',
    cards: [
      {
        prompt: 'How do you choose between role/label locators and CSS selectors in Playwright?',
        answerHint: 'Prefer role/label for resilience; CSS when no accessible name exists.',
        tags: ['playwright', 'locators'],
      },
      {
        prompt: 'What makes an E2E test flaky, and how do you quarantine vs fix?',
        answerHint: 'Races and shared state; tag @flaky, own a fix-within-a-week policy.',
        tags: ['flake', 'process'],
      },
      {
        prompt: 'How do you keep E2E coverage thin without losing confidence?',
        answerHint: 'Critical journeys only; push rules to unit/API; use tags for smoke.',
        tags: ['pyramid'],
      },
      {
        prompt: 'Walk through debugging a failing Playwright test in CI with traces.',
        answerHint: 'Reproduce locally, open trace, isolate selector vs timing vs data.',
        tags: ['ci', 'debug'],
      },
    ],
  },
  {
    name: 'API testing & authz',
    description: 'HTTP and authorization prompts for SDET / quality platform interviews',
    cards: [
      {
        prompt: 'How do you prove a 403 is enforced server-side, not only hidden in the UI?',
        answerHint: 'Call the API as a non-admin; assert status and that the row still exists.',
        tags: ['api', 'rbac'],
      },
      {
        prompt: 'What belongs in API tests vs E2E for an invite-member flow?',
        answerHint: 'API: contract/authz; E2E: critical UI path; cross-layer: UI then API assert.',
        tags: ['pyramid'],
      },
      {
        prompt: 'How do you design fixtures so API tests stay deterministic?',
        answerHint: 'Isolated DB per run or reset helpers; seed known users; no shared mutable state.',
        tags: ['fixtures'],
      },
      {
        prompt: 'When would you add schema/contract checks on mutating endpoints?',
        answerHint: 'After smoke is green; AJV/OpenAPI on writes catches drift before UI flakes.',
        tags: ['contract'],
      },
    ],
  },
  {
    name: 'Behavioral (STAR)',
    description: 'Stories interviewers always ask — rehearse out loud',
    cards: [
      {
        prompt: 'Tell me about a time you owned quality for a risky release.',
        answerHint: 'Situation → risk → your gate (tests/CI) → outcome → what you learned.',
        tags: ['star', 'ownership'],
      },
      {
        prompt: 'Describe a conflict with engineering about shipping without enough tests.',
        answerHint: 'STAR: align on risk, propose a thinner smoke gate, measure escape defects.',
        tags: ['star', 'conflict'],
      },
      {
        prompt: 'Tell me about a failure or escaped bug and what you changed afterward.',
        answerHint: 'Own the miss; add a regression; change process (tag, review, env) not blame.',
        tags: ['star', 'failure'],
      },
      {
        prompt: 'How have you mentored others or improved the team’s test design?',
        answerHint: 'Concrete enablement: fixtures, guidelines, pairing, measurable flake drop.',
        tags: ['star', 'mentoring'],
      },
    ],
  },
] as const;

export function seed(db: Db): void {
  const insertUser = db.prepare(
    `INSERT OR IGNORE INTO users (email, password_hash, role, display_name)
     VALUES (@email, @password_hash, @role, @display_name)`,
  );
  for (const u of SEED_USERS) {
    insertUser.run({
      email: u.email,
      password_hash: hashPassword(u.password),
      role: u.role,
      display_name: u.displayName,
    });
  }

  const admin = db.prepare(`SELECT id FROM users WHERE email = ?`).get('admin@lab.local') as
    | { id: number }
    | undefined;
  if (!admin) return;

  const deckExists = db.prepare(`SELECT id FROM decks WHERE name = ?`);
  const insertDeck = db.prepare(
    `INSERT INTO decks (name, description, owner_user_id) VALUES (?, ?, ?)`,
  );
  const insertMember = db.prepare(
    `INSERT OR IGNORE INTO deck_members (deck_id, user_id, role) VALUES (?, ?, 'admin')`,
  );
  const insertCard = db.prepare(
    `INSERT INTO cards (deck_id, prompt, answer_hint, tags) VALUES (?, ?, ?, ?)`,
  );

  for (const deck of SEED_DECKS) {
    if (deckExists.get(deck.name)) continue;
    const info = insertDeck.run(deck.name, deck.description, admin.id);
    const deckId = Number(info.lastInsertRowid);
    insertMember.run(deckId, admin.id);
    for (const card of deck.cards) {
      insertCard.run(deckId, card.prompt, card.answerHint, JSON.stringify(card.tags));
    }
  }
}
```

**Smell check:** `db.ts` must not import `seed.ts`.

- [ ] **Step 5: Run — expect PASS**

```bash
yarn vitest run tests/unit/seed.test.ts
```

- [ ] **Step 6: Commit only if user asks**

---

### Task 4: Stores, services, HTTP API (TDD via Fastify inject)

**Files:**
- Create: `apps/api/src/data/user-store.ts`, `deck-store.ts`, `progress-store.ts`
- Create: `apps/api/src/application/auth-service.ts`, `deck-service.ts`, `practice-service.ts`
- Create: `apps/api/src/http/token.ts`, `auth-guard.ts`, `http-error.ts`, `routes/*.ts`
- Create: `apps/api/src/app.ts`, `server.ts`
- Modify: deps `fastify`, `@fastify/cors`, `jose`
- Test: `tests/unit/api-quest-deck.test.ts`

**Interfaces:**

```ts
export function buildApp(opts?: { dbPath?: string }): Promise<import('fastify').FastifyInstance>;
// Routes per spec API table (health, login, me, decks CRUD, invites, members, cards, practice)
```

- [ ] **Step 1: Install**

```bash
yarn workspace @lab/api add fastify @fastify/cors jose
```

- [ ] **Step 2: Write failing API tests**

```ts
// tests/unit/api-quest-deck.test.ts
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { buildApp } from '../../apps/api/src/app.js';

describe('Quest Deck API', () => {
  let dbPath: string;
  let app: Awaited<ReturnType<typeof buildApp>>;

  beforeEach(async () => {
    dbPath = path.join(os.tmpdir(), `lab-api-${Date.now()}.db`);
    app = await buildApp({ dbPath });
  });

  afterEach(async () => {
    await app.close();
    try {
      fs.unlinkSync(dbPath);
    } catch {
      /* test cleanup */
    }
  });

  async function login(email: string, password: string) {
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { email, password },
    });
    expect(res.statusCode).toBe(200);
    return res.json() as { token: string };
  }

  it('GET /api/health', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/health' });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ ok: true });
  });

  it('logs in and returns me with level/title', async () => {
    const { token } = await login('admin@lab.local', 'Admin123!');
    const me = await app.inject({
      method: 'GET',
      url: '/api/me',
      headers: { authorization: `Bearer ${token}` },
    });
    expect(me.statusCode).toBe(200);
    expect(me.json()).toMatchObject({
      email: 'admin@lab.local',
      totalXp: 0,
      level: 1,
      title: 'Apprentice',
      currentStreak: 0,
    });
  });

  it('rejects bad password', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { email: 'admin@lab.local', password: 'wrong' },
    });
    expect(res.statusCode).toBe(401);
  });

  it('practices a card and awards XP', async () => {
    const { token } = await login('admin@lab.local', 'Admin123!');
    const decks = await app.inject({
      method: 'GET',
      url: '/api/decks',
      headers: { authorization: `Bearer ${token}` },
    });
    const deckId = (decks.json() as { id: number }[])[0]!.id;
    const cards = await app.inject({
      method: 'GET',
      url: `/api/decks/${deckId}/cards`,
      headers: { authorization: `Bearer ${token}` },
    });
    const cardId = (cards.json() as { id: number }[])[0]!.id;
    const practice = await app.inject({
      method: 'POST',
      url: `/api/cards/${cardId}/practice`,
      headers: { authorization: `Bearer ${token}` },
      payload: { confidence: 'learning' },
    });
    expect(practice.statusCode).toBe(200);
    expect(practice.json()).toMatchObject({
      xpAwarded: 10,
      totalXp: 10,
      level: 1,
      title: 'Apprentice',
      currentStreak: 1,
    });
  });

  it('member cannot delete deck (403); admin can (204)', async () => {
    const admin = await login('admin@lab.local', 'Admin123!');
    const created = await app.inject({
      method: 'POST',
      url: '/api/decks',
      headers: { authorization: `Bearer ${admin.token}` },
      payload: { name: `Temp-${Date.now()}`, description: '' },
    });
    const deckId = (created.json() as { id: number }).id;
    await app.inject({
      method: 'POST',
      url: `/api/decks/${deckId}/invites`,
      headers: { authorization: `Bearer ${admin.token}` },
      payload: { email: 'member@lab.local', role: 'member' },
    });
    const member = await login('member@lab.local', 'Member123!');
    const denied = await app.inject({
      method: 'DELETE',
      url: `/api/decks/${deckId}`,
      headers: { authorization: `Bearer ${member.token}` },
    });
    expect(denied.statusCode).toBe(403);
    const allowed = await app.inject({
      method: 'DELETE',
      url: `/api/decks/${deckId}`,
      headers: { authorization: `Bearer ${admin.token}` },
    });
    expect(allowed.statusCode).toBe(204);
  });
});
```

- [ ] **Step 3: Run — expect FAIL**

```bash
yarn vitest run tests/unit/api-quest-deck.test.ts
```

- [ ] **Step 4: Implement layered API**

Required pieces (keep files focused; no XP math in routes):

```ts
// apps/api/src/http/http-error.ts
export class HttpError extends Error {
  constructor(
    message: string,
    readonly statusCode: number,
  ) {
    super(message);
  }
}
```

```ts
// apps/api/src/http/token.ts
import { SignJWT, jwtVerify } from 'jose';
import { isRole, type Role } from '@lab/shared';

export type AccessTokenClaims = { sub: string; role: Role; email: string };

const secret = () =>
  new TextEncoder().encode(process.env.LAB_JWT_SECRET ?? 'lab-dev-secret-change-me');

export async function signToken(claims: AccessTokenClaims): Promise<string> {
  return new SignJWT({ role: claims.role, email: claims.email })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(claims.sub)
    .setExpirationTime('8h')
    .sign(secret());
}

export async function verifyToken(token: string): Promise<AccessTokenClaims> {
  const { payload } = await jwtVerify(token, secret());
  if (!payload.sub || !isRole(payload.role) || typeof payload.email !== 'string') {
    throw new HttpError('Invalid token', 401);
  }
  return { sub: String(payload.sub), role: payload.role, email: payload.email };
}
```

`PracticeService.practice(userId, cardId, confidence)` must:
1. Load previous `CardProgress.confidence` or null
2. `xp = xpForPractice(prev, next)`
3. Upsert progress; insert `practice_events`
4. Update user `total_xp`, `current_streak` via `nextStreak`, `last_practice_date`
5. Return `{ xpAwarded, totalXp, level: levelFromXp(...), title: titleForLevel(...), currentStreak }`

`DeckService.delete`: `getMembership` → `canDeleteDeck` → else 403; missing → 404.

`buildApp`: openDb → migrate → seed → construct stores/services → register CORS + routes.

`server.ts`: listen on `PORT` default 3333.

- [ ] **Step 5: Run — expect PASS**

```bash
yarn vitest run tests/unit/api-quest-deck.test.ts
```

- [ ] **Step 6: Commit only if user asks**

---

### Task 5: testkit + Playwright API (`@smoke` / `@rbac` / `@progression`)

**Files:**
- Create: `packages/testkit/src/index.ts`, `packages/testkit/tsconfig.json`
- Create: `playwright.config.ts`
- Create: `tests/api/auth.spec.ts`, `tests/api/rbac-delete.spec.ts`, `tests/api/practice-xp.spec.ts`
- Create: minimal Vite stub in `apps/web` for webServer health

**Interfaces:**

```ts
export class ApiClient {
  constructor(baseURL: string, token?: string)
  withToken(token: string): ApiClient
  login(email: string, password: string): Promise<{ token: string }>
  me(): Promise<{ totalXp: number; level: number; title: string; currentStreak: number }>
  listDecks(): Promise<import('@lab/shared').Deck[]>
  createDeck(name: string, description?: string): Promise<import('@lab/shared').Deck>
  invite(deckId: number, email: string, role: import('@lab/shared').Role): Promise<void>
  deleteDeck(deckId: number): Promise<{ status: number }>
  getMembers(deckId: number): Promise<import('@lab/shared').DeckMember[]>
  listCards(deckId: number): Promise<import('@lab/shared').Card[]>
  practice(cardId: number, confidence: import('@lab/shared').Confidence): Promise<{
    xpAwarded: number; totalXp: number; level: number; title: string; currentStreak: number
  }>
}
```

- [ ] **Step 1: Implement `ApiClient` with `fetch`** (full methods above; re-export `SEED_USERS` from `@lab/shared`)

- [ ] **Step 2: `playwright.config.ts`**

```ts
import { defineConfig } from '@playwright/test';

const API = process.env.LAB_API_URL ?? 'http://127.0.0.1:3333';
const WEB = process.env.LAB_WEB_URL ?? 'http://127.0.0.1:5173';

export default defineConfig({
  testDir: './tests',
  timeout: 30_000,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: { trace: 'on-first-retry' },
  projects: [
    { name: 'api', testMatch: /tests\/api\/.*\.spec\.ts/ },
    { name: 'e2e', testMatch: /tests\/e2e\/.*\.spec\.ts/, use: { baseURL: WEB } },
    { name: 'cross-layer', testMatch: /tests\/cross-layer\/.*\.spec\.ts/, use: { baseURL: WEB } },
  ],
  webServer: [
    {
      command: 'yarn workspace @lab/api dev',
      url: `${API}/api/health`,
      reuseExistingServer: !process.env.CI,
      env: { PORT: '3333', LAB_DB_PATH: './test-lab.db' },
    },
    {
      command: 'yarn workspace @lab/web dev --host 127.0.0.1 --port 5173',
      url: WEB,
      reuseExistingServer: !process.env.CI,
    },
  ],
});
```

- [ ] **Step 3: API specs**

```ts
// tests/api/auth.spec.ts
import { test, expect } from '@playwright/test';
import { ApiClient, SEED_USERS } from '@lab/testkit';

const base = process.env.LAB_API_URL ?? 'http://127.0.0.1:3333';

test('login happy @smoke @auth', async () => {
  const admin = SEED_USERS.find((u) => u.role === 'admin');
  if (!admin) throw new Error('missing admin');
  const { token } = await new ApiClient(base).login(admin.email, admin.password);
  expect(token).toBeTruthy();
});

test('login bad password @auth', async ({ request }) => {
  const res = await request.post(`${base}/api/auth/login`, {
    data: { email: 'admin@lab.local', password: 'nope' },
  });
  expect(res.status()).toBe(401);
});
```

```ts
// tests/api/rbac-delete.spec.ts
import { test, expect } from '@playwright/test';
import { ApiClient, SEED_USERS } from '@lab/testkit';

const base = process.env.LAB_API_URL ?? 'http://127.0.0.1:3333';

test('member delete forbidden; admin delete ok @smoke @rbac @mutation', async () => {
  const adminUser = SEED_USERS.find((u) => u.role === 'admin');
  const memberUser = SEED_USERS.find((u) => u.role === 'member');
  if (!adminUser || !memberUser) throw new Error('missing seed');
  const admin = new ApiClient(base).withToken(
    (await new ApiClient(base).login(adminUser.email, adminUser.password)).token,
  );
  const deck = await admin.createDeck(`rbac-${Date.now()}`);
  await admin.invite(deck.id, memberUser.email, 'member');
  const member = new ApiClient(base).withToken(
    (await new ApiClient(base).login(memberUser.email, memberUser.password)).token,
  );
  expect((await member.deleteDeck(deck.id)).status).toBe(403);
  expect((await admin.deleteDeck(deck.id)).status).toBe(204);
});
```

```ts
// tests/api/practice-xp.spec.ts
import { test, expect } from '@playwright/test';
import { ApiClient, SEED_USERS } from '@lab/testkit';

const base = process.env.LAB_API_URL ?? 'http://127.0.0.1:3333';

test('practice awards XP @smoke @progression @mutation', async () => {
  const adminUser = SEED_USERS.find((u) => u.role === 'admin');
  if (!adminUser) throw new Error('missing admin');
  const client = new ApiClient(base).withToken(
    (await new ApiClient(base).login(adminUser.email, adminUser.password)).token,
  );
  const decks = await client.listDecks();
  const cards = await client.listCards(decks[0]!.id);
  const before = await client.me();
  const result = await client.practice(cards[0]!.id, 'learning');
  expect(result.xpAwarded).toBe(10);
  expect(result.totalXp).toBe(before.totalXp + 10);
  expect(result.currentStreak).toBeGreaterThanOrEqual(1);
});
```

- [ ] **Step 4: Vite stub** so `http://127.0.0.1:5173` returns 200 (full UI in Task 6)

- [ ] **Step 5: Run**

```bash
yarn playwright test --project=api --grep @smoke
```

Expected: PASS.

- [ ] **Step 6: Commit only if user asks**

---

### Task 6: React UI (Quest Deck)

**Files:**
- Create: `apps/web/src/main.tsx`, `App.tsx`, `lib/api.ts`, `pages/LoginPage.tsx`, `HomePage.tsx`, `DeckDetailPage.tsx`, `PracticePage.tsx`
- Modify: `apps/web` deps (react, vite, `@lab/shared`)

**Interfaces:**
- Thin UI client only (sessionStorage token); types from `@lab/shared`; **no** `@lab/testkit`
- Labels: Email, Password, Sign in; Home shows level/title/streak/XP; Delete deck; Invite; confidence buttons Learning / Solid / Mastered; **Show hint** reveals `answerHint`
- Practice flow must feel usable for real prep (prompt → think → optional hint → rate), not a hollow demo shell

- [ ] **Step 1: Add web deps + Vite proxy `/api` → `http://127.0.0.1:3333`**

```bash
yarn workspace @lab/web add react react-dom @lab/shared
yarn workspace @lab/web add -D vite @vitejs/plugin-react typescript @types/react @types/react-dom
```

- [ ] **Step 2: Implement `lib/api.ts`** — login, me, listDecks, createDeck, listCards, practice, invite, deleteDeck, getMembers (throw with status on failure)

- [ ] **Step 3: Implement pages**

- Login → Home on success  
- Home: progression header + deck links (`%` solid if API provides) + create deck  
- Deck detail: card list, Practice link, admin Invite + Delete deck (403 message)  
- Practice: show prompt; button **Show hint** reveals `answerHint`; confidence controls; show `xpAwarded` after submit  

Minimal CSS.

- [ ] **Step 4: Manual smoke (prep usefulness check)**

```bash
yarn dev:api
yarn dev:web
```

As admin: open Behavioral (STAR), practice one card with hint, confirm XP/streak. Invite member; confirm delete 403 as member. Ask: “Would I use this tomorrow morning before interviews?” If no, fix UX before moving on.

- [ ] **Step 5: Commit only if user asks**

---

### Task 7: E2E Playwright UI

**Files:**
- Create: `tests/fixtures/lab.ts`, `tests/e2e/login.spec.ts`, `tests/e2e/practice.spec.ts`

**Interfaces:**

```ts
export const test = base.extend<{ asAdmin: void; asMember: void }>({ /* login helpers */ });
```

- [ ] **Step 1: Fixtures**

```ts
// tests/fixtures/lab.ts
import { test as base, expect } from '@playwright/test';
import { SEED_USERS } from '@lab/testkit';

export const test = base.extend<{ asAdmin: void; asMember: void }>({
  asAdmin: async ({ page }, use) => {
    const admin = SEED_USERS.find((u) => u.role === 'admin');
    if (!admin) throw new Error('missing admin');
    await page.goto('/login');
    await page.getByLabel('Email').fill(admin.email);
    await page.getByLabel('Password').fill(admin.password);
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page.getByText(/Apprentice|Adventurer|Challenger|Veteran|Staff Contender/)).toBeVisible();
    await use();
  },
  asMember: async ({ page }, use) => {
    const member = SEED_USERS.find((u) => u.role === 'member');
    if (!member) throw new Error('missing member');
    await page.goto('/login');
    await page.getByLabel('Email').fill(member.email);
    await page.getByLabel('Password').fill(member.password);
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page.getByText(/Apprentice|Adventurer|Challenger|Veteran|Staff Contender/)).toBeVisible();
    await use();
  },
});
export { expect };
```

- [ ] **Step 2: Specs**

```ts
// tests/e2e/login.spec.ts
import { test, expect } from '../fixtures/lab.js';

test('admin login @smoke @auth', async ({ page, asAdmin }) => {
  await expect(page.getByText(/Apprentice|Adventurer|Challenger|Veteran|Staff Contender/)).toBeVisible();
});

test('bad password shows error @auth', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Email').fill('admin@lab.local');
  await page.getByLabel('Password').fill('wrong');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page.getByText(/invalid|unauthorized|failed/i)).toBeVisible();
});
```

```ts
// tests/e2e/practice.spec.ts
import { test, expect } from '../fixtures/lab.js';

test('practice awards XP in UI @smoke @progression @mutation', async ({ page, asAdmin }) => {
  await page.getByRole('link', { name: /Playwright/i }).click();
  await page.getByRole('link', { name: /Practice/i }).first().click();
  await page.getByRole('button', { name: 'Learning' }).click();
  await expect(page.getByText(/xp|\+10/i)).toBeVisible();
});
```

- [ ] **Step 3: Run**

```bash
yarn playwright test --project=e2e --grep @smoke
```

Expected: PASS.

- [ ] **Step 4: Commit only if user asks**

---

### Task 8: Cross-layer invite

**Files:**
- Create: `tests/cross-layer/invite.spec.ts`

- [ ] **Step 1: Spec**

```ts
import { test, expect } from '../fixtures/lab.js';
import { ApiClient, SEED_USERS } from '@lab/testkit';

const apiBase = process.env.LAB_API_URL ?? 'http://127.0.0.1:3333';

test('invite member in UI appears in API @smoke @mutation', async ({ page, asAdmin }) => {
  const name = `XL-${Date.now()}`;
  await page.getByLabel('Deck name').fill(name);
  await page.getByRole('button', { name: 'Create deck' }).click();
  await page.getByRole('link', { name }).click();
  await page.getByLabel('Invite email').fill('member@lab.local');
  await page.getByLabel('Role').selectOption('member');
  await page.getByRole('button', { name: 'Invite' }).click();
  await expect(page.getByText('member@lab.local')).toBeVisible();

  const admin = SEED_USERS.find((u) => u.role === 'admin');
  if (!admin) throw new Error('missing admin');
  const token = (await new ApiClient(apiBase).login(admin.email, admin.password)).token;
  const client = new ApiClient(apiBase, token);
  const decks = await client.listDecks();
  const deck = decks.find((d) => d.name === name);
  expect(deck).toBeTruthy();
  const members = await client.getMembers(deck!.id);
  expect(members.some((m) => m.email === 'member@lab.local' && m.role === 'member')).toBe(true);
});
```

Home must expose create-deck controls with labels **Deck name** and button **Create deck** (add in Task 6 if missing).

- [ ] **Step 2: Run**

```bash
yarn playwright test --project=cross-layer --grep @smoke
```

Expected: PASS.

- [ ] **Step 3: Commit only if user asks**

---

### Task 9: CI + portfolio docs

**Files:**
- Create: `.github/workflows/ci.yml`, `docs/quality-architecture.md`, `docs/demo.md`
- Modify: `README.md`, lint script if lightweight

- [ ] **Step 1: CI**

```yaml
name: ci
on:
  pull_request:
  push:
    branches: [main]
jobs:
  pr-smoke:
    if: github.event_name == 'pull_request'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '22', cache: yarn }
      - run: yarn install --frozen-lockfile
      - run: yarn workspace @lab/shared build
      - run: yarn typecheck
      - run: yarn test:unit
      - run: npx playwright install --with-deps chromium
      - run: yarn test:smoke
      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
  main-full:
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '22', cache: yarn }
      - run: yarn install --frozen-lockfile
      - run: yarn workspace @lab/shared build
      - run: yarn typecheck
      - run: yarn test:unit
      - run: npx playwright install --with-deps chromium
      - run: yarn playwright test
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

- [ ] **Step 2: `docs/quality-architecture.md`** — pyramid, tags (`@smoke` `@auth` `@rbac` `@mutation` `@progression`), flake policy, non-goals, PR vs main, layered API note, progression rules owned by domain module

- [ ] **Step 3: `docs/demo.md`** — 60s: CI badge → `xpForPractice` unit test → `@rbac` 403 → practice XP → cross-layer invite → UI practice on STAR deck → close with “I use this to prep”

- [ ] **Step 4: README** — Lead with dual purpose: (1) Quest Deck prep tool you can run locally, (2) owned quality system for hiring managers. Include resume bullet from spec; Node 22+; CI badge `greatmindsinside/qa-platform-lab`; how to start a prep session (`yarn dev`) and how to run `@smoke`.

```bash
yarn install
yarn workspace @lab/shared build
yarn test:unit
yarn test:smoke
```

- [ ] **Step 5: Local gate**

```bash
yarn typecheck
yarn test:unit
npx playwright install chromium
yarn test:smoke
yarn playwright test
```

Expected: all green.

- [ ] **Step 6: Commit only if user asks**

---

## Out of scope (Phase 2+)

Streak freeze, spaced repetition, boss runs, AJV/OpenAPI, axe, k6, Pact, Postgres, QA ops page — per spec only.

---

## Spec coverage self-check

| Spec requirement | Task |
| ---------------- | ---- |
| Dual north star (job + real prep) | Global + Tasks 3, 6, 9 |
| Quest Deck product + RPG formulas | 2, 4, 6 |
| Three seeded QA decks (≥4 cards, STAR required) | 3 |
| Practice Show hint / answerHint | 6, 7 |
| API table (health→practice) | 4 |
| UI screens + labels | 6, 7, 8 |
| Unit progression + RBAC | 2 |
| API / E2E / cross-layer + tags | 5, 7, 8 |
| Fixtures asAdmin/asMember | 7 |
| CI PR smoke / main full | 9 |
| quality-architecture + demo + README | 9 |
| SOLID layers + `@lab/shared` | 1–4 |
| Spec-driven / no MVP non-goals | Global + Out of scope |

**Placeholder scan:** none. **Type consistency:** decks/cards/practice; membership delete via `canDeleteDeck`; XP formulas match spec. **Dual-goal check:** seed content is rehearsable interview material; quality layers still prove RBAC + progression + cross-layer.
