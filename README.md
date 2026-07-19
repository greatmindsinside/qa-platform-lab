# qa-platform-lab

[![ci](https://github.com/greatmindsinside/qa-platform-lab/actions/workflows/ci.yml/badge.svg)](https://github.com/greatmindsinside/qa-platform-lab/actions/workflows/ci.yml)

**Quest Deck** — a gamified interview-prep app you can actually use, plus the TypeScript quality system that owns it (unit → API → E2E → cross-layer).

Built for two outcomes at once:

1. **Interview prep** — practice QA/SDET and behavioral (STAR) prompts with XP, levels, titles, and streaks
2. **Job portfolio** — prove quality-engineering ownership to hiring managers (owned AUT, risk-based tests, CI gates)

> Designed and owned a full-stack TypeScript quality system (unit → API → E2E → cross-layer) with RBAC and progression-rule coverage for a gamified interview-prep app.

## How to use this repo

**Start here → [docs/README.md](docs/README.md)**

| Guide | For |
| ----- | --- |
| [Spec-Driven Development (Spec Kit)](docs/spec-driven-development.md) | Building/changing with agents — constitution → spec → plan → tasks → implement |
| [Using Quest Deck](docs/using-quest-deck.md) | Interview prep once the app is running |

## Current status

| Area | State |
| ---- | ----- |
| SDD toolchain | **GitHub Spec Kit** initialized (Cursor agent skills) |
| Constitution | **Ratified** — [`.specify/memory/constitution.md`](.specify/memory/constitution.md) |
| Feature spec / plan / tasks | **Ready** — [`specs/001-quest-deck/`](specs/001-quest-deck/) |
| How-to docs | **Ready** — [`docs/`](docs/) |
| App / API / UI | **Not started** — implement via [`tasks.md`](specs/001-quest-deck/tasks.md) |
| Tests & CI | Docs CI green; app smoke gates pending MVP |
| Clone → `test:smoke` in 5 minutes | **Pending** MVP |

## Spec-Driven Development (summary)

This repo uses **[GitHub Spec Kit](https://github.com/github/spec-kit)**. Specs are the source of truth; code follows. Full walkthrough: [docs/spec-driven-development.md](docs/spec-driven-development.md).

| Artifact | Path |
| -------- | ---- |
| Constitution | [`.specify/memory/constitution.md`](.specify/memory/constitution.md) |
| Spec | [`specs/001-quest-deck/spec.md`](specs/001-quest-deck/spec.md) |
| Plan | [`specs/001-quest-deck/plan.md`](specs/001-quest-deck/plan.md) |
| Tasks | [`specs/001-quest-deck/tasks.md`](specs/001-quest-deck/tasks.md) |
| Quickstart | [`specs/001-quest-deck/quickstart.md`](specs/001-quest-deck/quickstart.md) |

Cursor skills: `/speckit-constitution`, `/speckit-specify`, `/speckit-plan`, `/speckit-tasks`, `/speckit-implement`, `/speckit-analyze`.

Historical brainstorming was migrated into Spec Kit; see [`docs/`](docs/) and [`specs/001-quest-deck/`](specs/001-quest-deck/).

## What Quest Deck will be

- **Decks & cards** — seeded Playwright, API/authz, and Behavioral (STAR) prompts (≥4 cards each)
- **Practice loop** — prompt → optional hint → rate confidence → XP
- **RPG-lite** — XP, levels, titles, streaks (formulas locked in the spec)
- **RBAC** — invite a mentor; only deck admins can delete

**Stack (planned):** Node 22+, TypeScript (strict), Fastify, SQLite, React/Vite, Vitest, Playwright, GitHub Actions.

## Requirements (when MVP lands)

- Node.js **≥ 22**
- Yarn 1 (classic)

```bash
yarn install
yarn workspace @lab/shared build
yarn test:unit
yarn test:smoke
```

## Out of scope for MVP

AI interviewer, boss fights, spaced repetition, streak freezes, leaderboards, OAuth, email, Postgres, Allure, axe, k6, Pact — see the constitution and feature spec.
