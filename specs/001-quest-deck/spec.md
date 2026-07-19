# Feature Specification: Quest Deck Week-1 MVP

**Feature Branch**: `001-quest-deck`  
**Created**: 2026-07-19  
**Status**: Approved  
**Input**: Migrated from approved Quest Deck portfolio design (2026-07-19); canonical SDD lives here under Spec Kit

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Practice interview cards with RPG progression (Priority: P1)

As a job seeker preparing for QA/SDET interviews, I sign in, open a seeded deck, practice a card (optional hint), rate confidence, and see XP / level / title / streak update so daily prep feels sticky and useful.

**Why this priority**: Dual north star — this is the product the author uses; without it the repo is only a hollow test demo.

**Independent Test**: Login as admin → open Playwright deck → practice one card with Show hint → rate Learning → Home shows XP ≥ 10 and streak ≥ 1.

**Acceptance Scenarios**:

1. **Given** seeded users exist, **When** I sign in with `admin@lab.local` / `Admin123!`, **Then** I reach Home showing level, title, XP, and streak.
2. **Given** I am on a Practice screen, **When** I click Show hint, **Then** I see the card’s `answerHint`.
3. **Given** I rate confidence `learning` on first practice of a card, **When** practice succeeds, **Then** I receive `xpAwarded` 10 and `currentStreak` becomes 1 (if first practice today after gap/null).
4. **Given** I previously rated `learning` and now rate `solid`, **When** I practice again, **Then** I receive `xpAwarded` 15 (improve bonus).

---

### User Story 2 - Manage decks and invite a mentor (Priority: P2)

As deck admin, I create decks/cards and invite a member (mentor) so collaboration and relatedness work; as member I can practice but cannot delete the deck.

**Why this priority**: Real multi-user risk for the quality system (RBAC) and relatedness for gamification.

**Independent Test**: Admin creates deck, invites `member@lab.local` as member; member DELETE returns 403; admin DELETE returns 204.

**Acceptance Scenarios**:

1. **Given** I am deck admin, **When** I create a deck, **Then** I am deck admin on that deck and it appears in my list.
2. **Given** I am deck admin, **When** I invite `member@lab.local` with role `member`, **Then** membership list includes that email/role.
3. **Given** I am deck member (not admin), **When** I DELETE the deck via API or UI, **Then** I get 403 and the deck remains.
4. **Given** I am deck admin, **When** I DELETE the deck, **Then** I get 204 and the deck is gone.

---

### User Story 3 - Prove quality ownership with layered tests & CI (Priority: P1)

As a hiring manager (or the author packaging the portfolio), I clone the repo, run smoke tests in ≤5 minutes, and see unit/API/E2E/cross-layer coverage of progression + RBAC with CI artifacts.

**Why this priority**: Equal to product usefulness for the job-search north star.

**Independent Test**: `yarn test:unit` and `yarn test:smoke` pass locally; PR workflow runs typecheck + unit + `@smoke`.

**Acceptance Scenarios**:

1. **Given** a fresh clone on Node 22+, **When** I follow README install steps, **Then** `@smoke` completes successfully.
2. **Given** the suite runs, **When** I inspect reports/tags, **Then** I can point to `@rbac`, `@progression`, and one cross-layer invite test.
3. **Given** a PR is opened, **When** CI runs, **Then** lint/typecheck/unit/`@smoke` must pass to merge.

---

### Edge Cases

- Bad password → 401 and visible UI error.
- Practice with invalid confidence → 400.
- Delete deck with no membership → 404.
- Streak: already practiced today → streak unchanged; gap day → streak resets to 1 on next practice (no read-time decay in MVP).
- Empty deck → mastery percent 0.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST authenticate via email/password JWT for seeded users `admin@lab.local` / `Admin123!` and `member@lab.local` / `Member123!`.
- **FR-002**: System MUST provide Home progression: `totalXp`, `level`, `title`, `currentStreak` using locked formulas (see Assumptions).
- **FR-003**: System MUST support deck CRUD and card create/list for deck admins; members may list/practice.
- **FR-004**: System MUST enforce deck delete only when membership role is `admin` (403 otherwise).
- **FR-005**: System MUST support invite by email + role and list members.
- **FR-006**: System MUST record practice events awarding XP via domain rules and updating streak on practice only.
- **FR-007**: System MUST seed three decks (≥4 cards each): Playwright & E2E, API testing & authz, Behavioral (STAR), each with `answerHint`.
- **FR-008**: UI MUST expose accessible labels: Email, Password, Sign in, Deck name, Create deck, Invite, Delete deck, Show hint, Learning/Solid/Mastered.
- **FR-009**: Quality system MUST include Vitest unit tests for domain progression/RBAC, Playwright API/E2E/cross-layer with tags `@smoke` `@auth` `@rbac` `@mutation` `@progression`.
- **FR-010**: CI MUST run PR smoke vs full suite on `main` with Playwright HTML report artifact.

### Key Entities

- **User**: identity + aggregate XP/streak/lastPracticeDate
- **Deck**: named quest container with owner
- **DeckMember**: per-deck role `admin` | `member`
- **Card**: prompt, answerHint, tags
- **CardProgress**: per-user confidence and practice count
- **PracticeEvent**: immutable XP award record

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Author can complete a real prep session on all three seeded decks including STAR with Show hint.
- **SC-002**: Stranger clones and runs `@smoke` in ≤5 minutes with documented Node ≥ 22.
- **SC-003**: At least one RBAC and one cross-layer test visible in CI/report.
- **SC-004**: Resume-ready narrative: owned full-stack TS quality system on a gamified interview-prep app the author uses.

## Assumptions

- Progression formulas (locked):
  - Base XP +10; +5 if confidence strictly improves (`learning` < `solid` < `mastered`); first practice no improve bonus.
  - `level = floor(totalXp / 100) + 1`
  - Titles: 1–2 Apprentice; 3–5 Adventurer; 6–9 Challenger; 10–14 Veteran; 15+ Staff Contender
  - Streak updated only on practice (UTC `YYYY-MM-DD`): today → unchanged; yesterday → +1; null/older → 1
- Stack: Yarn workspaces, Fastify, SQLite, React/Vite, Vitest, Playwright.
- Out of MVP: AI, boss fights, spaced-rep, streak freezes, leaderboards, OAuth, email, Postgres, Allure, axe, k6, Pact.
