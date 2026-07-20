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

**Purpose**: Monorepo scaffold + lint baseline

- [x] T001 Create Yarn workspaces root `package.json`, `tsconfig.base.json`, `.gitignore` (scripts include `lint`, `typecheck`, `test:unit`, `test:smoke`)
- [x] T002 [P] Stub `apps/api`, `apps/web`, `packages/shared`, `packages/testkit` package.json files
- [x] T003 [P] Add ESLint flat config + `yarn lint` script (minimal TypeScript-aware rules)
- [x] T004 Run `yarn install` and verify workspaces link; `yarn lint` runs (may be empty/clean)

---

## Phase 2: Foundational (Blocking)

**Purpose**: Shared types, domain rules, DB — blocks all stories

- [x] T005 [P] [US1] Implement `@lab/shared` types + `SEED_USERS` + `isRole`/`isConfidence` in `packages/shared/src/index.ts`
- [x] T006 [P] [US1] Write failing unit tests `tests/unit/rbac.test.ts` and `tests/unit/progression.test.ts` (include `xpIntoLevel` / `xpToNextLevel`)
- [x] T007 [US1] Implement `apps/api/src/domain/rbac.ts` and `progression.ts` to pass T006
- [x] T008 [P] [US1] Write failing `tests/unit/seed.test.ts` (3 decks, ≥12 cards, STAR present, **member membership on all three**)
- [x] T009 [US1] Implement `apps/api/src/data/db.ts`, `http/password.ts`, `seed.ts` (no circular db↔seed; seed member on all decks)
- [x] T010 Install API deps: fastify, cors, jose, better-sqlite3, bcryptjs, tsx
- [x] T011 [P] Create stores: `user-store.ts`, `deck-store.ts`, `progress-store.ts`
- [x] T012 Create `HttpError`, `token.ts`, `auth-guard.ts`, `buildApp` composition root + `server.ts`
- [x] T013 Write failing `tests/unit/api-quest-deck.test.ts` (health, login, me with xp fields, practice XP, member 403 delete, **membership-admin delete 204**)
- [x] T014 Implement auth/deck/practice services + routes per `contracts/rest-api.md` until T013 passes (`masteryPercent` on list decks)

**Checkpoint**: Domain + API inject tests green; both seed users can list/practice seeded decks via API

---

## Phase 3: User Story 1 — Practice + progression (P1) 🎯

**Goal**: Useful prep loop with XP/streak/Show hint/XP bar  
**Independent Test**: Practice one seeded card as admin or member; Home shows XP bar + streak

- [x] T015 [P] [US1] Implement `packages/testkit` `ApiClient` + Playwright `playwright.config.ts`
- [x] T016 [P] [US1] API specs `tests/api/auth.spec.ts`, `practice-xp.spec.ts` with `@smoke` tags
- [x] T017 [US1] Scaffold Vite React app; `lib/api.ts` (no testkit import); Login + Home (XP bar + mastery %) + Practice with Show hint
- [x] T018 [US1] E2E `tests/e2e/login.spec.ts`, `practice.spec.ts` + fixtures `asAdmin`/`asMember` (member must see seeded decks)
- [x] T019 [US1] Manual prep check: STAR deck + hint + XP as admin **and** member — would you use this tomorrow?

**Checkpoint**: US1 demoable end-to-end for both seed accounts

---

## Phase 4: User Story 2 — Decks, invite, RBAC (P2)

**Goal**: Create/invite/delete authz (membership-based)  
**Independent Test**: Member 403 delete; admin 204; membership-admin allow

- [x] T020 [P] [US2] API specs `tests/api/rbac-delete.spec.ts` `@smoke @rbac` (include membership-vs-global-role case)
- [x] T021 [US2] UI Deck detail: create deck, invite, delete deck + 403 message
- [x] T022 [US2] Cross-layer `tests/cross-layer/invite.spec.ts` `@smoke`

**Checkpoint**: US2 + cross-layer green

---

## Phase 5: User Story 3 — Portfolio CI & docs (P1)

**Goal**: Hiring-manager clone path  
**Independent Test**: CI workflow + README smoke instructions

- [x] T023 [US3] **Replace** `.github/workflows/ci.yml` docs-only job with PR = lint + typecheck + unit + `@smoke`; `main` = full suite + HTML report artifact
- [x] T024 [P] [US3] `docs/quality-architecture.md` + `docs/demo.md`
- [x] T025 [US3] Finalize README (dual purpose + commands); local gate: lint, typecheck, unit, smoke, full Playwright

**Checkpoint**: Portfolio packaging complete

---

## Phase 6: Polish

- [x] T026 Run `/speckit-analyze` mindset: tasks vs spec coverage; fix gaps
- [x] T027 Confirm constitution non-goals not implemented (no card edit/delete, no AI, etc.)

## Parallel opportunities

- T005 ∥ T006 after T004  
- T015 ∥ T016 after T014  
- T020 ∥ T021 after US1 UI shell exists  

## Definition of done

All FR/SC in `spec.md` satisfied; constitution dual north star held; `yarn lint` + `yarn test:smoke` green.
