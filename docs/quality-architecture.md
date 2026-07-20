# Quality architecture

Quest Deck’s quality system is the portfolio half of the dual north star: the same product you practice with is the AUT under a layered test pyramid.

Folder-level map and risk → file table: [`tests/README.md`](../tests/README.md).

## Layers

| Layer | Tool | Location | What it proves |
| ----- | ---- | -------- | -------------- |
| Unit / inject | Vitest | `tests/unit/` | Domain XP/streak/RBAC/MCQ; Fastify inject for health/login/practice/delete |
| API | Playwright | `tests/api/` | HTTP against a live API (`@smoke`, `@auth`, `@rbac`, `@progression`) |
| E2E | Playwright | `tests/e2e/` | Browser login → practice → Home streak / learning path |
| Cross-layer | Playwright | `tests/cross-layer/` | API invite + UI visibility (`@mutation`) |

## Tags

- `@smoke` — PR gate (~clone → green)
- `@auth` — login / session
- `@rbac` — membership-based delete
- `@progression` — XP / streak / learning path
- `@mutation` — state-changing flows
- `@a11y` — axe-core serious/critical baseline
- `@perf` — soft API latency smoke (not full load)

## Traceability matrix

| Risk / concern | Spec package | Unit | API | E2E / cross-layer | CI gate |
| -------------- | ------------ | ---- | --- | ----------------- | ------- |
| Membership RBAC on delete | [`001-quest-deck`](../specs/001-quest-deck/) · [contract](../specs/001-quest-deck/contracts/rest-api.md) | [`rbac.test.ts`](../tests/unit/rbac.test.ts) | [`rbac-delete.spec.ts`](../tests/api/rbac-delete.spec.ts) | — | `@smoke` + `@rbac` on PR |
| XP / streak / improve bonus | [`001-quest-deck`](../specs/001-quest-deck/) · [data model](../specs/001-quest-deck/data-model.md) | [`progression.test.ts`](../tests/unit/progression.test.ts) | [`practice-xp.spec.ts`](../tests/api/practice-xp.spec.ts) | [`practice.spec.ts`](../tests/e2e/practice.spec.ts) | `@smoke` + `@progression` on PR |
| MCQ grading + XP | [`002-mcq-cards`](../specs/002-mcq-cards/) | [`mcq-grading.test.ts`](../tests/unit/mcq-grading.test.ts) · [`api-mcq.test.ts`](../tests/unit/api-mcq.test.ts) | [`mcq-practice.spec.ts`](../tests/api/mcq-practice.spec.ts) | [`mcq-practice.spec.ts`](../tests/e2e/mcq-practice.spec.ts) | `@smoke` + `@progression` on PR |
| Auth / session | [`001-quest-deck`](../specs/001-quest-deck/) | [`api-quest-deck.test.ts`](../tests/unit/api-quest-deck.test.ts) (inject) | [`auth.spec.ts`](../tests/api/auth.spec.ts) | [`login.spec.ts`](../tests/e2e/login.spec.ts) | `@smoke` + `@auth` on PR |
| Soft learning path | [`003-learning-path`](../specs/003-learning-path/) | [`path-grouping.test.ts`](../tests/unit/path-grouping.test.ts) · [`deck-stage.test.ts`](../tests/unit/deck-stage.test.ts) | — | [`learning-path.spec.ts`](../tests/e2e/learning-path.spec.ts) | `@smoke` + `@progression` on PR |
| Invite → member visibility | [`001-quest-deck`](../specs/001-quest-deck/) | — | — | [`invite.spec.ts`](../tests/cross-layer/invite.spec.ts) | `@smoke` + `@mutation` on PR |
| Accessibility baseline | product UX | — | — | [`a11y.spec.ts`](../tests/e2e/a11y.spec.ts) | `@smoke` + `@a11y` on PR |
| API latency smoke | practice path | — | [`perf-smoke.spec.ts`](../tests/api/perf-smoke.spec.ts) | — | `@smoke` + `@perf` on PR |

## Local commands

```bash
yarn lint
yarn typecheck
yarn test:unit
yarn test:smoke
yarn test:all
```

PR CI runs lint, typecheck, unit, and `@smoke`. Pushes to `main` run the full Playwright suite (see [`.github/workflows/ci.yml`](../.github/workflows/ci.yml)).

## Authz test obligation

At least one test proves delete uses **deck membership** role: a global `member` with deck `admin` membership can delete (204), while deck `member` gets 403. Covered by [`tests/api/rbac-delete.spec.ts`](../tests/api/rbac-delete.spec.ts) and [`tests/unit/rbac.test.ts`](../tests/unit/rbac.test.ts).

## Helpers

[`scripts/reset-e2e-db.mjs`](../scripts/reset-e2e-db.mjs) resets the Playwright e2e SQLite DB so local runs start from a clean seed.
