# Tasks: MCQ Cards (Phase 2)

**Input**: `specs/002-mcq-cards/` (spec, plan, data-model, contracts)  
**Prerequisites**: `001-quest-deck` MVP green (T001–T027); constitution dual north star held  
**Tests**: Required (TDD for domain grading/XP + critical practice API)

## Format

- **[P]**: parallel-safe
- **[USn]**: user story mapping
- Exact paths required

---

## Phase 0: Gate

**Purpose**: Do not start until Week-1 is shippable

- [x] T000 Confirm `001` smoke green (`yarn lint`, `yarn test:unit`, `yarn test:smoke`) before any `002` code

---

## Phase 1: Schema + domain (TDD)

**Purpose**: Persist MCQ fields; pure grading/XP/mastery

- [x] T001 [P] [US1] Extend `@lab/shared` with `CardKind`, MCQ create/practice DTOs in `packages/shared/src/index.ts`
- [x] T002 [P] [US1] Write failing unit tests `tests/unit/mcq-grading.test.ts` (`gradeMcq`, `xpForMcq` 15/5, `confidenceAfterMcq`)
- [x] T003 [US1] Implement `apps/api/src/domain/mcq.ts` (or extend `progression.ts`) until T002 passes
- [x] T004 [US1] Migrate SQLite: `cards.kind`, `cards.options_json`, `cards.correct_index`; `practice_events.selected_index`, `practice_events.was_correct`

**Checkpoint**: Domain green; schema accepts open + mcq rows

---

## Phase 2: API create + practice

**Purpose**: Contract delta live

- [x] T005 [P] [US2] Write failing API inject tests for create MCQ (admin 201, member 403, 400 invalid shape, GET omits `correctIndex`)
- [x] T006 [P] [US1] [US3] Write failing practice tests: MCQ `{ selectedIndex }` correct → +15; wrong → +5 + `correctIndex` in response; open path still `{ confidence }`
- [x] T007 [US1] [US2] Implement create-card + practice services/routes per `contracts/rest-api.md` until T005–T006 pass

**Checkpoint**: API alone proves MCQ grading + authz

---

## Phase 3: Seed

**Purpose**: Prep content for E2E

- [x] T008 [US1] Seed deck **“QA fundamentals (MCQ)”** with ≥4 MCQ cards; memberships admin=`admin`, member=`member` (same as `001`)
- [x] T009 [P] Extend `tests/unit/seed.test.ts` (or add `seed-mcq.test.ts`) for new deck + memberships

**Checkpoint**: Both seed users can list/practice MCQ deck via API

---

## Phase 4: UI

**Purpose**: Practice + create branch on `kind`

- [x] T010 [US1] Practice screen: if `mcq`, show A–D options (stable order), submit `selectedIndex`, show correct/incorrect + XP; **no** confidence buttons
- [x] T011 [US2] Deck admin create-card form: `kind` toggle; MCQ fields `options[4]` + `correctIndex`
- [x] T012 [US1] Home still shows streak/XP/mastery after MCQ practice (mapped confidence)

**Checkpoint**: Manual MCQ session usable as admin and member

---

## Phase 5: Playwright + docs polish

**Purpose**: Portfolio proof tags

- [x] T013 [P] [US3] API Playwright `tests/api/mcq-practice.spec.ts` `@smoke @progression` (wrong index → +5)
- [x] T014 [US3] E2E `tests/e2e/mcq-practice.spec.ts` `@smoke @progression` (select correct option journey)
- [x] T015 [P] Update README/`docs/using-quest-deck.md` if product copy needs MCQ how-to (beyond Phase-2 pointer)

**Checkpoint**: US3 acceptance scenarios green in CI smoke

---

## Phase 6: Polish

- [x] T016 Confirm open-card XP/improve-bonus unchanged; no shuffle; no card edit/delete sneak-in
- [x] T017 Spec vs tasks coverage pass (`/speckit-analyze` mindset)

## Parallel opportunities

- T001 ∥ T002 after T000  
- T005 ∥ T006 after T004  
- T013 ∥ T014 after T012  

## Definition of done

All FR/SC in `spec.md` satisfied; `001` open flows still green; `yarn lint` + `yarn test:smoke` green including MCQ tags.
