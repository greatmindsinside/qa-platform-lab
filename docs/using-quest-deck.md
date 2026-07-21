# Using Quest Deck

Quest Deck is the **interview-prep product** in this lab: practice real QA/SDET and behavioral questions along a **Beginner → Intermediate → Expert** path, rate confidence, and earn light RPG progression (XP, levels, titles, streaks).

> **Status:** Learning-path curriculum (`003`) plus **Adventure** (`005`) on top of MVP + MCQ. Commands below work after `yarn install` and shared package builds.

## Who this is for

- **You (job seeker)** — daily rehearsal before interviews (use **admin** or **member** seed account)  
- **A mentor / study partner** — already a member on seeded decks; or invite to a deck you create  
- **Hiring managers** — see [README](../README.md); they care more about the test system than grinding cards

## Prerequisites

- Node.js ≥ 22  
- Yarn 1 (classic)

```bash
yarn install
yarn workspace @lab/shared build
yarn dev
```

Default URLs: API `http://127.0.0.1:3333`, web `http://127.0.0.1:5173` (Vite proxies `/api`; falls back if the port is busy).  
Optional: `yarn dev:api` / `yarn dev:web` in separate terminals.  
Fresh demo DB recommended after curriculum changes: delete `apps/api/data/*.db` or run the e2e reset script. Restarting the API also runs seed cleanup that **removes legacy pre-path demo decks** (e.g. “Playwright & E2E”) so they do not clutter Your decks.

## Seed accounts

| Email | Password | Notes |
| ----- | -------- | ----- |
| `admin@lab.local` | `Admin123!` | Deck admin on seeded decks; can invite & delete |
| `member@lab.local` | `Member123!` | Deck **member** on all curriculum decks day one; can practice; cannot delete |

These are **public demo secrets** for the portfolio lab—not production credentials.

## Adventure (story mode)

Sidebar **Quests** opens a short choice-driven story (**Flaky Friday**) that teaches QA judgment (flakes, severity, evidence). Separate from deck Practice.

1. Open **Quests** → read the scene → tap a choice (no command parser).  
2. Leave mid-run → return and **Restart** / **Undo** as needed.  
3. Finish → see **What you practiced** takeaways → **← Home**.  
4. First completion awards **+25 XP** and counts as a practice day for streak; **replay** is allowed for learning but awards **+0 XP**.

Design: [`specs/005-qa-adventure/`](../specs/005-qa-adventure/).

## Learning path (Beginner → Expert)

Home groups curriculum decks by stage. Soft guidance only — no unlock gates.

| Stage | Seeded deck | Notes |
| ----- | ----------- | ----- |
| **Beginner** | **QA Foundations** (**Start here**) | Vocabulary, why quality matters, first wins; open + MCQ mixed |
| **Intermediate** | **Applied Testing Practice** | Waits, flakes, authz scenarios, applied STAR |
| **Expert** | **Quality Strategy & Influence** | Strategy, influence, hard edge cases |

Custom decks you create appear under **Your decks** (no stage) and stay outside the official path.

### One short session

1. Sign in → open **Decks** (or Home **Practice**).  
2. On **QA Foundations**, click **Start Deck** or **Resume Practice**.  
3. Flip open cards / pick A–D on choice cards → **Next** after each grade.  
4. Leave with **← Deck** anytime — progress is saved; resume skips practiced cards.  
5. Finish the remaining cards → session summary → Home XP/streak update.

### Multi-day use

- Day 1–2: Beginner foundations  
- Next: Intermediate applied scenarios  
- Later: Expert strategy / STAR leadership  
You can open Expert anytime — the path recommends order; it does not lock it. Each deck keeps its own practiced counts.

## First prep session (happy path)

1. Sign in as **admin** or **member**.  
2. On **Home**, note XP bar, streak, and the primary **Practice** / **Resume Practice** action.  
3. Open **Decks** → **Continue Learning** or **QA Foundations**.  
4. **Open cards:** flip / **Show hint**, then rate confidence. **Choice cards:** A–D with instant feedback.  
5. Leave mid-deck → return via **Resume Practice** (starts at the first unpracticed card).  
6. Session summary → Home.

Tip: One short session per day keeps the streak.

## Progression (what the numbers mean)

| Mechanic | Meaning |
| -------- | ------- |
| XP | Open: +10 per practice; +5 if confidence **improves**. MCQ: **+15** correct / **+5** incorrect |
| Level | `floor(totalXp / 100) + 1` |
| XP bar | `xpIntoLevel = totalXp % 100` toward the next 100 XP |
| Title | Apprentice → Adventurer → Challenger → Veteran → Staff Contender |
| Streak | Days with ≥1 practice (UTC) |
| Deck % | Share of cards rated `solid` or `mastered` for you |

Exact rules: [`specs/001-quest-deck/data-model.md`](../specs/001-quest-deck/data-model.md). Path design: [`specs/003-learning-path/`](../specs/003-learning-path/).

## Collaboration

1. Curriculum decks already include member — practice immediately as either account.  
2. As deck **admin**, create a new deck → invite with role `member` or `admin`.  
3. Deck **members** cannot delete (403)—membership role, not global role.

## Create your own cards

As deck admin: create decks/cards (`open` or `mcq`). New decks are **not** curriculum-staged. Card edit/delete out of scope.

## Verify the quality system (portfolio path)

```bash
yarn lint
yarn test:unit
yarn test:smoke
```

See also: [`docs/demo.md`](./demo.md).

## What Quest Deck is not

No AI interviewer, hard path locks, spaced-repetition scheduler, streak freezes, leaderboards, or card edit/delete.

**Shipped:** MVP (`001`) + MCQ (`002`) + learning path curriculum (`003`).

## Need to change how it works?

Follow [Spec-Driven Development](./spec-driven-development.md): edit the feature spec first, then tasks, then code.
