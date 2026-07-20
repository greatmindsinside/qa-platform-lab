# Data Model: Quest Deck

## Entities

### User
| Field | Type | Notes |
| ----- | ---- | ----- |
| id | number | PK |
| email | string | unique |
| passwordHash | string | bcrypt |
| role | `admin` \| `member` | seed/demo only; **never** used alone for deck delete |
| displayName | string | |
| totalXp | number | default 0 |
| currentStreak | number | default 0 |
| lastPracticeDate | string \| null | UTC `YYYY-MM-DD` |

### Deck
| Field | Type | Notes |
| ----- | ---- | ----- |
| id | number | PK |
| name | string | |
| description | string | |
| ownerUserId | number | FK users |

### DeckMember
| Field | Type | Notes |
| ----- | ---- | ----- |
| deckId | number | PK part |
| userId | number | PK part |
| role | `admin` \| `member` | **authz source of truth** for delete/invite |

### Card
| Field | Type | Notes |
| ----- | ---- | ----- |
| id | number | PK |
| deckId | number | FK |
| prompt | string | |
| answerHint | string | shown via Show hint |
| tags | string[] | stored as JSON text |

### CardProgress
| Field | Type | Notes |
| ----- | ---- | ----- |
| userId, cardId | PK | |
| confidence | `learning` \| `solid` \| `mastered` | |
| practiceCount | number | |
| lastPracticedAt | string \| null | |

### PracticeEvent
| Field | Type | Notes |
| ----- | ---- | ----- |
| id | number | PK |
| userId, cardId | FKs | |
| confidence | Confidence | |
| xpAwarded | number | |
| practicedAt | string | |

## Domain formulas (pure functions)

```ts
canDeleteDeck(membershipRole): boolean  // admin only — membership role, not users.role
confidenceRank: learning=0, solid=1, mastered=2
xpForPractice(prev, next): 10 + (improved ? 5 : 0)
levelFromXp(totalXp): floor(totalXp/100)+1
titleForLevel(level): Apprentice|Adventurer|Challenger|Veteran|Staff Contender
nextStreak({ lastPracticeDate, todayUtc, currentStreak })
deckMasteryPercent(confidences): % solid|mastered; empty → 0
xpIntoLevel(totalXp): totalXp % 100
xpToNextLevel(totalXp): xpIntoLevel === 0 ? 100 : 100 - xpIntoLevel
```

## Seed

- Users: admin + member (credentials in `@lab/shared` `SEED_USERS`)
- Decks (≥4 cards each): Playwright & E2E; API testing & authz; Behavioral (STAR)
- Memberships: admin = deck `admin` on all seed decks; **member = deck `member` on all seed decks**
- Card update/delete: not in MVP schema operations
