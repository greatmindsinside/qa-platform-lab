# Research: Memory Tips for Interview Recall

## Decision: Separate `memoryTip` column (not reuse `answerHint`)

**Rationale**: Spec clarification and Assumptions — `answerHint` is pre-flip rehearsal support; `memoryTip` is post-reveal recall hook. Overloading hint would mix two UX moments and break “Show hint” semantics on open cards.

**Alternatives considered**:
- Store tip inside `answerHint` with delimiter — fragile parsing; rejected.
- Second hint field named `mnemonic` — synonym noise; prefer `memoryTip` per spec.

## Decision: Kind-aware GET visibility

**Rationale**: Clarification Session 2026-07-19 Q1 Option B. Open tips may ride on GET (UI gates until flip), matching how `answerHint` already works. MCQ tips can imply the correct option → omit on GET like `correctIndex`; return on grade response only.

**Implementation sketch**:
- `mapCard(row)`: if `kind === 'open'` and tip present → set `memoryTip`; if `kind === 'mcq'` → never set `memoryTip`.
- `practice` MCQ success payload: include `memoryTip` when stored tip non-empty.

**Alternatives considered**:
- Withhold for all kinds until practice POST — forces open tip to wait for confidence submit; worse flip UX; rejected.
- Include tip on GET for all kinds — leaks MCQ answer cues; rejected.
- Separate reveal endpoint — YAGNI; rejected.

## Decision: Max length 200, empty/omit allowed

**Rationale**: Spec FR-001/007. Validate in application layer on create (`trim`; empty → store null/empty; `length > 200` → 400). No min length.

**Alternatives considered**: Soft truncate — hides author error; prefer hard 400.

## Decision: Collapsible **Remember this** + expand pauses auto-advance

**Rationale**: Clarifications Q4 Option B. Collapsed default preserves deck play speed; expand pauses `DeckPracticePage` timer until collapse or explicit continue so tips are readable.

**Alternatives considered**:
- Never pause — tip becomes unreadable under countdown; rejected.
- Disable auto-advance on tipped cards — slows untipped-heavy sessions unevenly; rejected.

## Decision: Static **How to remember** copy in the web app

**Rationale**: Clarification Q3 Option A. Four short techniques (acronym, vivid image, story/STAR link, teach-back) as client-side help near practice tip UI. Mirror in docs. No API entity for techniques.

**Alternatives considered**: Seeded “technique cards” deck — overkill; rejected. Dedicated route/coachmark — out of scope; rejected.

## Decision: Seed tip floors (curated copy)

**Rationale**: Clarifications Q2 + Q5. Target:
- Recommended Beginner deck: ≥3 tipped cards, including ≥1 open and ≥1 MCQ
- Each stage (Beginner / Intermediate / Expert): ≥1 tipped card somewhere in that stage’s decks

Prefer high-leverage hooks (STAR, acronyms, “why it flakes”) over restating the answer.

**Alternatives considered**: % coverage quotas — harder to author/test; rejected in favor of explicit floors.

## Decision: Admin create form gets optional Memory tip field

**Rationale**: FR-006 / US2. Extend existing add-card UI with optional textarea/input (char counter optional). Members unchanged (403). Edit/delete still out of scope.

## Decision: No XP / streak / mastery changes

**Rationale**: Constitution + FR-013. Tips are presentation/content only; practice events unchanged except optional `memoryTip` on MCQ response DTO.
