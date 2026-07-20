# REST API Contract (delta): Learning Path

Base: existing `001` / `002` contracts. Only deltas below.

## Shared types (`@lab/shared`)

```ts
type LearningStage = 'beginner' | 'intermediate' | 'expert';

type Deck = {
  id: number;
  name: string;
  description: string;
  masteryPercent?: number;
  stage: LearningStage | null;
  recommendedStart: boolean;
};
```

## GET `/api/decks`

**Success `200`**: `Deck[]` — each item MUST include `stage` (`null` when unset) and `recommendedStart` (boolean).

No new query params. Ordering MAY remain insertion/id order; **Home** is responsible for stage grouping.

## POST `/api/decks`

**Request** (unchanged body): `{ name, description? }`

**Success `201`**: `Deck` with `stage: null`, `recommendedStart: false`.

Clients MUST NOT send `stage` / `recommendedStart` in this feature (ignore or 400 if sent — prefer ignore for backward compatibility).

## PATCH `/api/decks/:id`

Unchanged body (`name?`, `description?`). Does **not** expose stage editing in this feature.

## Unchanged

- Auth, memberships, cards, practice (open + MCQ), XP/streak responses
- No curriculum-specific endpoints
