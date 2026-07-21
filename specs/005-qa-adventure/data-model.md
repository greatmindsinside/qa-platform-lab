# Data Model: QA Text Adventure

Extends Quest Deck user progression from [`../001-quest-deck/data-model.md`](../001-quest-deck/data-model.md). Deck/card practice entities unchanged.

## Adventure

| Field | Type | Notes |
| ----- | ---- | ----- |
| id | number | Stable PK |
| slug | string | Unique; e.g. `flaky-friday` |
| title | string | Display name |
| blurb | string | Short Home teaser |
| startSceneId | number | FK → Scene |
| learningThemes | string[] | High-level tags for Home (optional display) |

### Persistence

| Column | SQLite | Notes |
| ------ | ------ | ----- |
| `id` | INTEGER PK | |
| `slug` | TEXT UNIQUE NOT NULL | |
| `title` | TEXT NOT NULL | |
| `blurb` | TEXT NOT NULL | |
| `start_scene_id` | INTEGER NOT NULL | Set after scenes inserted (or deferred update in seed) |
| `learning_themes_json` | TEXT NOT NULL | JSON array |

## Scene

| Field | Type | Notes |
| ----- | ---- | ----- |
| id | number | |
| adventureId | number | FK |
| key | string | Stable within adventure (`intro`, `ending-strong`, …) |
| body | string | Narrative prose (markdown plain text OK; no HTML required) |
| isEnding | boolean | Terminal scene; choices empty when true |
| endingTone | `strong` \| `weak` \| null | For summary flavor; null if not ending |

### Persistence

| Column | SQLite |
| ------ | ------ |
| `id` | INTEGER PK |
| `adventure_id` | INTEGER NOT NULL |
| `scene_key` | TEXT NOT NULL |
| `body` | TEXT NOT NULL |
| `is_ending` | INTEGER NOT NULL DEFAULT 0 |
| `ending_tone` | TEXT NULL |

Unique `(adventure_id, scene_key)`.

## Choice

| Field | Type | Notes |
| ----- | ---- | ----- |
| id | number | |
| sceneId | number | FK — scene where choice appears |
| label | string | Button text (keep short) |
| nextSceneId | number | FK → Scene |
| lessonTags | string[] | Tags accumulated toward takeaways |
| sortOrder | number | Display order |

### Persistence

| Column | SQLite |
| ------ | ------ |
| `id` | INTEGER PK |
| `scene_id` | INTEGER NOT NULL |
| `label` | TEXT NOT NULL |
| `next_scene_id` | INTEGER NOT NULL |
| `lesson_tags_json` | TEXT NOT NULL DEFAULT `[]` |
| `sort_order` | INTEGER NOT NULL DEFAULT 0 |

## AdventureProgress (per user × adventure)

| Field | Type | Notes |
| ----- | ---- | ----- |
| userId | number | |
| adventureId | number | |
| status | `in_progress` \| `completed` | |
| currentSceneId | number | Last scene shown |
| awardGranted | boolean | True after first completion XP paid |
| chosenChoiceIds | number[] | Path for takeaway derivation |
| updatedAt | string | ISO timestamp |

### Persistence

| Column | SQLite |
| ------ | ------ |
| `user_id` | INTEGER NOT NULL |
| `adventure_id` | INTEGER NOT NULL |
| `status` | TEXT NOT NULL |
| `current_scene_id` | INTEGER NOT NULL |
| `award_granted` | INTEGER NOT NULL DEFAULT 0 |
| `chosen_choice_ids_json` | TEXT NOT NULL DEFAULT `[]` |
| `updated_at` | TEXT NOT NULL |

PK `(user_id, adventure_id)`.

### State transitions

```text
(none) --start/resume--> in_progress
in_progress --choose non-ending--> in_progress (currentScene updates)
in_progress --choose/reach ending--> completed (award if !awardGranted)
completed --restart--> in_progress (clear path; keep awardGranted)
completed --view--> summary (no mutation)
```

## LearningTakeaway (derived, not stored)

| Field | Type | Notes |
| ----- | ---- | ----- |
| id | string | Stable tag id (`flake-risk`, …) |
| label | string | Plain-language sentence for summary UI |

Catalog lives in domain/shared map: tag → label. Ending always contributes ≥1 tag so summary never empty.

## User progression (unchanged formulas)

On first completion with `awardGranted` false:

- `xpAwarded = 25`
- `totalXp += 25`
- `currentStreak = nextStreak({ lastPracticeDate, todayUtc, currentStreak })`
- `lastPracticeDate = todayUtc`
- set `awardGranted = true`

Replay completion: `xpAwarded = 0`; streak still updates if first activity that UTC day (practice-day semantics — treat completion as practice activity even at 0 XP).

## Seed content rules (Flaky Friday)

| Rule | Floor |
| ---- | ----- |
| Scenes | ≥8 including start + ≥2 endings |
| Major branch | ≥1 decision with divergent next scenes |
| Lesson tags | Cover ≥3 of: flake/wait, severity vs priority, evidence, happy vs edge |
| Length | Completable in ≤10 minutes reading + clicking |

## Validation

| Action | Rule |
| ------ | ---- |
| Choose | Choice must belong to `currentSceneId`; else 400 |
| Start | If no progress, create at `startSceneId` |
| Restart | Allowed anytime; resets path + current to start; preserves `awardGranted` |
| Empty catalog | GET list may be `[]`; UI shows unavailable message |
