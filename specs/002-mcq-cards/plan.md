# Implementation Plan: MCQ Cards

**Feature id**: `002-mcq-cards` | **Date**: 2026-07-19 | **Spec**: [spec.md](./spec.md)

**Delivery**: Ship on **`main`** after `001-quest-deck` MVP is green. Spec Kit folder name identifies the feature; separate git branch optional.

**Input**: Feature specification from `/specs/002-mcq-cards/spec.md`  
**Prerequisite**: [`../001-quest-deck/`](../001-quest-deck/) tasks T001–T027 complete; `yarn test:smoke` green

## Summary

Add multiple-choice card kind (`mcq`) beside existing open cards: four stable options, server grading, MCQ XP (+15/+5), mastery mapping into existing `CardProgress.confidence`, seeded “QA fundamentals (MCQ)” deck, Practice UI branch, and pyramid tests. Does **not** expand `001` task list — implement only after Week-1 MVP.

## Technical Context

**Language/Version**: Same as `001` (TypeScript 5 / Node ≥ 22)  
**Primary Dependencies**: Unchanged stack (Fastify, SQLite, React/Vite, Vitest, Playwright)  
**Storage**: SQLite — migrate `cards` + `practice_events`  
**Testing**: Unit (grade/XP/mastery), API practice inject, E2E `@smoke @progression`  
**Constraints**: Membership RBAC unchanged; open-card XP formulas unchanged; no shuffle; hide `correctIndex` on GET  
**Scale/Scope**: One new seed deck, ≥4 MCQ cards, API/UI deltas only

## Constitution Check

*GATE: Must pass before implementation.*

- [x] Dual north star (objective prep check + new domain/API/E2E proof)
- [x] Spec-driven artifacts under `specs/002-mcq-cards/`
- [x] TDD required for grading/XP domain + critical practice API
- [x] SOLID — extend domain/data/application/http without god routes
- [x] Non-goals respected (no multi-select, ≠4 options, timers, AI, shuffle, card edit)

## Project Structure

### Documentation (this feature)

```text
specs/002-mcq-cards/
├── plan.md                 # This file
├── research.md             # Why card-kind vs replace confidence
├── data-model.md           # Kind, options, mastery mapping
├── contracts/rest-api.md   # Delta only
├── spec.md
└── tasks.md                # Authoritative implement-later checklist
```

### Likely source touch list (when implementing)

```text
packages/shared/            # CardKind, Mcq DTOs
apps/api/src/domain/        # gradeMcq, xpForMcq, confidenceAfterMcq
apps/api/src/data/          # schema migration, card/progress stores
apps/api/src/application/   # create card + practice branch
apps/api/src/http/          # routes validation
apps/api/src/seed.ts        # QA fundamentals (MCQ) deck
apps/web/src/               # Practice branch on card.kind; create-card form
tests/unit/                 # mcq grading + XP + mastery
tests/api/                  # practice selectedIndex wrong → +5
tests/e2e/                  # MCQ journey @smoke @progression
```

## Complexity Tracking

Low — extends existing practice path with a discriminated kind. No new screens beyond Practice branch and create-card fields.

## Implementation notes

- Execute later via Spec Kit `/speckit-implement` against **`tasks.md`** (not this pass).
- Formulas: **`data-model.md`** + **`spec.md`**. API: **`contracts/rest-api.md`**.
- Do not change open-card `xpForPractice` / improve-bonus.
- Open Practice UI must keep Learning/Solid/Mastered; MCQ must not show them.
