# Feature Specification: QA Text Adventure

**Feature id**: `005-qa-adventure`  
**Feature Branch**: `005-qa-adventure`  
**Created**: 2026-07-20  
**Status**: Draft  
**Prerequisite**: Quest Deck Home + practice flows (`001`–`003`) runnable; signed-in users available  
**Input**: User description: Add a modern Zork-inspired interactive fiction mode in Quest Deck that teaches QA/SDET concepts through narrative play—contemporary UI (not retro terminal pastiche), clear learning outcomes, soft ties to progression where appropriate, immersive adventure mode separate from the Home hub and deck practice.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Finish one short QA adventure (Priority: P1)

As a job seeker preparing for QA/SDET interviews, I open a dedicated Adventure from Home, play through a short branching story (e.g. a flaky release or production scare), make decisions at each scene, and finish with a clear lesson takeaway—so prep feels memorable and less like grinding cards alone.

**Why this priority**: Dual north star — this is the new prep surface that differentiates Quest Deck; without a completable first adventure the feature is only a shell.

**Independent Test**: Sign in as seeded member → open Adventure from Home → complete the seeded short adventure via choices → see end-of-adventure summary with at least one concrete QA lesson → return to Home.

**Acceptance Scenarios**:

1. **Given** I am signed in, **When** I view Home, **Then** I see a clear entry point to Adventure (distinct from curriculum deck Practice).
2. **Given** I start the seeded adventure, **When** I view a scene, **Then** I see readable narrative prose and a small set of labeled choices (not a blank command line as the primary control).
3. **Given** I select a choice, **When** the next scene loads, **Then** the story advances along an authored branch and I understand what changed because of my decision.
4. **Given** I reach an ending, **When** the adventure completes, **Then** I see a short summary that names what I practiced (e.g. flake risk, severity, evidence) and a path back to Home.
5. **Given** I am mid-adventure, **When** I leave and later return, **Then** I can resume from my last saved scene (or restart deliberately)—progress is not silently lost without notice.

---

### User Story 2 - Learn QA ideas through consequences (Priority: P1)

As a learner, my choices produce different outcomes (better/worse investigation, missed bug, stronger evidence) so the adventure teaches testing judgment—not only entertainment.

**Why this priority**: Without visible learning consequences, the mode fails interview-prep usefulness and becomes a novelty.

**Independent Test**: Play the seeded adventure twice choosing divergent paths at a marked decision → observe different narrative outcomes and different lesson emphasis in the summary (or in-scene feedback).

**Acceptance Scenarios**:

1. **Given** a decision scene about investigating a flake or filing severity, **When** I pick a weaker approach, **Then** the story shows a credible downside (missed signal, delayed find, weak report) without insulting the player.
2. **Given** I pick a stronger QA approach on the same decision, **When** the story continues, **Then** I see a clearer win or better evidence trail that reinforces the lesson.
3. **Given** any completed playthrough, **When** I read the end summary, **Then** at least one concrete QA concept is named in plain language (not only “You win”).
4. **Given** I am new to the product, **When** I finish the first adventure once, **Then** I can state one testing idea I practiced (smoke-check via interview script / demo).

---

### User Story 3 - Progression stays coherent with Quest Deck (Priority: P2)

As a daily user, finishing adventure scenes or the full adventure awards progression in a way that feels consistent with card practice (XP and streak), so Adventure is part of the same prep habit—not a disconnected minigame.

**Why this priority**: Dual north star + habit loop; secondary to a playable learning story.

**Independent Test**: Note XP and streak on Home → complete the seeded adventure → Home shows XP increased per locked adventure award rules and streak updated if this is the first practice-like activity today.

**Acceptance Scenarios**:

1. **Given** I complete the seeded adventure for the first time today, **When** I return to Home, **Then** my total XP has increased by the adventure completion award and my streak reflects a practice day if I had no other activity today.
2. **Given** I already earned the completion award for this adventure, **When** I replay it, **Then** replay still works for learning, and any repeat XP follows explicit replay rules (no silent double-dipping beyond what Assumptions allow).
3. **Given** Adventure awards XP, **When** I compare it to card practice, **Then** level/title formulas remain the existing Quest Deck rules (adventure only contributes XP; it does not invent a second leveling system).

---

### Edge Cases

- User opens Adventure with no seeded content available → clear empty/unavailable message; no blank crash screen.
- User refreshes mid-scene → resume or safe restart prompt; no corrupt “null scene” state shown as prose.
- User picks a choice that ends the adventure early (failure ending) → still get a lesson summary and return path; not a dead end with no exit.
- Unsigned visitor → Adventure requires sign-in (same as rest of app).
- Very long choice labels or long prose → content remains readable on a phone-width screen without horizontal scrolling of the main story text.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide a dedicated Adventure experience reachable from Home after sign-in, visually and navigationally distinct from curriculum deck Practice.
- **FR-002**: System MUST ship at least one complete short seeded adventure with multiple scenes, branching choices, and at least two distinct endings or outcome tones (e.g. stronger vs weaker investigation).
- **FR-003**: Primary player input MUST be selecting from authored choices (button/list). A free-text command parser is out of scope for this feature.
- **FR-004**: Each scene MUST show narrative text plus the available choices for that scene; choosing an option MUST advance to a defined next scene or ending.
- **FR-005**: Adventure content MUST teach QA/SDET concepts through story consequences (examples for the first adventure: flake/wait risk, severity vs priority, evidence in a bug report, happy path vs edge case)—not generic fantasy combat as the lesson.
- **FR-006**: Completing an adventure MUST show a summary that lists one or more explicit learning takeaways tied to that playthrough.
- **FR-007**: System MUST persist in-progress adventure state per user so a session can be resumed after leaving Home or refreshing, until the user completes or explicitly restarts.
- **FR-008**: Completing the seeded adventure MUST award XP using locked rules in Assumptions and MUST count as a practice day for streak (same streak calendar rules as card practice).
- **FR-009**: Replay of a completed adventure MUST remain available; repeat completion XP MUST follow Assumptions (first completion full award; replays reduced or zero).
- **FR-010**: Adventure MUST reuse existing sign-in; no separate adventure account.
- **FR-011**: Tone and presentation MUST feel contemporary (readable typography, clear choices, immersive “mode” layout)—MUST NOT rely on a faux-CRT / parser-only terminal as the default experience.
- **FR-012**: Quality proof for this feature MUST include automated coverage for adventure progress rules (branch advance, completion award, resume) at unit and at least one end-to-end smoke path from Home → finish → Home XP/streak visible.

### Key Entities

- **Adventure**: Named playable story (title, short blurb, learning themes); at least one seeded instance.
- **Scene**: A step in the adventure with narrative prose and zero or more choices; endings are terminal scenes.
- **Choice**: Labeled player action linking to a next scene; may carry outcome tags used for summary/lessons.
- **AdventureProgress**: Per-user current scene, started/completed flags, and award-granted flag for completion.
- **LearningTakeaway**: Short plain-language QA concept surfaced in the end summary (derived from path tags and/or ending).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A new signed-in user can start and finish the seeded adventure in ≤10 minutes on a first playthrough.
- **SC-002**: After one completion, the user (or a demo interviewer) can name ≥1 concrete QA concept practiced in the adventure without opening external docs.
- **SC-003**: ≥2 playthroughs with different major choices produce observably different outcomes or takeaway emphasis.
- **SC-004**: After first completion, Home progression shows XP increased and streak consistent with a practice day when no earlier practice occurred that UTC day.
- **SC-005**: Resume works after leaving mid-adventure: returning users land on their saved scene without re-entering from scratch unless they choose Restart.
- **SC-006**: Feature remains useful for portfolio narrative: a cloneable demo path exists (seed account → Adventure → complete → show takeaway + XP).

## Assumptions

- **Feature description source**: Empty `/speckit-specify` args; description taken from the prior conversation prompt (modern Zork-like QA teaching adventure for Quest Deck).
- **Interaction model**: Choice-driven branching interactive fiction for v1 (modern equivalent of Zork). Free-text parser and AI dungeon master are out of scope.
- **Scope**: Exactly one short seeded adventure for this feature; additional chapters/adventures can be later specs.
- **Setting**: Contemporary software/QA world (release train, CI flake, incident triage)—not swords-and-orcs as the teaching vehicle.
- **Progression awards (locked for this feature)**:
  - First completion of the seeded adventure: **+25 XP** and streak update per existing Quest Deck streak rules.
  - Replay completions after award already granted: **+0 XP** (learning replay allowed; no XP farm).
  - Mid-adventure scene choices do not award partial XP in v1 (keeps rules simple).
- **Level/title formulas**: Unchanged from `001-quest-deck`; adventure only adds to `totalXp`.
- **Relationship to curriculum**: Adventure is a sibling prep mode on Home, not a replacement for Beginner→Expert decks; first adventure themes align with Beginner/Intermediate ideas but do not gate deck unlocks.
- **Authorship**: All scenes/choices are authored content (seeded), not generated at runtime by a model.
- **Out of scope**: Multiplayer, inventory/combat RPG systems, graphics-heavy maps, voice, OAuth changes, card-deck conversion of adventure text, AI interviewer (still constitution non-goal).
- **Prerequisite product**: Existing login, Home, and XP/streak display remain the shell around this mode.
- **004-memory-tips**: Independent feature; this adventure does not depend on memory tips being implemented first.
