# Tests

Layered proof for Quest Deck (the AUT). Unit tests run via Vitest; API / E2E / cross-layer via Playwright projects configured in [`playwright.config.ts`](../playwright.config.ts).

## Pyramid

| Folder | Runner | What it proves |
| ------ | ------ | -------------- |
| [`unit/`](./unit/) | Vitest | Domain rules (XP, streak, RBAC, MCQ grading) + Fastify inject |
| [`api/`](./api/) | Playwright `api` | Live HTTP against the API process |
| [`e2e/`](./e2e/) | Playwright `e2e` | Browser flows (login → practice → Home) |
| [`cross-layer/`](./cross-layer/) | Playwright `cross-layer` | API mutates state; UI asserts the outcome |

Shared Playwright fixtures: [`fixtures.ts`](./fixtures.ts) (`api`, `asAdmin`, `asMember`, `loginAs`). UI login helper: [`helpers/auth.ts`](./helpers/auth.ts). HTTP client: [`packages/testkit`](../packages/testkit/).

## Tags

| Tag | Intent |
| --- | ------ |
| `@smoke` | PR gate — clone → green in CI |
| `@auth` | Login / session |
| `@rbac` | Deck-membership delete (not global admin shortcut) |
| `@progression` | XP / level / streak / learning path |
| `@mutation` | State-changing flows (invite, etc.) |
| `@a11y` | axe-core serious/critical baseline |
| `@perf` | Soft API latency smoke (not k6) |

## Risk → files

| Risk | Why it matters | Primary proof |
| ---- | -------------- | ------------- |
| Membership RBAC | Wrong authz → data loss / privilege bugs | [`unit/rbac.test.ts`](./unit/rbac.test.ts), [`api/rbac-delete.spec.ts`](./api/rbac-delete.spec.ts) |
| XP / streak progression | Core product rules; easy to regress silently | [`unit/progression.test.ts`](./unit/progression.test.ts), [`api/practice-xp.spec.ts`](./api/practice-xp.spec.ts), [`e2e/practice.spec.ts`](./e2e/practice.spec.ts) |
| Per-deck progress + resume | Resume must skip practiced cards; counts stay per deck | [`unit/path-grouping.test.ts`](./unit/path-grouping.test.ts), [`unit/api-quest-deck.test.ts`](./unit/api-quest-deck.test.ts), [`e2e/practice.spec.ts`](./e2e/practice.spec.ts) |
| MCQ grading + XP | Wrong answer must still award +5 XP | [`unit/mcq-grading.test.ts`](./unit/mcq-grading.test.ts), [`api/mcq-practice.spec.ts`](./api/mcq-practice.spec.ts), [`e2e/mcq-practice.spec.ts`](./e2e/mcq-practice.spec.ts) |
| Auth / session | Everything else depends on login | [`api/auth.spec.ts`](./api/auth.spec.ts), [`e2e/login.spec.ts`](./e2e/login.spec.ts) |
| Learning path / Decks UX | Soft Beginner→Expert curriculum + dashboard | [`unit/path-grouping.test.ts`](./unit/path-grouping.test.ts), [`e2e/learning-path.spec.ts`](./e2e/learning-path.spec.ts) |
| Invite → visibility | Cross-layer: API write + UI read | [`cross-layer/invite.spec.ts`](./cross-layer/invite.spec.ts) |

## Commands

```bash
yarn test:unit    # Vitest — tests/unit
yarn test:smoke   # Playwright — grep @smoke (PR gate)
yarn test:all     # Full Playwright suite (main CI)
```

CI: [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) — PRs run lint, typecheck, unit, `@smoke`; `main` runs the full Playwright suite.

## Helpers

- [`scripts/reset-e2e-db.mjs`](../scripts/reset-e2e-db.mjs) — deletes the Playwright e2e SQLite DB (and WAL/SHM) so local smoke runs start from a clean seed.

## Deeper reading

- [Quality architecture](../docs/quality-architecture.md) — layers, tags, traceability matrix
- [Interview demo](../docs/demo.md) — 5-minute walkthrough citing these files
