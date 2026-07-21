# REST API Contract: QA Text Adventure

Base: existing auth from `001`. All adventure routes require `Authorization: Bearer <token>`.

## Shared types (`@lab/shared`)

```ts
type AdventureSummary = {
  id: number;
  slug: string;
  title: string;
  blurb: string;
  learningThemes: string[];
  /** Derived from caller's progress, if any */
  progressStatus: 'not_started' | 'in_progress' | 'completed';
  awardGranted: boolean;
};

type AdventureChoice = {
  id: number;
  label: string;
};

type LearningTakeaway = {
  id: string;
  label: string;
};

type AdventureSceneView = {
  adventureId: number;
  sceneId: number;
  body: string;
  isEnding: boolean;
  endingTone: 'strong' | 'weak' | null;
  choices: AdventureChoice[];
  /** Present when isEnding */
  takeaways?: LearningTakeaway[];
  xpAwarded?: number; // set on the response that transitions into ending
  totalXp?: number;
  level?: number;
  title?: string;
  currentStreak?: number;
  xpIntoLevel?: number;
  xpToNextLevel?: number;
};
```

## GET `/api/adventures`

**Success `200`**: `AdventureSummary[]`  
Seeded lab returns one item (`flaky-friday`). Empty array allowed if unseeded.

## GET `/api/adventures/:id/scene`

Current scene for the caller (auto-starts progress at start scene if none).

**Success `200`**: `AdventureSceneView`  
If status is `completed` and client has not restarted, return ending scene view with `takeaways` (no additional XP).

**Errors**: `404` unknown adventure.

## POST `/api/adventures/:id/choices`

**Request**: `{ choiceId: number }`

**Success `200`**: `AdventureSceneView` for the next scene.  
If next scene is an ending and `awardGranted` was false → apply +25 XP + streak; include progression fields and `xpAwarded: 25`.  
If award already granted → `xpAwarded: 0` still may include progression fields after streak update when applicable.

**Errors**:
- `404` unknown adventure
- `400` choice not on current scene / adventure not in choosable state (e.g. already on ending without restart)
- `401` missing/invalid token

## POST `/api/adventures/:id/restart`

**Request**: empty body `{}` or none.

**Success `200`**: `AdventureSceneView` at start scene; path cleared; `awardGranted` unchanged.

**Errors**: `404` unknown adventure.

## Unchanged

- Deck/card/practice/membership endpoints
- Level/title formulas
- No free-text command endpoint
