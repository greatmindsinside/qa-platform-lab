# qa-platform-lab Constitution

## Core Principles

### I. Dual North Star (NON-NEGOTIABLE)

Every change must serve **both**:

1. **Job portfolio** — a cloneable Quality Engineering proof (owned AUT + layered tests + CI) a hiring manager can run in ≤5 minutes.
2. **Interview prep** — a Quest Deck tool the author actually uses for QA/SDET and behavioral rehearsal.

If a feature helps the résumé but would not be used for prep, cut it. If it helps prep but removes authz/CRUD risk for the quality narrative, redesign so both still win.

### II. Spec-Driven Development (NON-NEGOTIABLE)

Specifications are the source of truth — not chat history and not code.

1. Change intent → update Spec Kit artifacts (`spec.md` / constitution) first.
2. Derive / update `plan.md` and `tasks.md` from the spec.
3. Implement only what the tasks require; no drive-by features.
4. Validate against the spec (acceptance scenarios + tests), not vibes.
5. **Canonical SDD lives under `.specify/` and `specs/`** — do not reintroduce parallel plan/spec trees.

### III. Test-First Quality System (NON-NEGOTIABLE)

TDD for domain rules and critical API behavior:

1. Write failing tests → implement minimal code → refactor.
2. Layers required for MVP: unit (Vitest) → API → E2E → cross-layer (Playwright).
3. Tags: `@smoke` `@auth` `@rbac` `@mutation` `@progression`.
4. PR gate = lint + typecheck + unit + `@smoke`; `main` = full suite + report artifact.
5. Prefer role/label Playwright locators over CSS.

### IV. SOLID TypeScript & Clean Code

1. Strict TypeScript (`strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`); no `any`; narrow before assert.
2. API layers: `domain` → `data` → `application` → `http`. Routes stay thin; XP/RBAC math stays in domain.
3. DRY: `@lab/shared` owns `Role`, `Confidence`, DTOs, `SEED_USERS`.
4. DIP: `buildApp` is the composition root; inject DB path for tests.
5. No smells: circular imports, god files, XP math in React, global-role deck delete, silent product `catch {}`, web importing `@lab/testkit`.

### V. YAGNI Simplicity

Ship the smallest Quest Deck that is useful for prep and proves the quality system. Explicitly out of MVP: AI interviewer, boss fights, spaced repetition, streak freezes, leaderboards, OAuth, email, Postgres, Allure, axe, k6, Pact, QA dashboard, self-healing.

## Product Constraints

- **AUT:** Quest Deck — decks, cards, practice, RPG-lite XP/level/title/streak.
- **Authz:** Deck membership `admin` | `member`; only deck admins delete decks.
- **Seed:** Three decks (≥4 cards each): Playwright & E2E, API testing & authz, Behavioral (STAR); practice supports Show hint (`answerHint`).
- **Stack:** Node ≥ 22, Yarn 1, TypeScript, Fastify, SQLite, React/Vite, Vitest, Playwright, GitHub Actions.
- **Progression formulas:** locked in the feature spec — do not invent alternate XP/level/streak rules.

## Development Workflow

1. Use Spec Kit skills: constitution → specify → plan → tasks → analyze (optional) → implement.
2. Follow the human guide: [`docs/spec-driven-development.md`](../../docs/spec-driven-development.md).
3. Commit only when the human explicitly asks.
4. Prefer Superpowers execution skills (`subagent-driven-development` / `executing-plans`) against Spec Kit `tasks.md`.
5. After MVP, Phase 2+ changes still update `specs/` before code.
6. Product usage (after MVP): [`docs/using-quest-deck.md`](../../docs/using-quest-deck.md).

## Governance

- This constitution supersedes ad-hoc agent preferences.
- Spec Kit feature specs under `specs/` are the sole product/requirements source of truth.
- Amendments require updating this file, bumping **Version**, and aligning active feature specs.
- PRs and agent reviews must verify: dual north star, spec alignment, SOLID/TDD, and MVP non-goals.

**Version**: 1.0.0 | **Ratified**: 2026-07-19 | **Last Amended**: 2026-07-19
