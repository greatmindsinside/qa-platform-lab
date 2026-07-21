# Research: QA Text Adventure

## Decision: Choice-driven graph (not free-text parser)

**Rationale**: Spec FR-003 / Assumptions — modern equivalent of Zork is branching interactive fiction with labeled choices. A verb-noun parser is high effort, weak mobile UX, and invites “guess the verb” friction unrelated to QA learning.

**Alternatives considered**:
- Classic parser + synonym lists — nostalgic but YAGNI and a11y-hostile; rejected.
- Hybrid (choices + optional typed commands) — doubles surface area; rejected for v1.
- LLM dungeon master — constitution non-goal (AI interviewer family); rejected.

## Decision: Seeded content tables (not JSON file only)

**Rationale**: Progress needs stable scene/choice ids; SQLite matches existing seed/migrate patterns (`db.ts` + `seed.ts`). Authoring stays in seed TypeScript for v1 (one adventure).

**Alternatives considered**:
- Single JSON blob column for whole graph — harder to validate referential integrity; rejected.
- Markdown/Ink runtime — new dependency; rejected for YAGNI.
- Hardcode graph only in memory — loses durable ids across restarts for progress FKs; prefer tables + seed upsert.

## Decision: Separate `adventure_*` tables (not reuse cards/decks)

**Rationale**: Adventures are linear/branching scenes with choices, not confidence/MCQ practice. Overloading cards would corrupt mastery %, practice events, and Home curriculum grouping.

**Alternatives considered**:
- Deck of “story cards” — fights FR-001 distinct mode and mastery semantics; rejected.
- Store progress only, graph in code module — viable for one adventure, but seed tables keep API list/get consistent and allow a second adventure later without redesign.

## Decision: Reuse `nextStreak` / user XP update path; fixed +25 award

**Rationale**: Spec locks +25 first completion, +0 replay; level/title formulas unchanged. Domain helper `xpForAdventureCompletion(awardAlreadyGranted)` returns 25 or 0; application commits via existing user store fields (`total_xp`, `current_streak`, `last_practice_date`) same as practice.

**Alternatives considered**:
- Partial XP per scene — spec explicitly no for v1; rejected.
- Separate adventure streak — splits habit loop; rejected.
- Log into `practice_events` with null `card_id` — schema/FK smell; prefer `adventure_progress.award_granted` + optional `adventure_events` only if audit needed (v1: progress flags enough).

## Decision: Takeaways from path tags on choices + ending

**Rationale**: Spec FR-006 / LearningTakeaway entity. Each choice may carry `lessonTags: string[]` (stable ids like `flake-risk`, `severity`, `evidence`). On ending, union tags from chosen path → map to plain-language takeaway strings for summary. Guarantees ≥1 takeaway by tagging every ending with a default lesson.

**Alternatives considered**:
- Free-form summary text only on ending — loses path-sensitive emphasis (SC-003); weaker.
- AI-generated summary — out of scope; rejected.

## Decision: Per-user progress row with resume + explicit restart

**Rationale**: FR-007. Store `current_scene_id`, `status` (`in_progress` | `completed`), `award_granted`, `chosen_choice_ids` (JSON array) for takeaway replay of path. Restart clears path and returns to start scene; completed adventures can Restart into a new in-progress run without clearing `award_granted`.

**Alternatives considered**:
- Client-only localStorage progress — breaks multi-device and E2E determinism; rejected.
- Auto-restart on revisit after complete — blocks intentional resume semantics; reject; show summary + Replay CTA instead.

## Decision: First adventure theme — “Flaky Friday” release triage

**Rationale**: Spec setting (CI flake / release / evidence). Short enough for ≤10 minutes: ~8–12 scenes, ≥1 major branch, ≥2 ending tones (stronger investigation vs rushed ship). Teaches flake/wait risk, severity vs priority, evidence in a bug report.

**Alternatives considered**:
- Pure fantasy dungeon with QA metaphors — witty but muddies SC-002 naming of QA concepts; rejected for v1.
- Multiple adventures — out of scope; one seed only.

## Decision: Home entry + `/adventure` immersive page

**Rationale**: FR-001 / FR-011. Home shows Adventure panel (title, blurb, Continue/Start). Full scene UI is its own route so deck lists don’t compete with prose. No faux-CRT skin; use existing Quest Deck visual language with larger reading measure.

**Alternatives considered**:
- Modal over Home — cramped for prose; rejected.
- Embed as a curriculum deck stage — conflates modes; rejected.

## Decision: Quality tags

**Rationale**: FR-012 + constitution. Unit: pure graph resolve + XP helper. API: choose/resume/complete/replay. E2E `@smoke`: member → Adventure → finish via shortest path → Home XP ≥ prior + 25 (first time). Optional `@progression` on award/replay.

**Alternatives considered**: Only E2E — too slow to lock domain; rejected.
