# Implementation Plan: Memory Tips for Interview Recall

**Feature id**: `004-memory-tips` | **Date**: 2026-07-19 | **Spec**: [spec.md](./spec.md)  
**Branch**: `004-memory-tips` (spec id; may ship from `main`)

**Input**: Feature specification from `/specs/004-memory-tips/spec.md`  
**Prerequisite**: [`../001-quest-deck/`](../001-quest-deck/), [`../002-mcq-cards/`](../002-mcq-cards/), and [`../003-learning-path/`](../003-learning-path/) implemented and smoke-passing

## Summary

Add an optional per-card **`memoryTip`** (≤200 chars) so learners get a short recall hook after open flip or MCQ grade—not only XP. Extend seed curriculum floors (≥3 tips on recommended Beginner including open+MCQ; ≥1 tip per stage). Light practice UI: collapsible **Remember this** (expand pauses auto-advance) + **How to remember** technique help. Docs + layered tests. No SRS, no XP changes, no card edit/delete.

## Technical Context

**Language/Version**: TypeScript 5 / Node ≥ 22  
**Primary Dependencies**: Fastify, better-sqlite3, React/Vite, Vitest, Playwright (unchanged)  
**Storage**: SQLite — migrate `cards` with nullable `memory_tip TEXT`  
**Testing**: Unit (validation / mapper visibility), API (create + GET omit MCQ tip + practice returns tip), E2E `@smoke` (tip after flip/grade)  
**Target Platform**: Local monorepo web app (API + Vite)  
**Project Type**: Yarn workspaces monorepo (`apps/api`, `apps/web`, `packages/shared`)  
**Performance Goals**: Tip UI must not add perceptible lag to flip/grade; seed scale unchanged  
**Constraints**: XP/streak/mastery frozen; MCQ tip withheld on GET; no SRS; cyberpunk UI + readable body tip text  
**Scale/Scope**: One optional string field; practice UX delta; seed tip floors; static technique copy (2–4 methods)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] Dual north star — interview recall habit + demoable tip proof in Foundations practice / smoke
- [x] Spec-driven — artifacts under `specs/004-memory-tips/`
- [x] TDD — failing unit/API/E2E for tip field + visibility before claiming done
- [x] SOLID — tip validation in application/domain; mapper strips MCQ tip on GET; no XP math in React
- [x] YAGNI — one optional column + UI panels; no Path/SRS/AI/voice
- [x] Non-goals — no spaced repetition engine, no XP formula changes, no card edit/delete, no blocking tip modal

**Post-design re-check**: Still pass — design is one nullable column, kind-aware DTO rules, and practice UI only.

## Project Structure

### Documentation (this feature)

```text
specs/004-memory-tips/
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
packages/shared/src/index.ts           # Card.memoryTip?; PracticeResult.memoryTip?
apps/api/src/data/db.ts                # migrate cards.memory_tip
apps/api/src/data/deck-store.ts        # persist/read memory_tip
apps/api/src/data/mappers.ts           # open: include tip on GET; mcq: omit
apps/api/src/application/deck-service.ts  # validate ≤200 on create
apps/api/src/application/practice-service.ts  # MCQ grade response includes tip
apps/api/src/http/routes.ts            # accept memoryTip on POST cards
apps/api/src/seed.ts                   # tip floors per FR-009
apps/web/src/components/               # RememberThis + HowToRemember (or inline)
apps/web/src/pages/DeckPracticePage.tsx
apps/web/src/pages/PracticePage.tsx
apps/web/src/pages/DeckDetailPage.tsx  # optional tip on admin create form
apps/web/src/styles.css
docs/using-quest-deck.md
docs/demo.md                           # optional one-liner if demo flow mentions tips
tests/unit/                            # mapper visibility + length validation
tests/api/ or inject tests             # create / GET / practice tip rules
tests/e2e/                             # tip after flip or grade (@smoke)
```

**Structure Decision**: Extend existing monorepo layout; no new apps/packages.

## Complexity Tracking

No constitution violations. Complexity stays low: one column + visibility rules + light practice UI + seed tips.
