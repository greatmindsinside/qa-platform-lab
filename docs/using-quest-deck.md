# Using Quest Deck

Quest Deck is the **interview-prep product** in this lab: practice real QA/SDET and behavioral questions, rate confidence, and earn light RPG progression (XP, levels, titles, streaks).

> **Status:** App not shipped yet. Steps below match the approved spec; commands work after MVP tasks in [`specs/001-quest-deck/tasks.md`](../specs/001-quest-deck/tasks.md) are done.

## Who this is for

- **You (job seeker)** — daily rehearsal before interviews  
- **A mentor / study partner** — invited as a deck `member`  
- **Hiring managers** — see [README](../README.md); they care more about the test system than grinding cards

## Prerequisites (when MVP exists)

- Node.js ≥ 22  
- Yarn 1 (classic)

```bash
yarn install
yarn workspace @lab/shared build
yarn dev:api
yarn dev:web
```

Default URLs (planned): API `http://127.0.0.1:3333`, web `http://127.0.0.1:5173`.

## Seed accounts

| Email | Password | Notes |
| ----- | -------- | ----- |
| `admin@lab.local` | `Admin123!` | Owns seeded decks; can invite & delete |
| `member@lab.local` | `Member123!` | Practice after invite; cannot delete decks |

These are **public demo secrets** for the portfolio lab—not production credentials.

## First prep session (happy path)

1. Sign in as **admin**.  
2. On **Home**, note level, title, XP bar, and streak.  
3. Open a seeded deck:
   - **Playwright & E2E**
   - **API testing & authz**
   - **Behavioral (STAR)** — always useful for interviews  
4. Open a card → **Practice**.  
5. Read the prompt; optionally click **Show hint** for the study cue (`answerHint`).  
6. Rate confidence: **Learning** / **Solid** / **Mastered**.  
7. Confirm XP feedback, then return Home — streak/XP should reflect the practice.

Tip: One short session per day is enough to keep a streak (by design).

## Progression (what the numbers mean)

| Mechanic | Meaning |
| -------- | ------- |
| XP | Effort — +10 per practice; +5 if confidence **improves** vs last time on that card |
| Level | `floor(totalXp / 100) + 1` |
| Title | Apprentice → Adventurer → Challenger → Veteran → Staff Contender |
| Streak | Days with ≥1 practice (UTC); updated when you practice, not when you only open the app |
| Deck % | Share of cards rated `solid` or `mastered` for you |

Exact rules are locked in [`specs/001-quest-deck/data-model.md`](../specs/001-quest-deck/data-model.md).

## Collaboration

1. As deck **admin**, open a deck → invite `member@lab.local` with role `member`.  
2. Sign in as member → practice that deck.  
3. Member **cannot** delete the deck (403)—server-enforced RBAC.

Use this with a real mentor: share the admin account carefully or create a new deck and invite their seeded/local user once multi-user seeding expands.

## Create your own cards

As deck admin you can create decks and add cards (prompt + optional hint). Good uses:

- Company-specific questions from a job posting  
- Weak areas (e.g. “contract testing”)  
- STAR stories you want to rehearse out loud  

## Verify the quality system (portfolio path)

```bash
yarn test:unit
yarn test:smoke
```

See also the interview demo script (ships with MVP Task T023): `docs/demo.md` (created during implementation).

## What Quest Deck is not (MVP)

No AI interviewer, timers/boss mode, spaced-repetition scheduler, streak freezes, or leaderboards. Those are Phase 2+ in the constitution—add them via Spec Kit, not by sneaking into code.

## Need to change how it works?

Follow [Spec-Driven Development](./spec-driven-development.md): edit the feature spec first, then tasks, then code.
