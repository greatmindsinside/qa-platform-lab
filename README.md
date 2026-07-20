# qa-platform-lab

[![ci](https://github.com/greatmindsinside/qa-platform-lab/actions/workflows/ci.yml/badge.svg)](https://github.com/greatmindsinside/qa-platform-lab/actions/workflows/ci.yml)

**Quest Deck** is a gamified QA/SDET interview-prep app, owned end-to-end as a TypeScript quality proof (unit → API → E2E → cross-layer).

> **Status:** App MVP is implemented and runnable. PR CI runs lint, typecheck, unit, and `@smoke`; `main` runs the full Playwright suite. Spec Kit packages cover the product through learning path (`003`); memory tips (`004`) are specified and planned next.

## Why this repo (for employers)

- **Owned AUT:** a real product under test, not a throwaway demo page
- **Layered test strategy:** Vitest unit + API inject + Playwright E2E/cross-layer, tagged (`@smoke`, `@auth`, `@rbac`, `@mutation`, `@progression`)
- **Meaningful risk:** deck membership RBAC and XP/level/streak progression rules covered in tests
- **Spec-Driven / TDD:** constitution → spec → plan → tasks → implement; domain rules fail first, then minimal code

## What Quest Deck is

Practice interview cards in decks (open flip + MCQ), earn XP/levels/titles/streaks, and follow a soft Beginner → Intermediate → Expert path on Home. Deck admins invite members; delete uses membership role, not a global admin shortcut.

Seeded demos: `admin@lab.local` / `Admin123!` and `member@lab.local` / `Member123!`.

## Stack

Node ≥ 22, Yarn 1, TypeScript, Fastify, SQLite, React/Vite, Vitest, Playwright, ESLint, GitHub Actions.

## Run it (≤5 minutes)

```bash
yarn install
yarn workspace @lab/shared build
yarn workspace @lab/testkit build
yarn test:smoke
```

Prep UI:

```bash
yarn workspace @lab/shared build
yarn dev
```

Open `http://127.0.0.1:5173` (API on `3333`; Vite proxies `/api`).

## What's already in the repo

| Artifact | Link |
| -------- | ---- |
| Project constitution | [`.specify/memory/constitution.md`](.specify/memory/constitution.md) |
| MVP feature (complete) | [`specs/001-quest-deck/`](specs/001-quest-deck/) · [spec](specs/001-quest-deck/spec.md) · [plan](specs/001-quest-deck/plan.md) · [tasks](specs/001-quest-deck/tasks.md) · [API contract](specs/001-quest-deck/contracts/rest-api.md) |
| MCQ cards | [`specs/002-mcq-cards/`](specs/002-mcq-cards/) |
| Learning path | [`specs/003-learning-path/`](specs/003-learning-path/) |
| Quality architecture | [`docs/quality-architecture.md`](docs/quality-architecture.md) |
| 5-minute demo script | [`docs/demo.md`](docs/demo.md) |

## What's next

1. Implement [memory tips](specs/004-memory-tips/) from the plan package (`/speckit-tasks` → implement)
2. Keep `@smoke` green; extend coverage where the new tip field and practice UI need proof

Out of MVP (still): AI interviewer, full SRS/Anki, OAuth, Postgres, card edit/delete. See the constitution.

## For builders (secondary)

| Guide | Use when |
| ----- | -------- |
| [docs/README.md](docs/README.md) | Doc index for both audiences |
| [Spec-Driven Development](docs/spec-driven-development.md) | Changing the product with Spec Kit |
| [Using Quest Deck](docs/using-quest-deck.md) | Interview prep sessions |
| [`.cursor/skills/`](.cursor/skills/) | Agent skills for specify → plan → tasks → implement |
