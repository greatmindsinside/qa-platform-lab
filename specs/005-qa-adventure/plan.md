# Implementation Plan: QA Text Adventure

**Feature id**: `005-qa-adventure` | **Date**: 2026-07-20 | **Spec**: [spec.md](./spec.md)  
**Branch**: `005-qa-adventure` (spec id; may ship from `main`)

**Input**: Feature specification from `/specs/005-qa-adventure/spec.md`  
**Prerequisite**: [`../001-quest-deck/`](../001-quest-deck/), [`../002-mcq-cards/`](../002-mcq-cards/), and [`../003-learning-path/`](../003-learning-path/) implemented and smoke-passing. Independent of [`../004-memory-tips/`](../004-memory-tips/).

## Summary

Add a **choice-driven interactive fiction mode** (“Adventure”) teaching QA/SDET judgment through a short branching story (CI flake / release triage). Seeded content + per-user progress (resume/restart), end summary with learning takeaways, first-completion **+25 XP** and streak via existing progression helpers. Contemporary immersive UI from Home—not a parser terminal, not deck Practice. Layered tests cover advance/award/resume + one E2E smoke path.

## Technical Context

**Language/Version**: TypeScript 5 / Node ≥ 22  
**Primary Dependencies**: Fastify, better-sqlite3, React/Vite, Vitest, Playwright (unchanged)  
**Storage**: SQLite — new tables for adventures/scenes/choices + per-user progress; seed one adventure graph  
**Testing**: Unit (choice advance, completion XP/replay 0, takeaway derivation); API inject; E2E `@smoke` Home → finish → XP  
**Target Platform**: Local monorepo web app (API + Vite); Docker optional unchanged  
**Project Type**: Yarn workspaces monorepo (`apps/api`, `apps/web`, `packages/shared`)  
**Performance Goals**: Scene transitions feel instant for seeded graph (~10–20 scenes); no runtime content generation  
**Constraints**: No free-text parser; no AI DM; XP formulas elsewhere frozen; adventure award locked (+25 / +0 replay); cyberpunk UI with readable story prose  
**Scale/Scope**: One seeded adventure; one play route; thin adventure service; no inventory/combat systems

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] Dual north star — usable interview-prep adventure + demoable quality proof (unit/API/E2E for progress + award)
- [x] Spec-driven — artifacts under `specs/005-qa-adventure/`
- [x] TDD — failing tests for advance/resume/award before claiming done
- [x] SOLID — adventure rules in domain/application; XP via existing `nextStreak` / user store; no XP math in React
- [x] YAGNI — one authored graph + choice UI; no parser, AI, multiplayer, maps
- [x] Non-goals — free-text Zork parser, AI interviewer, deck unlock gates, inventory RPG, card edit/delete

**Post-design re-check**: Still pass — design is seedable graph + progress table + thin REST + one web page; progression reuses `001` streak helpers with a fixed adventure XP constant.

## Project Structure

### Documentation (this feature)

```text
specs/005-qa-adventure/
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
packages/shared/src/index.ts              # Adventure DTOs, takeaway types, XP constant export if shared
apps/api/src/data/db.ts                   # adventures, scenes, choices, adventure_progress tables
apps/api/src/data/adventure-store.ts      # NEW: load graph + progress CRUD
apps/api/src/data/mappers.ts              # map adventure/scene DTOs (no secret author notes)
apps/api/src/domain/adventure.ts          # NEW: resolve choice, ending detection, takeaways, xp award
apps/api/src/application/adventure-service.ts  # NEW: start/resume/choose/restart + XP commit
apps/api/src/application/practice-service.ts   # optional: extract shared applyXpAndStreak helper OR duplicate thin call
apps/api/src/http/routes.ts               # adventure endpoints
apps/api/src/seed.ts                      # seed “Flaky Friday” (or named) adventure graph
apps/web/src/pages/AdventurePage.tsx      # NEW: immersive scene + choices + summary
apps/web/src/pages/HomePage.tsx           # Adventure entry card/CTA
apps/web/src/App.tsx                      # route /adventure
apps/web/src/lib/api.ts                   # client helpers
apps/web/src/styles.css                   # adventure mode layout (readable prose)
docs/using-quest-deck.md                  # how to play adventure
docs/demo.md                              # optional one-liner for interview demo
tests/unit/                               # domain advance + award + takeaways
tests/api/ or inject                      # choose/resume/complete/replay XP
tests/e2e/                                # @smoke adventure path
```

**Structure Decision**: Extend existing monorepo; new adventure domain/store/service + one web page. No new packages/apps.

## Complexity Tracking

No constitution violations. Justified new module surface (adventure ≠ cards) keeps deck practice untouched and avoids overloading `practice_events` with null card ids.
