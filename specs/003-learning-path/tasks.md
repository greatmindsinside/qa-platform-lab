# Tasks: QA Interview Learning Path

**Input**: Design documents from `/specs/003-learning-path/`  
**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/`, `quickstart.md`  
**Tests**: Required (constitution TDD + FR-011 smoke updates)

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete work)
- **[Story]**: `[US1]` path UI, `[US2]` curriculum content, `[US3]` demo/docs/smoke
- Exact file paths required

---

## Phase 1: Setup

**Purpose**: Confirm baseline before curriculum work

- [x] T001 Confirm `001` + `002` smoke green via root `package.json` scripts (`yarn lint`, `yarn typecheck`, `yarn test:unit`, `yarn test:smoke`) before any `003` code changes
- [x] T002 [P] Skim `specs/003-learning-path/{spec,plan,data-model,contracts/rest-api,quickstart}.md` and note legacy E2E deck-name touch points in `tests/e2e/` + `tests/unit/seed.test.ts`

---

## Phase 2: Foundational (schema + shared types)

**Purpose**: Deck `stage` / `recommendedStart` available to API + web — blocks all stories

**WARNING**: No user-story UI/seed work until this phase is complete

- [x] T003 [P] Add `LearningStage` and extend `Deck` with `stage` + `recommendedStart` in `packages/shared/src/index.ts`
- [x] T004 [P] Write failing unit tests for deck DTO mapping / create defaults in `tests/unit/deck-stage.test.ts` (or extend `tests/unit/api-quest-deck.test.ts`) asserting `stage: null` + `recommendedStart: false` on create and seeded fields round-trip
- [x] T005 Migrate SQLite `decks.stage` + `decks.recommended_start` in `apps/api/src/data/db.ts`
- [x] T006 Persist/read `stage` + `recommended_start` in `apps/api/src/data/deck-store.ts` and map in `apps/api/src/data/mappers.ts`
- [x] T007 Wire create-deck defaults (`stage: null`, `recommendedStart: false`) through `apps/api/src/application/deck-service.ts` + `apps/api/src/http/routes.ts`; ensure `GET /api/decks` returns both fields per `specs/003-learning-path/contracts/rest-api.md`
- [x] T008 Rebuild shared + make T004 pass (`yarn workspace @lab/shared build`)

**Checkpoint**: API returns `stage` / `recommendedStart`; user-created decks stay unstaged

---

## Phase 3: User Story 1 — Follow a clear Beginner → Expert path (P1) — MVP

**Goal**: Home shows stage groups + exactly one **Start here**; Expert reachable without locks; practice still works

**Independent Test**: Sign in as member → Home sections Beginner → Intermediate → Expert → Start here badge → Practice that deck → can also open Expert without finishing Beginner

### Tests for User Story 1

> Write failing tests first where practical

- [x] T009 [P] [US1] Add/adjust unit helper tests for Home grouping order in `tests/unit/path-grouping.test.ts` — Beginner→Intermediate→Expert then null-stage “Your decks”; recommended deck sorts first within Beginner
- [x] T010 [P] [US1] Scaffold failing `@smoke` outline in `tests/e2e/learning-path.spec.ts` for stage headings + Start here (assertions completed in T024 after seed)


### Implementation for User Story 1

- [x] T011 [US1] Add pure grouping helper in `apps/web/src/lib/path-grouping.ts` grouping `Deck[]` by stage order and surfacing recommended start
- [x] T012 [US1] Update `apps/web/src/pages/HomePage.tsx` to render stage sections + **Start here** badge + **Your decks** for `stage == null`; keep Practice/Manage CTAs
- [x] T013 [US1] Style path sections / Start here in `apps/web/src/styles.css` (cyberpunk language; no purple default look)
- [x] T014 [US1] Confirm create-deck stays under Your decks path (no stage picker) in `apps/web/src/pages/HomePage.tsx`

**Checkpoint**: With US2 seed, Home path UX is demoable; no hard locks

---

## Phase 4: User Story 2 — Substantial curriculum content (P1)

**Goal**: Replace legacy seeds with staged multi-topic decks meeting FR-004–FR-008; mix open+MCQ in-deck

**Independent Test**: Fresh seed → each stage ≥8 cards total, ≥1 deck ≥6 cards, ≥1 open + ≥1 MCQ per stage; member+admin memberships; practice mixed deck

### Tests for User Story 2

- [x] T015 [P] [US2] Write failing seed invariant tests in `tests/unit/seed.test.ts` (or `tests/unit/seed-curriculum.test.ts`): stages present; 1–3 decks/stage; card floors; exactly one `recommendedStart`; legacy names absent; mixed kinds; memberships
- [x] T016 [P] [US2] Update API smoke assumptions if any hard-code old deck names in `tests/api/*.spec.ts` / `tests/cross-layer/invite.spec.ts`

### Implementation for User Story 2

- [x] T017 [US2] Rewrite `apps/api/src/seed.ts` curriculum per `data-model.md` / `research.md` (replace Playwright & E2E, API testing & authz, Behavioral (STAR), QA fundamentals (MCQ)); set `stage` + one Beginner `recommendedStart`; tags for topic+stage; open before related MCQ within decks
- [x] T018 [US2] Ensure seed create path sets `stage`/`recommended_start` via `apps/api/src/data/deck-store.ts` (seed-only insert or internal helper — not exposed on public create)
- [x] T019 [US2] Make T015 pass; reset e2e DB via `scripts/reset-e2e-db.mjs` as needed
- [x] T020 [US2] Spot-check mixed open+MCQ session still works in `apps/web/src/pages/DeckPracticePage.tsx` (no code change unless a bug appears)

**Checkpoint**: Seed alone satisfies FR-003–FR-008 / FR-013–FR-014

---

## Phase 5: User Story 3 — Demo path for portfolio reviewers (P2)

**Goal**: Docs + smoke E2E prove the learning path story

**Independent Test**: Follow `docs/demo.md` / `using-quest-deck.md` → Start here practice → `yarn test:smoke` green

### Tests for User Story 3

- [x] T021 [P] [US3] Update `tests/e2e/login.spec.ts` for new curriculum deck names / stage presence
- [x] T022 [P] [US3] Update `tests/e2e/practice.spec.ts` to enter via **Start here** / Beginner Practice link and assert card counts / progress copy
- [x] T023 [P] [US3] Update `tests/e2e/mcq-practice.spec.ts` to use a mixed curriculum deck (MCQ card in-session) instead of legacy “QA fundamentals (MCQ)”
- [x] T024 [US3] Add or finish `tests/e2e/learning-path.spec.ts` `@smoke @progression`: stage headings, one Start here, Expert Practice reachable without prior Beginner completion

### Implementation for User Story 3

- [x] T025 [P] [US3] Update `docs/using-quest-deck.md` with learning-path, Start here, short session vs multi-day
- [x] T026 [P] [US3] Update `docs/demo.md` for ≤5 minute path demo script
- [x] T027 [US3] Run `yarn lint && yarn typecheck && yarn test:unit && yarn test:smoke` until green

**Checkpoint**: US3 acceptance scenarios + FR-010/FR-011 satisfied

---

## Phase 6: Polish & Cross-Cutting

**Purpose**: Consistency and constitution gates

- [x] T028 [P] Align `docs/README.md` / `README.md` pointers if they still name legacy seed decks
- [x] T029 Confirm no unlock gates / Path entity / XP drift by reviewing `apps/web/src/pages/HomePage.tsx`, `apps/api/src/domain/progression.ts`, and `specs/003-learning-path/spec.md` Assumptions
- [x] T030 Walk `specs/003-learning-path/quickstart.md` manual steps against running `yarn dev`
- [x] T031 Map FR-001–FR-014 to task IDs in `specs/003-learning-path/tasks.md` Notes (coverage pass)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 Setup** → no deps
- **Phase 2 Foundational** → after Setup; **blocks** US1–US3
- **Phase 3 US1** → after Foundational (full demo needs US2 seed)
- **Phase 4 US2** → after Foundational; may run parallel to US1 UI once T008 done
- **Phase 5 US3** → after US2 seed + US1 Home (needs real names)
- **Phase 6 Polish** → after desired stories complete

### User Story Dependencies

- **US1 (P1)**: Foundational for schema/DTO; full independent test needs US2 seed content
- **US2 (P1)**: Foundational only; independently testable via unit/API seed invariants
- **US3 (P2)**: Depends on US1 Home + US2 seed for E2E/docs accuracy

### Parallel Opportunities

```text
T003 ∥ T004
T009 ∥ T010 (after T008)
T015 ∥ T016 (after T008)
T021 ∥ T022 ∥ T023 (after T019 + T012)
T025 ∥ T026
```

### Parallel Example: After Foundational

```bash
# Developer A — US1 Home
Task: path-grouping helper + HomePage + styles

# Developer B — US2 Seed
Task: failing seed tests + seed.ts rewrite
```

---

## Implementation Strategy

### MVP First (US1 + US2)

1. Phase 1–2 foundation
2. US2 seed rewrite (content is the product)
3. US1 Home grouping + Start here
4. **STOP**: Manual quickstart validation on Start here deck
5. US3 docs + smoke

### Incremental Delivery

1. Foundation → API fields live
2. Seed curriculum → API/unit prove floors
3. Home path UX → Start here obvious
4. Docs + E2E → portfolio demo ready

---

## Notes

- Do **not** keep legacy deck names alongside new curriculum (FR-013)
- Prefer fresh/reset DB over migrating old demo progress
- Commit only when the human asks
- Suggested next command: `/speckit-implement` or `/speckit-analyze`

### FR coverage map

| FR | Tasks |
| -- | ----- |
| FR-001–002 | T011–T014, T024 |
| FR-003–008 | T015, T017–T019 |
| FR-009 | T020, existing practice pages |
| FR-010 | T025–T026 |
| FR-011 | T016, T021–T024, T027 |
| FR-012–014 | T003–T008, T017–T018 |
