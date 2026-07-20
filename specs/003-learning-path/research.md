# Research: QA Interview Learning Path

## Decision: Stage groups + thin deck fields (not a Path entity)

**Rationale**: Spec requires soft curriculum guidance with Home clarity. A `paths` table or unlock graph would violate YAGNI and constitution non-goals. Optional `stage` + `recommendedStart` on `decks` is enough for grouping, ordering, and Start here.

**Alternatives considered**:
- Name-prefix convention only — brittle for grouping/tests; rejected.
- Full Path / Module domain — overkill for seed curriculum; rejected.
- Hard unlock gates — explicitly out of scope; rejected.

## Decision: Replace legacy seed decks

**Rationale**: Clarification Option A. Overlapping old + new decks confuse Home and inflate demo noise. Fresh seed / e2e DB reset is already the lab pattern.

**Alternatives considered**:
- Keep old decks alongside — duplicate topics; rejected.
- In-place rename only — harder to hit multi-topic + mixed MCQ floors cleanly; rejected in favor of full curriculum rewrite (content may reuse prompts).

## Decision: 1–3 multi-topic decks per stage

**Rationale**: Clarification Option A. Full stage×track matrix (~12 decks) hurts the ≤5 minute portfolio demo. Multi-topic decks still cover FR-003 tracks via card tags and prompt mix.

**Proposed seed outline** (planning target; exact copy in implement):

| Stage | Decks (≤3) | Notes |
| ----- | ------------- | ----- |
| Beginner | **QA Foundations** (`recommendedStart`) | ≥6 cards, open+MCQ, vocab/why-it-matters across tracks |
| Beginner | optional 2nd only if needed for track coverage | Keep total Beginner cards ≥8 |
| Intermediate | **Applied Testing Practice** | Scenarios: waits/flake, 401/403, prioritization |
| Intermediate | optional 2nd | e.g. STAR application |
| Expert | **Quality Strategy & Influence** | System design of quality, risk, leadership |

## Decision: Mix open + MCQ in the same deck

**Rationale**: Clarification Option A. Existing `DeckPracticePage` already branches per card. Prefer open concept → related MCQ check ordering inside a deck.

**Alternatives considered**: Separate MCQ-only decks — recreates “QA fundamentals (MCQ)” silo; rejected.

## Decision: User-created decks stay `stage = null`

**Rationale**: Create-deck UX must not force curriculum authorship. Home shows curriculum stage sections first; unstaged decks under **Your decks** (or equivalent).

## Decision: Client-side Home grouping

**Rationale**: `GET /api/decks` returns flat `Deck[]` with `stage` / `recommendedStart`. Web groups by stage order. No new list endpoint needed.

**Alternatives considered**: Server-side nested curriculum payload — unnecessary; rejected.
