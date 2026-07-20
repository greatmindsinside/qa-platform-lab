# Implementation Plan: QA Interview Learning Path

**Feature id**: `003-learning-path` | **Date**: 2026-07-19 | **Spec**: [spec.md](./spec.md)  
**Branch**: `003-learning-path`

**Input**: Feature specification from `/specs/003-learning-path/spec.md`  
**Prerequisite**: [`../001-quest-deck/`](../001-quest-deck/) and [`../002-mcq-cards/`](../002-mcq-cards/) implemented and smoke-passing

## Summary

Replace the flat demo seed with a **Beginner → Intermediate → Expert** curriculum: optional deck `stage` + `recommendedStart`, Home grouped by stage with a **Start here** badge, multi-topic decks that mix open + MCQ, and docs/tests updated for new names. Soft guidance only (no unlock gates). Practice/XP/RBAC unchanged.

## Technical Context

**Language/Version**: TypeScript 5 / Node ≥ 22  
**Primary Dependencies**: Fastify, better-sqlite3, React/Vite, Vitest, Playwright (unchanged)  
**Storage**: SQLite — migrate `decks` with `stage`, `recommended_start`  
**Testing**: Unit (seed shape / stage grouping helpers), API (deck DTO fields), E2E `@smoke` (Home path + practice)  
**Target Platform**: Local monorepo web app (API + Vite)  
**Project Type**: Yarn workspaces monorepo (`apps/api`, `apps/web`, `packages/shared`)  
**Performance Goals**: Home remains instant for ≤20 decks (seed scale)  
**Constraints**: No hard locks; no Path entity; replace legacy seeds; XP formulas frozen  
**Scale/Scope**: 3 stages × 1–3 decks; ≥8 cards/stage; ≥1 deck ≥6 cards/stage; mixed open+MCQ in-deck

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] Dual north star — real interview curriculum + demoable portfolio path proof
- [x] Spec-driven — artifacts under `specs/003-learning-path/`
- [x] TDD — seed/DTO/grouping coverage + smoke E2E updates before claiming done
- [x] SOLID — thin schema + mapper/DTO; no XP math in React; routes stay thin
- [x] YAGNI — optional `stage`/`recommendedStart` only; no Path table, no gates, no CMS
- [x] Non-goals — no AI, no XP formula changes, no card edit/delete, no hard unlocks

**Post-design re-check**: Still pass — design uses deck columns + Home grouping only.

## Project Structure

### Documentation (this feature)

```text
specs/003-learning-path/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/rest-api.md
├── spec.md
├── checklists/requirements.md
└── tasks.md                 # /speckit-tasks (not this command)
```

### Source Code (likely touch list)

```text
packages/shared/src/index.ts          # LearningStage, Deck.stage, Deck.recommendedStart
apps/api/src/data/db.ts               # migrate decks columns
apps/api/src/data/deck-store.ts       # persist/read stage + recommended_start
apps/api/src/data/mappers.ts          # map to Deck DTO
apps/api/src/application/deck-service.ts
apps/api/src/seed.ts                  # replace legacy decks with curriculum
apps/web/src/pages/HomePage.tsx       # stage groups + Start here + Your decks
apps/web/src/styles.css               # path section styles
docs/using-quest-deck.md
docs/demo.md
tests/unit/                           # seed curriculum floors / grouping
tests/e2e/login.spec.ts               # new deck names
tests/e2e/practice.spec.ts            # Start here → practice
tests/e2e/mcq-practice.spec.ts        # mixed deck MCQ path
tests/cross-layer/invite.spec.ts      # unstaged user decks still work
```

**Structure Decision**: Extend existing monorepo layout; no new apps/packages.

## Complexity Tracking

No constitution violations. Complexity stays low: two nullable/boolean deck fields + seed rewrite + Home grouping.
