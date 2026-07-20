# Quickstart: Validate Memory Tips

## Prerequisites

```bash
yarn install
yarn workspace @lab/shared build
# Prefer clean DB so seed tips apply
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
2. Open the **Start here** Beginner deck → **Practice**.
3. Open card: flip → confirm **Remember this** appears when the card has a tip; collapsed tip does not block auto-advance.
4. Expand **Remember this** → confirm auto-advance **pauses**; collapse or continue → session proceeds.
5. MCQ card with a tip: select an option → after grade, tip appears; tip was not visible before grade.
6. Open **How to remember** on the practice screen → see 2–4 short techniques; practice still usable.
7. As **admin**, create a card with an optional Memory tip (≤200 chars) → practice it and see the tip after reveal/grade.
8. Create a card with a tip longer than 200 chars → expect validation error.

## Contract spot-checks (optional)

- `GET /api/decks/:id/cards` — open tipped cards include `memoryTip`; MCQ cards never include `memoryTip` or `correctIndex`.
- `POST /api/cards/:id/practice` (MCQ) — response may include `memoryTip` after grade.

## Automated

```bash
yarn lint
yarn typecheck
yarn test:unit
yarn test:smoke
```

Expect coverage for tip length validation, MCQ GET omission, and E2E tip after flip or grade.

## Docs check

- [docs/using-quest-deck.md](../../docs/using-quest-deck.md) — one paragraph on the “remember” habit (flip/grade → read hook → optional teach-back → next)
