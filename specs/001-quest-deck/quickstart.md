# Quickstart

## Prerequisites

- Node.js ≥ 22
- Yarn 1 (classic)
- Spec Kit CLI optional: `uv tool install specify-cli` (already used to scaffold this repo)

## How to use (guides)

| Guide | Path |
| ----- | ---- |
| Docs index | [`docs/README.md`](../../docs/README.md) |
| Spec Kit / SDD workflow | [`docs/spec-driven-development.md`](../../docs/spec-driven-development.md) |
| Quest Deck product usage | [`docs/using-quest-deck.md`](../../docs/using-quest-deck.md) |

## After MVP is implemented

```bash
yarn install
yarn workspace @lab/shared build
yarn test:unit
yarn test:smoke
```

Prep session:

```bash
yarn dev
```

Open `http://127.0.0.1:5173`. Sign in as `admin@lab.local` / `Admin123!` → practice a STAR or Playwright card → use Show hint → rate confidence.  
Details: [Using Quest Deck](../../docs/using-quest-deck.md).

## Spec-driven workflow (now)

Canonical artifacts:

| Artifact | Path |
| -------- | ---- |
| Constitution | `.specify/memory/constitution.md` |
| Spec | `specs/001-quest-deck/spec.md` |
| Plan | `specs/001-quest-deck/plan.md` |
| Tasks | `specs/001-quest-deck/tasks.md` (T001–T027) |


Cursor skills: `/speckit-constitution`, `/speckit-specify`, `/speckit-plan`, `/speckit-tasks`, `/speckit-implement`, `/speckit-analyze`.  
Full instructions: [Spec-Driven Development](../../docs/spec-driven-development.md).
