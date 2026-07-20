# Data Model: Memory Tips (delta on 001–003)

Extends [`../001-quest-deck/data-model.md`](../001-quest-deck/data-model.md), [`../002-mcq-cards/data-model.md`](../002-mcq-cards/data-model.md), and [`../003-learning-path/data-model.md`](../003-learning-path/data-model.md). Unchanged entities omitted.

## Card (extended)

| Field | Type | Notes |
| ----- | ---- | ----- |
| memoryTip | string \| null | Optional; max **200** chars; separate from `answerHint` |
| kind | `open` \| `mcq` | unchanged |
| answerHint | string | Pre-flip only (open); not a substitute for `memoryTip` |
| options / correctIndex | … | MCQ only; `correctIndex` still never on GET |

### Persistence

| Column | SQLite | Notes |
| ------ | ------ | ----- |
| `memory_tip` | `TEXT` nullable | Empty string and NULL both mean “no tip”; prefer NULL on omit |

Migration: `ALTER TABLE cards ADD COLUMN memory_tip TEXT` when missing (same pattern as MCQ/stage migrations).

### Visibility rules

| Surface | Open card | MCQ card |
| ------- | --------- | -------- |
| GET `/api/decks/:id/cards` | Include `memoryTip` when set | **Omit** `memoryTip` |
| POST create `201` response | May include `memoryTip` | Prefer omit (align with GET) |
| POST practice (open) | Tip already on GET; response need not repeat | — |
| POST practice (MCQ grade) | — | Include `memoryTip` when set |

## PracticeEvent

Unchanged. Do **not** persist tip text on events (tip is card content).

## CardProgress / User progression

Unchanged. XP, streak, mastery mapping from `001`/`002` unchanged.

## Memory technique guide (non-persisted)

Not a database entity. Static product copy (2–4 techniques) rendered in practice UI and mirrored in docs:

1. Acronym  
2. Vivid image  
3. Story / STAR link  
4. Teach-back / say-aloud  

## Seed floors (content rules)

| Rule | Floor |
| ---- | ----- |
| Recommended Beginner deck (`recommendedStart: true`) | ≥3 cards with non-empty `memoryTip` |
| Kind mix in that deck | ≥1 open tipped **and** ≥1 MCQ tipped |
| Each curriculum stage | ≥1 tipped card somewhere in that stage’s seeded decks |

Tips should be high-leverage recall hooks (≤200 chars), not full answer restatements.

## Validation (create)

| Input | Result |
| ----- | ------ |
| omitted / `null` / `""` / whitespace-only | Treat as no tip (store null) |
| `1…200` chars after trim | Store trimmed tip |
| `>200` chars after trim | `400` |
