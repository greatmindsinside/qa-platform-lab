# REST API Contract Delta: MCQ Cards

Base contract: [`../001-quest-deck/contracts/rest-api.md`](../001-quest-deck/contracts/rest-api.md).  
Only deltas below; all other routes unchanged.

## POST `/api/decks/:id/cards`

Auth: yes (deck admin)

**Open (001, still valid):**

```json
{ "kind": "open", "prompt": "...", "answerHint": "...", "tags": [] }
```

`kind` optional — default `open`.

**MCQ:**

```json
{
  "kind": "mcq",
  "prompt": "...",
  "options": ["...", "...", "...", "..."],
  "correctIndex": 0,
  "tags": []
}
```

| Success | Errors |
| ------- | ------ |
| `201` Card (response **may** omit `correctIndex` for consistency with GET — prefer omit) | `400` invalid shape; `403` not admin; `401/404` |

## GET `/api/decks/:id/cards`

Each item includes `kind`.

| Kind | Fields |
| ---- | ------ |
| `open` | `id`, `deckId`, `kind`, `prompt`, `answerHint`, `tags` |
| `mcq` | `id`, `deckId`, `kind`, `prompt`, `options` (length 4), `tags` |

**MUST NOT** include `correctIndex` on GET.

## POST `/api/cards/:id/practice`

### Open (`kind === open`)

Request: `{ "confidence": "learning" \| "solid" \| "mastered" }`  
Behavior: unchanged from `001`.

### MCQ (`kind === mcq`)

Request:

```json
{ "selectedIndex": 0 }
```

Success `200`:

```json
{
  "correct": true,
  "correctIndex": 2,
  "xpAwarded": 15,
  "totalXp": 15,
  "level": 1,
  "title": "Apprentice",
  "currentStreak": 1,
  "xpIntoLevel": 15,
  "xpToNextLevel": 85
}
```

| Case | `correct` | `xpAwarded` |
| ---- | --------- | ----------- |
| selected === correct | `true` | `15` |
| selected !== correct | `false` | `5` |

Errors: `400` wrong payload for kind / index out of range; `401/404`.

## Authz

Unchanged from `001`: membership for deck delete/invite; card create = deck admin.
