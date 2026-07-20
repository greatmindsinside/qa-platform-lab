# REST API Contract Delta: Memory Tips

Base contracts: [`../001-quest-deck/contracts/rest-api.md`](../001-quest-deck/contracts/rest-api.md), [`../002-mcq-cards/contracts/rest-api.md`](../002-mcq-cards/contracts/rest-api.md), [`../003-learning-path/contracts/rest-api.md`](../003-learning-path/contracts/rest-api.md).  
Only deltas below; all other routes unchanged.

## Shared types (`@lab/shared`)

```ts
type Card = {
  id: number;
  deckId: number;
  kind: CardKind;
  prompt: string;
  answerHint: string;
  tags: string[];
  options?: [string, string, string, string]; // mcq
  /** Present on GET only for open cards when set. Never on GET for mcq. */
  memoryTip?: string;
};

type PracticeResult = {
  xpAwarded: number;
  totalXp: number;
  level: number;
  title: string;
  currentStreak: number;
  xpIntoLevel: number;
  xpToNextLevel: number;
  correct?: boolean;       // mcq
  correctIndex?: number;   // mcq
  /** MCQ grade responses: include when the card has a tip. */
  memoryTip?: string;
};
```

## POST `/api/decks/:id/cards`

Auth: deck admin (unchanged).

**Open:**

```json
{
  "kind": "open",
  "prompt": "...",
  "answerHint": "...",
  "memoryTip": "STAR → Situation first, then Task…",
  "tags": []
}
```

**MCQ:**

```json
{
  "kind": "mcq",
  "prompt": "...",
  "options": ["...", "...", "...", "..."],
  "correctIndex": 0,
  "memoryTip": "Picture a red 401 door vs a yellow 403 lock.",
  "tags": []
}
```

| Field | Rules |
| ----- | ----- |
| `memoryTip` | Optional; omit / empty OK; after trim max **200** chars |

| Success | Errors |
| ------- | ------ |
| `201` Card | `400` tip too long or invalid MCQ/open shape; `403` not admin; `401/404` |

`201` body: follow GET visibility (open may include `memoryTip`; MCQ SHOULD omit).

## GET `/api/decks/:id/cards`

| Kind | `memoryTip` |
| ---- | ----------- |
| `open` | Included when set |
| `mcq` | **MUST NOT** be included (with `correctIndex`) |

## POST `/api/cards/:id/practice`

### Open

Request/XP behavior unchanged. Client may show tip from GET after flip (no API change required).

### MCQ

Request unchanged: `{ "selectedIndex": 0 }`.

Success `200` adds optional tip when present:

```json
{
  "correct": true,
  "correctIndex": 2,
  "memoryTip": "Picture a red 401 door vs a yellow 403 lock.",
  "xpAwarded": 15,
  "totalXp": 15,
  "level": 1,
  "title": "Apprentice",
  "currentStreak": 1,
  "xpIntoLevel": 15,
  "xpToNextLevel": 85
}
```

If the card has no tip, omit `memoryTip` (do not send `null` unless existing style prefers null — prefer omit).

XP values unchanged (15 / 5).

## Unchanged

- Authz, decks, memberships, learning-path `stage` / `recommendedStart`
- Open confidence practice payload and XP formulas
- No new endpoints for techniques or SRS
