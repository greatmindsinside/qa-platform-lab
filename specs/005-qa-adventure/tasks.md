# Tasks: QA Text Adventure

**Input**: Design documents from `/specs/005-qa-adventure/`  
**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/`, `quickstart.md`  
**Tests**: Required (constitution TDD + FR-012 unit/API/E2E)

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete work)
- **[Story]**: `[US1]` playable adventure, `[US2]` learning consequences/takeaways, `[US3]` XP/streak
- Exact file paths required

---

## Phase 1: Setup

**Purpose**: Confirm baseline before adventure work

- [x] T001 Confirm `001`–`003` smoke green via root scripts (`yarn lint`, `yarn typecheck`, `yarn test:unit`) before adventure code changes
- [x] T002 [P] Skim `specs/005-qa-adventure/{spec,plan,data-model,contracts/rest-api,quickstart}.md` and note touch points in `apps/api/src/app.ts`, `apps/api/src/http/routes.ts`, `apps/web/src/App.tsx`

---

## Phase 2: Foundational (schema + shared types + domain)

**Purpose**: Adventure tables, DTOs, and pure domain helpers — blocks all stories

**WARNING**: No user-story UI/seed playthrough until this phase is complete

- [x] T003 [P] Add adventure DTOs (`AdventureSummary`, `AdventureSceneView`, `AdventureChoice`, `LearningTakeaway`, progress status unions) and `ADVENTURE_COMPLETION_XP = 25` in `packages/shared/src/index.ts`
- [x] T004 [P] Write failing unit tests for choice resolve, takeaway derivation, and XP award/replay in `tests/unit/adventure.test.ts`
- [x] T005 Implement pure adventure domain helpers in `apps/api/src/domain/adventure.ts` (`xpForAdventureCompletion`, `takeawaysFromTags`, lesson tag catalog)
- [x] T006 Migrate SQLite tables `adventures`, `scenes`, `choices`, `adventure_progress` in `apps/api/src/data/db.ts` per `data-model.md`
- [x] T007 Implement `apps/api/src/data/adventure-store.ts` (load adventure list/graph, get/upsert progress)
- [x] T008 [P] Add adventure mappers in `apps/api/src/data/mappers.ts` (summary + scene view without author-only fields)
- [x] T009 Rebuild shared package (`yarn workspace @lab/shared build`) and make T004 domain assertions pass for helpers that do not need DB

**Checkpoint**: Domain + schema + store ready; no public routes yet

---

## Phase 3: User Story 1 — Finish one short QA adventure (P1) — MVP

**Goal**: Home → Adventure → choice-driven scenes → ending summary → resume/restart; seeded Flaky Friday

**Independent Test**: Sign in as member → open Adventure from Home → complete via choices → see takeaways → leave mid-run and resume

### Tests for User Story 1

> Write failing tests first where practical

- [x] T010 [P] [US1] Write failing API inject tests for list/scene/choose/restart in `tests/unit/api-adventure.test.ts` (or `tests/api/adventure.spec.ts`)
- [x] T011 [P] [US1] Scaffold failing `@smoke` E2E outline in `tests/e2e/adventure.spec.ts` (Home entry → finish → summary; XP assertions deferred to US3)

### Implementation for User Story 1

- [x] T012 [US1] Implement `apps/api/src/application/adventure-service.ts` (getScene auto-start, choose, restart; completion award stubbed or deferred wiring OK if US3 follows immediately)
- [x] T013 [US1] Register adventure routes in `apps/api/src/http/routes.ts` and wire service in `apps/api/src/app.ts` per `contracts/rest-api.md`
- [x] T014 [US1] Seed Flaky Friday adventure graph (≥8 scenes, ≥2 endings, ≥1 major branch) in `apps/api/src/seed.ts`
- [x] T015 [US1] Add API client methods in `apps/web/src/lib/api.ts`
- [x] T016 [US1] Build `apps/web/src/pages/AdventurePage.tsx` (prose + choice buttons + ending summary + restart; no command parser)
- [x] T017 [US1] Add `/adventure` route in `apps/web/src/App.tsx` and Adventure CTA on `apps/web/src/pages/HomePage.tsx`
- [x] T018 [US1] Style adventure mode (readable prose, immersive layout) in `apps/web/src/styles.css`
- [x] T019 [US1] Make T010 pass for list/scene/choose/resume/restart (award may still be partial until US3)

**Checkpoint**: Playable MVP adventure with resume; demoable without XP proof

---

## Phase 4: User Story 2 — Learn QA ideas through consequences (P1)

**Goal**: Divergent paths produce different endings/takeaway emphasis; summary always names ≥1 QA concept

**Independent Test**: Two playthroughs with opposite major choices → different ending tone and/or takeaway set

### Tests for User Story 2

- [x] T020 [P] [US2] Extend `tests/unit/adventure.test.ts` for path-tag → takeaway mapping and ending default tag guarantee
- [x] T021 [P] [US2] Add seed invariant checks in `tests/unit/seed.test.ts` (or `tests/unit/seed-adventure.test.ts`): ≥8 scenes, ≥2 endings, ≥1 branch, ≥3 lesson themes covered

### Implementation for User Story 2

- [x] T022 [US2] Ensure seeded choices carry `lessonTags` and endings set `endingTone` + default tags in `apps/api/src/seed.ts`
- [x] T023 [US2] Wire takeaways into ending `AdventureSceneView` in `apps/api/src/application/adventure-service.ts` + mappers
- [x] T024 [US2] Render takeaways list on ending state in `apps/web/src/pages/AdventurePage.tsx`
- [x] T025 [US2] Make T020–T021 pass

**Checkpoint**: SC-002 / SC-003 demoable via divergent paths

---

## Phase 5: User Story 3 — Progression coherent with Quest Deck (P2)

**Goal**: First completion +25 XP + streak; replay +0 XP; level/title formulas unchanged

**Independent Test**: Note Home XP → complete adventure once → +25; replay → no second +25; streak updates per practice-day rules

### Tests for User Story 3

- [x] T026 [P] [US3] Unit tests for `xpForAdventureCompletion` (+25 / +0) in `tests/unit/adventure.test.ts`
- [x] T027 [P] [US3] API/inject tests asserting first completion XP + replay 0 in `tests/unit/api-adventure.test.ts` or `tests/api/adventure.spec.ts`
- [x] T028 [US3] Complete E2E `@smoke @progression` in `tests/e2e/adventure.spec.ts`: finish → Home shows XP increase of 25 on first run

### Implementation for User Story 3

- [x] T029 [US3] On ending transition, apply XP/streak via existing `nextStreak` / user store in `apps/api/src/application/adventure-service.ts`; set `awardGranted`
- [x] T030 [US3] Return progression fields on ending responses per contract; refresh Home user after adventure in `apps/web/src/pages/AdventurePage.tsx` / Home navigation
- [x] T031 [US3] Make T026–T028 pass

**Checkpoint**: FR-008 / FR-009 / SC-004 satisfied

---

## Phase 6: Polish & Cross-Cutting

**Purpose**: Docs, quality gates, quickstart

- [x] T032 [P] Update `docs/using-quest-deck.md` with Adventure sibling mode (start/resume/replay XP rules)
- [x] T033 [P] Add optional one-liner to `docs/demo.md` for adventure demo path
- [x] T034 Confirm no free-text parser / AI / deck unlock gates by reviewing `AdventurePage.tsx` + `adventure-service.ts` vs spec Assumptions
- [x] T035 Run `yarn lint && yarn typecheck && yarn test:unit && yarn test:smoke` until green
- [x] T036 Walk `specs/005-qa-adventure/quickstart.md` manual steps against `yarn dev` (or note CI-covered equivalents)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup** → **Foundational** → **US1 (MVP)** → **US2** → **US3** → **Polish**
- US2/US3 both depend on US1 playable loop; US3 depends on ending transition existing

### User Story Dependencies

- **US1**: After Foundational — no story deps
- **US2**: After US1 scene/ending plumbing
- **US3**: After US1 ending transition (can overlap US2)

### Parallel Opportunities

- T003 ‖ T004 (types vs failing tests)
- T010 ‖ T011 (API vs E2E scaffold)
- T020 ‖ T021 (unit takeaways vs seed invariants)
- T026 ‖ T027 (unit XP vs API XP)
- T032 ‖ T033 (docs)

---

## Parallel Example: User Story 1

```bash
# After foundational:
Task: "API inject tests in tests/unit/api-adventure.test.ts"
Task: "E2E scaffold in tests/e2e/adventure.spec.ts"
# Then sequential service → routes → seed → web
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Setup + Foundational  
2. US1 playable adventure + resume  
3. **STOP and VALIDATE** Home → finish → summary  

### Incremental Delivery

1. US1 MVP playable  
2. US2 takeaways / divergent paths  
3. US3 XP/streak + smoke proof  
4. Polish docs + full gate  

### Suggested MVP scope

Phases 1–3 (Setup + Foundational + US1) deliver a demoable adventure; US2/US3 required for full FR-012 / progression acceptance.

---

## Notes / FR coverage

| FR | Tasks |
| -- | ----- |
| FR-001 Home entry | T017 |
| FR-002 seeded adventure | T014, T021–T022 |
| FR-003 choice-only | T016, T034 |
| FR-004 scene+choices | T012–T013, T016 |
| FR-005 QA lessons | T022–T024 |
| FR-006 takeaways summary | T023–T024 |
| FR-007 resume | T007, T012, T019 |
| FR-008/009 XP + replay | T026–T031 |
| FR-010 auth reuse | T013 |
| FR-011 contemporary UI | T016–T018 |
| FR-012 tests | T004, T010–T011, T020–T021, T026–T028, T035 |
