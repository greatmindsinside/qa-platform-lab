# Data Model: MCQ Cards (delta on 001)

Extends [`../001-quest-deck/data-model.md`](../001-quest-deck/data-model.md). Unchanged entities omitted.

## Card (extended)

| Field | Type | Notes |
| ----- | ---- | ----- |
| kind | `open` \| `mcq` | default `open` |
| options | string[4] \| null | required when `mcq`; stored as JSON |
| correctIndex | 0\|1\|2\|3 \| null | required when `mcq`; **never returned on GET** |
| prompt | string | question text |
| answerHint | string | open cards only (ignored/empty for mcq) |
| tags | string[] | optional |

## PracticeEvent (extended)

| Field | Type | Notes |
| ----- | ---- | ----- |
| selectedIndex | number \| null | MCQ only |
| wasCorrect | boolean \| null | MCQ only |
| confidence | Confidence \| null | open cards; MCQ may store mapped confidence or null |
| xpAwarded | number | always set |

## CardProgress

Unchanged shape. For MCQ, `confidence` is set by `confidenceAfterMcq` after each attempt so `deckMasteryPercent` still works.

## Domain functions (pure)

```ts
gradeMcq(selectedIndex: number, correctIndex: number): boolean

xpForMcq(wasCorrect: boolean): number
// true → 15; false → 5

confidenceAfterMcq(
  prev: Confidence | null,
  wasCorrect: boolean,
): Confidence
// !wasCorrect → 'learning'
// wasCorrect && (prev === 'solid' || prev === 'mastered') → 'mastered'
// wasCorrect otherwise → 'solid'
```

Open-card functions from `001` (`xpForPractice`, etc.) unchanged.

## Seed

- Deck name: **QA fundamentals (MCQ)**
- ≥4 MCQ cards (topics: Playwright locators, HTTP status/authz, flake policy, test pyramid)
- Memberships: admin = `admin`; member = `member` (same pattern as `001`)
