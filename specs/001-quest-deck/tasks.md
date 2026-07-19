# Tasks: Quest Deck Week-1 MVP

**Input**: `specs/001-quest-deck/` (spec, plan, data-model, contracts)  
**Prerequisites**: constitution ratified  
**Tests**: Required (constitution III — TDD for domain + critical API)

## Format

- **[P]**: parallel-safe
- **[USn]**: user story mapping
- Exact paths required

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Monorepo scaffold

- [ ] T001 Create Yarn workspaces root `package.json`, `tsconfig.base.json`, `.gitignore`
- [ ] T002 [P] Stub `apps/api`, `apps/web`, `packages/shared`, `packages/testkit` package.json files
- [ ] T003 Run `yarn install` and verify workspaces link

---

## Phase 2: Foundational (Blocking)

**Purpose**: Shared types, domain rules, DB — blocks all stories

- [ ] T004 [P] [US1] Implement `@lab/shared` types + `SEED_USERS` + `isRole`/`isConfidence` in `packages/shared/src/index.ts`
- [ ] T005 [P] [US1] Write failing unit tests `tests/unit/rbac.test.ts` and `tests/unit/progression.test.ts`
- [ ] T006 [US1] Implement `apps/api/src/domain/rbac.ts` and `progression.ts` to pass T005
- [ ] T007 [P] [US1] Write failing `tests/unit/seed.test.ts` (3 decks, ≥12 cards, STAR present)
- [ ] T008 [US1] Implement `apps/api/src/data/db.ts`, `http/password.ts`, `seed.ts` (no circular db↔seed)
- [ ] T009 Install API deps: fastify, cors, jose, better-sqlite3, bcryptjs, tsx
- [ ] T010 [P] Create stores: `user-store.ts`, `deck-store.ts`, `progress-store.ts`
- [ ] T011 Create `HttpError`, `token.ts`, `auth-guard.ts`, `buildApp` composition root + `server.ts`
- [ ] T012 Write failing `tests/unit/api-quest-deck.test.ts` (health, login, me, practice XP, RBAC delete)
- [ ] T013 Implement auth/deck/practice services + routes per `contracts/rest-api.md` until T012 passes

**Checkpoint**: Domain + API inject tests green; seed decks usable via API

---

## Phase 3: User Story 1 — Practice + progression (P1) 🎯

**Goal**: Useful prep loop with XP/streak and Show hint  
**Independent Test**: Practice one seeded card; Home/me shows XP and streak

- [ ] T014 [P] [US1] Implement `packages/testkit` `ApiClient` + Playwright `playwright.config.ts`
- [ ] T015 [P] [US1] API specs `tests/api/auth.spec.ts`, `practice-xp.spec.ts` with `@smoke` tags
- [ ] T016 [US1] Scaffold Vite React app; `lib/api.ts` (no testkit import); Login + Home + Practice with Show hint
- [ ] T017 [US1] E2E `tests/e2e/login.spec.ts`, `practice.spec.ts` + fixtures `asAdmin`/`asMember`
- [ ] T018 [US1] Manual prep check: STAR deck + hint + XP — would you use this tomorrow?

**Checkpoint**: US1 demoable end-to-end

---

## Phase 4: User Story 2 — Decks, invite, RBAC (P2)

**Goal**: Create/invite/delete authz  
**Independent Test**: Member 403 delete; admin 204

- [ ] T019 [P] [US2] API spec `tests/api/rbac-delete.spec.ts` `@smoke @rbac`
- [ ] T020 [US2] UI Deck detail: create deck, invite, delete deck + 403 message
- [ ] T021 [US2] Cross-layer `tests/cross-layer/invite.spec.ts` `@smoke`

**Checkpoint**: US2 + cross-layer green

---

## Phase 5: User Story 3 — Portfolio CI & docs (P1)

**Goal**: Hiring-manager clone path  
**Independent Test**: CI workflow + README smoke instructions

- [ ] T022 [US3] `.github/workflows/ci.yml` PR smoke + main full + artifacts
- [ ] T023 [P] [US3] `docs/quality-architecture.md` + `docs/demo.md`
- [ ] T024 [US3] Finalize README (dual purpose + commands); local gate: typecheck, unit, smoke, full Playwright

**Checkpoint**: Portfolio packaging complete

---

## Phase 6: Polish

- [ ] T025 Run `/speckit-analyze` mindset: tasks vs spec coverage; fix gaps
- [ ] T026 Confirm constitution non-goals not implemented

## Parallel opportunities

- T004 ∥ T005 after T003  
- T014 ∥ T015 after T013  
- T019 ∥ T020 after US1 UI shell exists  

## Definition of done

All FR/SC in `spec.md` satisfied; constitution dual north star held; `yarn test:smoke` green.
