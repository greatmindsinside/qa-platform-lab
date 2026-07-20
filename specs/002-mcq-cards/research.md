# Research: MCQ Cards

## Decision: Phase 2 Spec Kit feature (not MVP expansion)

**Choice:** New feature folder `002-mcq-cards` after `001-quest-deck` is green.  
**Rationale:** Keeps Week-1 dual north star shippable; MCQ adds objective grading without blocking open STAR rehearsal.  
**Alternatives:** Fold into `001` tasks (rejected — expands MVP scope mid-flight).

## Decision: Card kind `mcq` beside `open` (not replace confidence)

**Choice:** Discriminated card kind; Practice UI/API branch on `kind`.  
**Rationale:** Open cards need self-rated confidence (behavioral/story answers have no single key). MCQ needs right/wrong. One practice model cannot honestly serve both.  
**Alternatives considered:** Confidence-only with options as UI aid (no scoring) — weaker prep signal; replace all cards with MCQ — kills STAR rehearsal.

## Decision: Stable option order (no shuffle)

**Choice:** Store and display A–D in persisted order.  
**Rationale:** Simpler deterministic tests; shuffle can be Phase 3.  
**Trade-off:** Memorizing position possible — acceptable for solo prep MVP of this feature.

## Decision: XP 15 / 5 and mastery mapping

**Choice:** Correct +15, incorrect +5; map results into existing `confidence` for deck %.  
**Rationale:** Rewards accuracy more than open base (+10) without zeroing effort on misses; reuses `deckMasteryPercent` without a second mastery system.  
**Alternatives:** Zero XP on miss (punishing); separate MCQ scoreboard (YAGNI).

## Decision: Hide `correctIndex` on GET

**Choice:** Reveal only in practice response after attempt.  
**Rationale:** Honest solo quiz; still allows learn-from-miss after submit.

## Constitution note

Detail lives in this feature package only (not constitution) so Week-1 MVP docs stay uncluttered. Implementation must still obey dual north star, SDD, TDD, SOLID from [`.specify/memory/constitution.md`](../../.specify/memory/constitution.md).
