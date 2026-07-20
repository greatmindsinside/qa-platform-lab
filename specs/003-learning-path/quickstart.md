# Quickstart: Validate Learning Path

## Prerequisites

```bash
yarn install
yarn workspace @lab/shared build
# Prefer clean demo DB so replaced seeds apply cleanly
yarn reset-e2e-db   # or delete apps/api/data/*.db then restart API
yarn dev
```

API `http://127.0.0.1:3333` · Web `http://127.0.0.1:5173` (or Vite fallback port).

## Seed accounts

| Email | Password |
| ----- | -------- |
| `admin@lab.local` | `Admin123!` |
| `member@lab.local` | `Member123!` |

## Manual validation (≤5 min)

1. Sign in as **member**.
2. On Home, confirm sections **Beginner → Intermediate → Expert**, then **Your decks** (empty unless you created one).
3. Confirm exactly one **Start here** badge on a Beginner deck.
4. Click **Practice** on Start here → complete ≥1 open (flip + rate) and ≥1 MCQ in the same session if the deck is mixed.
5. Open an Expert deck without finishing Beginner → practice still works (no lock).
6. As admin, **Create a new deck** → it appears under Your decks with no stage badge.

## Automated

```bash
yarn lint
yarn typecheck
yarn test:unit
yarn test:smoke
```

Expect E2E to target new curriculum names / Start here / card counts — not legacy “Playwright & E2E” / “QA fundamentals (MCQ)” titles.

## Docs check

- [docs/using-quest-deck.md](../../docs/using-quest-deck.md) — learning path, short session vs multi-day
- [docs/demo.md](../../docs/demo.md) — Start here → practice → show Expert reachable
