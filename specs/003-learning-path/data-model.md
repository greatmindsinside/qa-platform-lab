# Data Model: Learning Path (delta on 001 / 002)

Extends [`../001-quest-deck/data-model.md`](../001-quest-deck/data-model.md) and [`../002-mcq-cards/data-model.md`](../002-mcq-cards/data-model.md). Unchanged entities omitted.

## LearningStage

```ts
type LearningStage = 'beginner' | 'intermediate' | 'expert';
```

Canonical display labels: Beginner | Intermediate | Expert.

## Deck (extended)

| Field | Type | Notes |
| ----- | ---- | ----- |
| id | number | existing |
| name | string | existing |
| description | string | existing |
| masteryPercent | number? | existing (caller-specific) |
| stage | LearningStage \| null | **new** — null/unset = outside curriculum |
| recommendedStart | boolean | **new** — at most one seeded deck true; must be `stage: 'beginner'` when true |

### Validation

- `stage` if set MUST be one of `beginner` | `intermediate` | `expert`.
- `recommendedStart: true` MUST imply `stage === 'beginner'` (seed invariant; API may coerce/reject invalid combos on create if ever exposed).
- User `POST /api/decks` MUST create with `stage: null`, `recommendedStart: false` (no stage picker in this feature).
- Seed MUST ensure exactly one `recommendedStart: true` curriculum deck.

### SQLite (migration)

```sql
ALTER TABLE decks ADD COLUMN stage TEXT NULL;
ALTER TABLE decks ADD COLUMN recommended_start INTEGER NOT NULL DEFAULT 0;
```

Idempotent migrate for existing DBs; seed replace targets fresh/reset demo DB.

## Card

Unchanged shape from `002`. Curriculum cards SHOULD include tags such as `beginner`|`intermediate`|`expert` plus topic tags (`playwright`, `api`, `strategy`, `star`, …) for discovery (FR-007).

## Seed curriculum invariants

| Rule | Minimum |
| ---- | ------- |
| Stages present | beginner, intermediate, expert |
| Decks per stage | 1–3 |
| Cards per stage (sum) | ≥8 |
| Largest deck per stage | ≥6 cards |
| Kinds per stage | ≥1 open and ≥1 mcq |
| Mixed in-deck | open + mcq may share a deck |
| Memberships | admin = admin; member = member on all curriculum decks |
| Legacy decks | not re-created (Playwright & E2E, API testing & authz, Behavioral (STAR), QA fundamentals (MCQ)) |

## Home grouping (client)

Order:

1. Beginner section (decks with `stage === 'beginner'`, recommended first)
2. Intermediate
3. Expert
4. Your decks (`stage == null`)

No hard locks between sections.
