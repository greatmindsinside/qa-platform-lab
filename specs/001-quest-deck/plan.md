# Implementation Plan: Quest Deck Week-1 MVP

**Feature id**: `001-quest-deck` | **Date**: 2026-07-19 | **Spec**: [spec.md](./spec.md)

**Delivery**: Ship MVP on **`main`**. The Spec Kit folder name `001-quest-deck` identifies the feature; a separate git branch is optional, not required.

**Input**: Feature specification from `/specs/001-quest-deck/spec.md`

## Summary

Build Quest Deck (gamified interview prep) and the TypeScript quality system that owns it: strict monorepo, SOLID API layers, seeded QA/STAR decks (admin + member memberships), Vitest + Playwright pyramid, ESLint, PR smoke CI. Dual north star: useful prep tool + hireable portfolio proof.

## Technical Context

**Language/Version**: TypeScript 5 / Node ≥ 22  
**Primary Dependencies**: Fastify 5, better-sqlite3, jose, bcryptjs, React 19, Vite 6, Vitest 3, Playwright, ESLint  
**Storage**: SQLite (file; Postgres-ready later)  
**Testing**: Vitest (unit/inject), Playwright (api/e2e/cross-layer)  
**Target Platform**: Local Windows/macOS/Linux; GitHub Actions ubuntu  
**Project Type**: Yarn workspaces monorepo (web + api)  
**Performance Goals**: PR `@smoke` under ~2 minutes  
**Constraints**: Spec-driven; SOLID; no `any`; commit only on request; **membership-based** delete authz  
**Scale/Scope**: Solo portfolio MVP — 4 screens, ~10 API routes, 3 seed decks

## Constitution Check

*GATE: Must pass before implementation.*

- [x] Dual north star addressed (prep decks + quality layers)
- [x] Spec-driven artifacts under `specs/001-quest-deck/`
- [x] TDD required in tasks for domain + critical API
- [x] SOLID layering in project structure
- [x] MVP non-goals respected (incl. no card edit/delete, no practice notes)

## Project Structure

### Documentation (this feature)

```text
specs/001-quest-deck/
├── plan.md              # This file
├── research.md          # Stack & gamification decisions
├── data-model.md        # Entities & formulas
├── quickstart.md        # Clone / prep / smoke
├── contracts/rest-api.md
└── tasks.md             # Authoritative implementation checklist
```

### Source Code (repository root)

```text
apps/api/src/
  domain/          # rbac, progression (pure)
  data/            # db, user-store, deck-store, progress-store
  application/     # auth, deck, practice services
  http/            # token, password, routes, auth-guard
  seed.ts
  app.ts
  server.ts
apps/web/src/      # Login, Home, DeckDetail, Practice + lib/api.ts
packages/shared/   # Role, Confidence, DTOs, SEED_USERS
packages/testkit/  # ApiClient
tests/unit|api|e2e|cross-layer/
.github/workflows/ci.yml
eslint.config.js   # or equivalent flat config
```

## Complexity Tracking

None — greenfield MVP within constitution YAGNI bounds.

## Implementation notes

- Execute via Spec Kit `/speckit-implement` or Superpowers `subagent-driven-development` / `executing-plans` against **`tasks.md`** (authoritative checklist).
- Formulas and seed membership rules: **`data-model.md`** + **`spec.md`**. API shapes: **`contracts/rest-api.md`**.
- Do not invent alternate XP/streak rules.
- T022 **replaces** the current docs-only CI job with real smoke/full gates.
