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
| [Quality architecture](docs/quality-architecture.md) | Test pyramid & tags |
| [Demo script](docs/demo.md) | 5-minute interview walkthrough |

## Quick start

- Node.js **≥ 22**
- Yarn 1 (classic) — `corepack enable` then `yarn` (packageManager pinned)
- On Windows: use **Git Bash** (workspace default terminal; Spec Kit scripts are `.sh`)

```bash
yarn install
yarn workspace @lab/shared build
yarn workspace @lab/testkit build
yarn test:unit
yarn test:smoke
```

Prep UI (API + web in one command):

```bash
yarn install
yarn workspace @lab/shared build
yarn dev
```

Open `http://127.0.0.1:5173` — API listens on `3333` (Vite proxies `/api`).  
Optional split terminals: `yarn dev:api` / `yarn dev:web`.

Sign in: `admin@lab.local` / `Admin123!` or `member@lab.local` / `Member123!`.

## Spec-Driven Development

Canonical artifacts: [constitution](.specify/memory/constitution.md), [`specs/001-quest-deck/`](specs/001-quest-deck/), Phase 2 MCQ (shipped) in [`specs/002-mcq-cards/`](specs/002-mcq-cards/).

## Out of scope for MVP

AI interviewer, boss fights, spaced repetition, streak freezes, leaderboards, OAuth, email, Postgres, card edit/delete — see constitution and feature spec.
