# QA Platform Lab — Quest Deck Portfolio Design

**Date:** 2026-07-19  
**Status:** Approved for planning  
**Repo:** [greatmindsinside/qa-platform-lab](https://github.com/greatmindsinside/qa-platform-lab) (public)  
**Working name:** `qa-platform-lab`  
**Product (AUT):** Quest Deck — gamified interview prep

## Goal

**North star (both required — neither is secondary):**

1. **Get the job** — a cloneable portfolio proof a hiring manager can run in ~5 minutes, demonstrating cohesive Quality Engineering system ownership (owned AUT + layered tests + CI gates + risk-based coverage + cross-layer validation).
2. **Prep for interviews** — a tool the author actually opens for practice: real QA/SDET question decks, confidence ratings, and light RPG progression that makes daily prep sticky.

If a feature helps the résumé but you would not use it to prep, cut it. If it helps prep but weakens the quality narrative (e.g. no authz risk), redesign it so both still win.

**Job-search outcomes:**

- Resume / LinkedIn: one system narrative for Senior/Staff QA Automation and Quality Platform roles
- Interview: 60-second walkthrough (RBAC + practice→XP domain rules + UI/API cross-layer + CI artifact) ending with “I use this to prep”
- Ongoing side project: MVP in ~1 week, then phased depth

## Decisions locked

| Topic | Choice |
| ----- | ------ |
| Outcome | Public portfolio proof (clone, run, understand quickly) |
| Cadence | Ongoing side project; MVP linkable in ~1 week |
| AUT strategy | Greenfield mini-product (own the app and the suite) |
| Product | **Quest Deck** — interview prep with RPG-lite progression |
| Domain | Decks, cards, practice ratings, XP/level/streak; invite mentor; admin-only deck delete |
| Stack | React + TypeScript UI; Node + TypeScript API (Fastify); SQLite (Postgres-ready) |
| Auth | JWT bearer; deck membership roles `admin` \| `member` for authz |
| Headline proof | Cross-layer invite + RBAC 403 on deck delete even if UI bypassed |
| Engineering | Spec-driven development; strict TypeScript; SOLID layering; DRY shared types; YAGNI; no code smells |
| Out of MVP scope | AI interviewer, boss fights, spaced-rep scheduler, streak freezes, leaderboards, billing, OAuth, email, multi-org, Allure, visual, a11y, k6, Pact, QA dashboard, self-healing |

## Spec-driven development

1. This document is the **source of truth** for product rules, API shape, quality gates, and non-goals.
2. The implementation plan must map **1:1** to requirements here; no feature lands without a spec line.
3. Domain rules (XP, level, streak, RBAC) are specified with exact formulas so unit tests can lock them.
4. Scope changes: update this spec → update the plan → then implement.

## Gamification philosophy

Grounded in Self-Determination Theory and patterns from successful learning apps (e.g. Duolingo):

| Need | RPG feel | MVP mechanic |
| ---- | -------- | ------------ |
| Competence | “I’m getting stronger” | XP, levels, titles, card confidence, deck % solid |
| Autonomy | “I choose my quest” | Pick deck/card freely; no forced path |
| Relatedness | “I’m not alone” | Invite mentor/partner as deck member |

**Design rules:**

- One tiny daily practice extends the streak (not a huge session).
- XP measures effort; confidence rating measures mastery — do not conflate them.
- Progress is visible on Home (level, title, XP to next level, streak).
- Respect the user: no dark-pattern punishment beyond a simple streak reset; no paywalls or loot boxes.
- Keep the product loop tiny so daily prep stays frictionless **and** the quality system remains easy to explain in an interview.

## Product (AUT)

### Core loop

```
Choose deck → Draw card → Answer (notes optional) → Rate confidence
        → Gain XP → Maybe level up / keep streak → See progress
```

### RPG progression (exact MVP rules)

| Mechanic | Rule |
| -------- | ---- |
| Base XP | +10 per practice event |
| Improve bonus | +5 if new confidence is strictly higher than previous for that user+card (`learning` < `solid` < `mastered`) |
| First practice | No improve bonus (no previous rating) |
| Level | `level = floor(totalXp / 100) + 1` |
| Title | Level 1–2 Apprentice; 3–5 Adventurer; 6–9 Challenger; 10–14 Veteran; 15+ Staff Contender |
| Streak | Updated **only on practice** (UTC calendar dates as `YYYY-MM-DD`): if `lastPracticeDate` is **today** → streak unchanged; if **yesterday** → `currentStreak + 1`; if **null or older** → `currentStreak = 1`. Then set `lastPracticeDate = today`. MVP does **not** decay the displayed streak on read when a day is missed (stale until next practice); Phase 2 may add read-time decay and/or streak freeze. |
| Card confidence | `learning` \| `solid` \| `mastered` |
| Deck progress | Percent of cards in deck where this user’s confidence is `solid` or `mastered` |

### MVP users and flows

1. Sign in (seeded `admin@lab.local` / `Admin123!`, `member@lab.local` / `Member123!`)
2. Home: see level, title, XP bar, streak, deck list with % solid
3. Create / edit decks and cards (admin on that deck)
4. Practice a card → XP toast → updated profile stats
5. Invite a member to a deck (role: admin \| member)
6. Guarded action: only **deck** admins can delete a deck (membership role)

### Seed content (day-1 usefulness)

MVP **must** ship three decks with real prompts the author would practice (minimum **4 cards each**):

1. **Playwright & E2E** — locators, flake, critical-path design
2. **API testing & authz** — 403 proofs, pyramid placement, contract vs E2E
3. **Behavioral (STAR)** — ownership, conflict, failure, mentoring (always asked in interviews)

Cards include `answerHint` so Practice can reveal a study cue after (or beside) the prompt — not an AI answer, just enough to make solo prep useful.

### Non-goals (product)

No AI answers, timers/boss mode, spaced repetition, streak freezes, leaderboards, billing, OAuth, real email, fancy UI, or multi-org tenancy.

## Domain model

| Entity | Responsibility |
| ------ | -------------- |
| User | Auth identity + aggregate XP/streak/lastPracticeDate |
| Deck | Named quest container |
| DeckMember | project-scoped role (`admin` \| `member`); creator is admin |
| Card | Interview prompt (+ optional answer hint, tags) |
| CardProgress | Per-user confidence and practice count |
| PracticeEvent | Immutable practice record (xp awarded, confidence, timestamp) |

### Pure domain functions (must be unit-tested)

```ts
canDeleteDeck(membershipRole: Role): boolean
confidenceRank(c: Confidence): number  // learning=0, solid=1, mastered=2
xpForPractice(prev: Confidence | null, next: Confidence): number
levelFromXp(totalXp: number): number
titleForLevel(level: number): string
nextStreak(args: { lastPracticeDate: string | null; todayUtc: string; currentStreak: number }): number
deckMasteryPercent(confidences: Confidence[]): number  // solid|mastered count / length; empty → 0
```

## API (MVP)

| Method | Path | Behavior |
| ------ | ---- | -------- |
| GET | `/api/health` | `{ ok: true }` |
| POST | `/api/auth/login` | `{ email, password }` → `{ token, user }` |
| GET | `/api/me` | Profile + `totalXp`, `level`, `title`, `currentStreak` |
| GET/POST | `/api/decks` | List (member of) / create (creator = deck admin) |
| PATCH/DELETE | `/api/decks/:id` | Update / delete (delete requires deck admin → else 403) |
| POST | `/api/decks/:id/invites` | `{ email, role }` (inviter must be deck admin) |
| GET | `/api/decks/:id/members` | Membership list |
| GET/POST | `/api/decks/:id/cards` | List / add cards |
| POST | `/api/cards/:id/practice` | `{ confidence }` → `{ xpAwarded, totalXp, level, title, currentStreak }` |

## UI screens

1. **Sign in** — Email, Password, button “Sign in”
2. **Home** — heading with progression; deck links
3. **Deck detail** — cards; “Practice”; admin: invite, add card, “Delete deck”
4. **Practice** — prompt; optional reveal of `answerHint`; rate confidence; show XP result

Accessible labels for E2E: Email, Password, Sign in, deck name fields, confidence controls, Delete deck, Invite, Show hint.

## Engineering standards

| Principle | Rule |
| --------- | ---- |
| TypeScript | `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`; no `any`; narrow before assert |
| S | One module, one reason to change |
| O | Extend via new pure functions / small modules |
| L | Domain types at boundaries; no SQLite leakage past data layer |
| I | Small stores (`UserStore`, `DeckStore`, `ProgressStore`) |
| D | `buildApp` composition root; inject DB path for tests |
| DRY | `@lab/shared` owns `Role`, `Confidence`, `SEED_USERS`, DTOs |
| YAGNI | No DI container, ORM, CQRS, AI |
| No smells | No circular imports; no XP in React; no global-role delete; no god files; no silent product catches |

**Layers:** `domain` → `data` → `application` → `http` · Web UI has its own thin client (does not import `@lab/testkit`).

## Test architecture

| Layer | Tool | Proves |
| ----- | ---- | ------ |
| Unit | Vitest | Domain rules (XP, level, streak, RBAC, mastery %) |
| API | Playwright request + Vitest inject | Auth, CRUD, practice XP, 403 delete |
| E2E | Playwright UI | Login + one practice journey |
| Cross-layer | Hybrid | UI invite → GET members confirms role |

### Week-1 MVP (must ship)

1. Seeded admin + member; **three** seeded QA decks (≥4 cards each, including Behavioral STAR)
2. Fixtures: `asAdmin`, `asMember`
3. Tags: `@smoke` `@auth` `@rbac` `@mutation` `@progression`
4. Specs: login happy/bad; create deck; practice awards XP; member delete → 403 / admin → 204; cross-layer invite
5. CI: PR = lint + typecheck + unit + `@smoke`; `main` = full suite; HTML report artifact
6. `docs/quality-architecture.md` — layers, tags, flake policy, non-goals, layered API note
7. README: problem, stack, CI badge, clone → install → `test:smoke` in 5 minutes

### Phase 2 (weeks 2–4)

- Streak freeze; optional spaced repetition; boss-run mode on same cards
- AJV/OpenAPI on mutating endpoints; axe smoke; `@flaky` quarantine; demo GIF/Loom

### Phase 3 (ongoing)

- Tiny QA ops page; optional k6; Postgres + migration tests; contract tests if packages split further

## Repo shape

```
apps/api/                 # Fastify + SQLite (domain → data → application → http)
apps/web/                 # React + TypeScript UI (Quest Deck)
packages/shared/          # Role, Confidence, DTOs, SEED_USERS
packages/testkit/         # ApiClient; re-exports shared
tests/unit/
tests/api/
tests/e2e/
tests/cross-layer/
docs/quality-architecture.md
docs/demo.md
.github/workflows/ci.yml
README.md
```

## CI gates

| Trigger | Jobs | Pass rule |
| ------- | ---- | --------- |
| PR | lint, typecheck, unit, Playwright `@smoke` | Must be green to merge |
| `main` | full API + E2E + cross-layer | Public CI badge tracks `main` |
| Failure | Playwright HTML report + traces | Linked from Actions run |

PR smoke target: under ~2 minutes.

## Job-search packaging

1. Pin public repo; feature on LinkedIn
2. Resume bullet:  
   *Designed and owned a full-stack TypeScript quality system (unit → API → E2E → cross-layer) with RBAC and progression-rule coverage for a gamified interview-prep app.*
3. Interview script: product risk → pyramid → practice XP unit tests → RBAC 403 → cross-layer invite → CI artifact → “I use this to prep”
4. Do **not** list Playwright / CI / API as separate skill projects
5. Do **not** claim this lab as employer production work

## Success criteria

**Useful prep tool**

- [ ] Author can run a real prep session on all three seeded decks (incl. STAR)
- [ ] Practice shows prompt + optional answer hint; confidence + XP/streak update on Home
- [ ] Author would choose this over a bare notes doc for a week of interview prep

**Job portfolio**

- [ ] Stranger can clone and run `@smoke` in ≤5 minutes (documented Node version)
- [ ] CI badge green on `main`
- [ ] At least one RBAC and one cross-layer test visible in report
- [ ] `docs/quality-architecture.md` explains the system in one sitting
- [ ] Resume/LinkedIn uses the system bullet above; demo script includes “I use this to prep”

## Implementation boundary

Implement in **this** repository. Keep personal job-search tooling (`job-application-copilot`) separate.
