# Feature Specification: Quest Deck Week-1 MVP

**Feature id**: `001-quest-deck`  
**Created**: 2026-07-19  
**Status**: Approved  
**Delivery branch**: MVP ships on **`main`** (Spec Kit id `001-quest-deck` is the feature folder name, not a required git branch)  
**Input**: Migrated from approved Quest Deck portfolio design (2026-07-19); canonical SDD lives here under Spec Kit

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Practice interview cards with RPG progression (Priority: P1)

As a job seeker preparing for QA/SDET interviews, I sign in, open a seeded deck, practice a card (optional hint), rate confidence, and see XP / level / title / streak / XP-to-next-level update so daily prep feels sticky and useful.

**Why this priority**: Dual north star — this is the product the author uses; without it the repo is only a hollow test demo.

**Independent Test**: Login as admin **or** member → open Playwright deck → practice one card with Show hint → rate Learning → Home shows XP ≥ 10, streak ≥ 1, and an XP progress indicator toward the next level.

**Acceptance Scenarios**:

1. **Given** seeded users exist, **When** I sign in with `admin@lab.local` / `Admin123!` or `member@lab.local` / `Member123!`, **Then** I reach Home showing level, title, totalXp, XP toward next level, streak, and decks with mastery %.
2. **Given** I am on a Practice screen, **When** I click Show hint, **Then** I see the card’s `answerHint`.
3. **Given** I rate confidence `learning` on first practice of a card, **When** practice succeeds, **Then** I receive `xpAwarded` 10 and `currentStreak` becomes 1 (if first practice today after gap/null).
4. **Given** I previously rated `learning` and now rate `solid`, **When** I practice again, **Then** I receive `xpAwarded` 15 (improve bonus).
5. **Given** seeded data, **When** I sign in as member, **Then** I see all three seeded decks (member role) without a prior invite step.

---

### User Story 2 - Manage decks and invite a mentor (Priority: P2)

As deck admin, I create decks/cards and invite a member (mentor) so collaboration and relatedness work; as member I can practice but cannot delete the deck. Delete authz MUST use **deck membership role**, never global `users.role` alone.

**Why this priority**: Real multi-user risk for the quality system (RBAC) and relatedness for gamification.

**Independent Test**: Admin creates a temp deck, invites `member@lab.local` as member; member DELETE → 403; admin DELETE → 204. Separately: promote/invite as deck admin proves membership-based allow.

**Acceptance Scenarios**:

1. **Given** I am deck admin, **When** I create a deck, **Then** I am deck admin on that deck and it appears in my list.
2. **Given** I am deck admin, **When** I invite `member@lab.local` with role `member`, **Then** membership list includes that email/role.
3. **Given** I am deck member (not admin) on a deck, **When** I DELETE the deck via API or UI, **Then** I get 403 and the deck remains.
4. **Given** I am deck admin, **When** I DELETE the deck, **Then** I get 204 and the deck is gone.
5. **Given** a user whose global `users.role` is `member` but whose **deck membership** is `admin`, **When** they DELETE that deck, **Then** they get 204 (proves membership authz, not JWT/global role).

---

### User Story 3 - Prove quality ownership with layered tests & CI (Priority: P1)

As a hiring manager (or the author packaging the portfolio), I clone the repo, run smoke tests in ≤5 minutes, and see unit/API/E2E/cross-layer coverage of progression + RBAC with CI artifacts.

**Why this priority**: Equal to product usefulness for the job-search north star.

**Independent Test**: `yarn lint`, `yarn typecheck`, `yarn test:unit`, and `yarn test:smoke` pass locally; PR workflow runs lint + typecheck + unit + `@smoke`.

**Acceptance Scenarios**:

1. **Given** a fresh clone on Node 22+, **When** I follow README install steps, **Then** `@smoke` completes successfully.
2. **Given** the suite runs, **When** I inspect reports/tags, **Then** I can point to `@rbac`, `@progression`, and one cross-layer invite test.
3. **Given** a PR is opened, **When** CI runs, **Then** lint/typecheck/unit/`@smoke` must pass to merge.
4. **Given** push to `main`, **When** CI runs, **Then** the full Playwright suite runs and uploads an HTML report artifact.

---

### Edge Cases

- Bad password → 401 and visible UI error.
- Practice with invalid confidence → 400.
- Delete deck with no membership → 404.
- Streak: already practiced today → streak unchanged; gap day → streak resets to 1 on next practice (no read-time decay in MVP).
- Empty deck → mastery percent 0.
- Card edit/delete → out of MVP (create/list only).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST authenticate via email/password JWT for seeded users `admin@lab.local` / `Admin123!` and `member@lab.local` / `Member123!`.
- **FR-002**: System MUST provide Home progression via `GET /api/me`: `totalXp`, `level`, `title`, `currentStreak`, `xpIntoLevel`, `xpToNextLevel` using locked formulas in Assumptions. UI MUST show an XP progress bar (`xpIntoLevel` / 100).
- **FR-003**: System MUST support **deck** create / list / update / delete for deck admins; **card** create / list for deck admins; members may list decks/cards and practice. Card update/delete are **out of MVP**.
- **FR-004**: System MUST enforce deck delete only when **deck membership** role is `admin` (403 otherwise). MUST NOT authorize delete from global `users.role` alone.
- **FR-005**: System MUST support invite by email + role and list members.
- **FR-006**: System MUST record practice events awarding XP via domain rules and updating streak on practice only.
- **FR-007**: System MUST seed three decks (≥4 cards each): Playwright & E2E, API testing & authz, Behavioral (STAR), each with `answerHint`. Admin is deck `admin`; **`member@lab.local` is seeded as deck `member` on all three** so both accounts can prep immediately.
- **FR-008**: UI MUST expose accessible labels: Email, Password, Sign in, Deck name, Create deck, Invite, Delete deck, Show hint, Learning/Solid/Mastered.
- **FR-009**: Quality system MUST include Vitest unit tests for domain progression/RBAC, Playwright API/E2E/cross-layer with tags `@smoke` `@auth` `@rbac` `@mutation` `@progression`.
- **FR-010**: CI MUST run PR = lint + typecheck + unit + `@smoke`; `main` = full suite with Playwright HTML report artifact. T022 **replaces** the docs-only placeholder job (does not stack a second incomplete workflow).
- **FR-011**: `GET /api/decks` MUST include per-caller `masteryPercent` (0–100) from that user’s card confidences via `deckMasteryPercent`.
- **FR-012**: Project MUST provide `yarn lint` (ESLint) wired into local scripts and PR CI.

### Key Entities

- **User**: identity + aggregate XP/streak/lastPracticeDate (+ global role for seed/demo only)
- **Deck**: named quest container with owner
- **DeckMember**: per-deck role `admin` | `member` (authz source of truth)
- **Card**: prompt, answerHint, tags
- **CardProgress**: per-user confidence and practice count
- **PracticeEvent**: immutable XP award record

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Author can complete a real prep session on all three seeded decks including STAR with Show hint — as **admin or member** without manual invite first.
- **SC-002**: Stranger clones and runs `@smoke` in ≤5 minutes with documented Node ≥ 22.
- **SC-003**: At least one RBAC and one cross-layer test visible in CI/report; at least one test proves membership-based delete (not global role).
- **SC-004**: Resume-ready narrative: owned full-stack TS quality system on a gamified interview-prep app the author uses.

## Assumptions

- Progression formulas (locked):
  - Base XP +10; +5 if confidence strictly improves (`learning` < `solid` < `mastered`); first practice no improve bonus.
  - `level = floor(totalXp / 100) + 1`
  - Titles: 1–2 Apprentice; 3–5 Adventurer; 6–9 Challenger; 10–14 Veteran; 15+ Staff Contender
  - Streak updated only on practice (UTC `YYYY-MM-DD`): today → unchanged; yesterday → +1; null/older → 1
  - `xpIntoLevel = totalXp % 100`; `xpToNextLevel = xpIntoLevel === 0 ? 100 : 100 - xpIntoLevel` (bar fill = `xpIntoLevel`; at 0 XP and every exact level multiple the bar is empty for the next 100 XP)
- Practice answer **notes** are out of MVP (Show hint is enough for solo prep).
- Stack: Yarn workspaces, Fastify, SQLite, React/Vite, Vitest, Playwright, ESLint.
- Out of MVP: AI, boss fights, spaced-rep, streak freezes, leaderboards, OAuth, email, Postgres, Allure, axe, k6, Pact, card edit/delete.
