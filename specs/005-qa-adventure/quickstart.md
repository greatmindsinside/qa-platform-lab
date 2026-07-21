# Quickstart: Validate QA Text Adventure

## Prerequisites

```bash
yarn install
yarn workspace @lab/shared build
# Prefer clean DB so adventure seed applies
yarn reset-e2e-db   # or delete apps/api/data/*.db then restart API
yarn dev
```

API `http://127.0.0.1:3333` · Web `http://127.0.0.1:5173`.

## Seed accounts

| Email | Password |
| ----- | -------- |
| `admin@lab.local` | `Admin123!` |
| `member@lab.local` | `Member123!` |

## Manual validation (≤10 min)

1. Sign in as **member**. Note Home **XP** and **streak**.
2. Confirm Home shows an **Adventure** entry (title/blurb), distinct from Beginner deck Practice.
3. Open Adventure → read scene prose → pick a choice → scene advances (no command-line parser).
4. Leave mid-adventure → Home → open Adventure again → **resume** same scene.
5. Finish via any path → see **summary takeaways** (≥1 QA concept in plain language) + return to Home.
6. Confirm XP increased by **25** on first completion (if no prior award) and streak reflects a practice day when appropriate.
7. **Restart** / replay → finish again → XP does **not** increase by another 25 (`xpAwarded` 0).
8. Optional: second playthrough with opposite major choice → different ending tone and/or takeaway emphasis.

## Contract spot-checks (optional)

- `GET /api/adventures` — one seeded summary with `progressStatus`.
- `GET /api/adventures/:id/scene` — body + choices (or ending + takeaways).
- `POST /api/adventures/:id/choices` — `{ choiceId }` advances; ending returns progression fields.
- `POST /api/adventures/:id/restart` — back to start; `awardGranted` stays true after first win.

## Automated

```bash
yarn lint
yarn typecheck
yarn test:unit
yarn test:smoke
```

Expect unit coverage for choice resolve + award/replay, API/inject for resume/complete, and E2E `@smoke` Home → complete → Home XP.

## Docs check

- [`docs/using-quest-deck.md`](../../docs/using-quest-deck.md) mentions Adventure as a sibling prep mode.
- Optional: [`docs/demo.md`](../../docs/demo.md) one-liner for interview walkthrough.
