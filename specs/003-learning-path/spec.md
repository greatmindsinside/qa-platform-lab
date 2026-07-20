# Feature Specification: QA Interview Learning Path

**Feature id**: `003-learning-path`  
**Feature Branch**: `003-learning-path`  
**Created**: 2026-07-19  
**Status**: Draft  
**Prerequisite**: [`specs/001-quest-deck/`](../001-quest-deck/) and [`specs/002-mcq-cards/`](../002-mcq-cards/) implemented and smoke-passing  
**Input**: Expand Quest Deck seed into a Beginner → Intermediate → Expert interview-prep curriculum with soft path guidance in the product UX

## Clarifications

### Session 2026-07-19

- Q: Curriculum shape on Home → A: Stage groups on Home; 1–3 multi-topic decks per stage (Option A)
- Q: How is stage stored for curriculum decks? → A: Optional deck `stage` field (`beginner` | `intermediate` | `expert` | null); null = outside curriculum path (Option B)
- Q: What happens to today’s seeded decks? → A: Replace old seed decks with new staged curriculum decks; update smoke/E2E (Option A)
- Q: How is “start here” marked? → A: Exactly one Beginner deck flagged recommended; show **Start here** on Home (Option B)
- Q: Open vs MCQ inside curriculum decks? → A: Mix open + MCQ inside the same curriculum decks (Option A)

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Follow a clear Beginner → Expert path (Priority: P1)

As a job seeker, I open Quest Deck after sign-in and immediately see a curriculum ordered from Beginner through Intermediate to Expert. I know where to start, what to practice next, and which material is advanced — without unlocking gates blocking me.

**Why this priority**: Core product intent of this feature; without visible path guidance, more cards alone remain a flat dump.

**Independent Test**: Sign in as seeded member → Home shows path stages in Beginner → Intermediate → Expert order with stage labels → start the recommended Beginner deck → complete a full deck practice session.

**Acceptance Scenarios**:

1. **Given** I am signed in with a seeded account, **When** I view Home, **Then** curriculum decks appear in **stage groups** (Beginner → Intermediate → Expert), each deck shows a clear stage label, and each stage has **1–3 multi-topic decks** (skill tracks mixed inside decks).
2. **Given** I am new to the product, **When** I scan Home, **Then** I can identify the recommended starting deck via a **Start here** badge (exactly one Beginner deck).
3. **Given** a Beginner deck with enough cards for a real session, **When** I start deck practice, **Then** existing play flow works (auto-advance, open flip or MCQ grade, XP/streak update).
4. **Given** Intermediate or Expert content, **When** I choose it before finishing Beginner, **Then** I can still practice it (soft guidance only — no hard lock).

---

### User Story 2 - Practice substantial curriculum content by skill and stage (Priority: P1)

As a job seeker, I rehearse across skill tracks (Playwright/E2E, API & authz, test strategy, behavioral/STAR, and deeper SDET topics) with enough cards at each stage for meaningful sessions — mixing open rehearsal and MCQ checks where appropriate.

**Why this priority**: Content volume and quality are the feature; UI labels without substance fail interview prep.

**Independent Test**: Seeded admin or member can open each stage’s primary decks, confirm card counts meet minimums, and complete at least one open and one MCQ practice in the path.

**Acceptance Scenarios**:

1. **Given** a fresh seeded database, **When** I list curriculum decks, **Then** Beginner, Intermediate, and Expert stages each have practice content (not stub decks of only a few demo cards).
2. **Given** Beginner content, **When** I practice, **Then** prompts emphasize foundations, vocabulary, and why the topic matters.
3. **Given** Intermediate content, **When** I practice, **Then** prompts emphasize applied scenarios, trade-offs, and habits (flake, waits, authz).
4. **Given** Expert content, **When** I practice, **Then** prompts emphasize quality strategy, system-level thinking, leadership/influence, or hard edge cases.
5. **Given** cards within a deck, **When** I play the deck in order, **Then** concepts appear before synthesis-style prompts (sensible order).
6. **Given** a curriculum deck with mixed kinds, **When** I practice the deck in order, **Then** open cards use confidence ratings and MCQ cards use A–D grading in the same session per existing rules.

---

### User Story 3 - Demo the learning path for portfolio reviewers (Priority: P2)

As the author (or a hiring manager following docs), I can run a short demo that shows the curriculum path, practice one Beginner session, and point to docs that explain single-session vs multi-day use — while smoke tests still prove the quality system.

**Why this priority**: Dual north star — prep usefulness plus a demoable portfolio story.

**Independent Test**: Follow updated using/demo docs → sign in → show path on Home → practice one Beginner deck → confirm smoke suite still green after seed/name updates.

**Acceptance Scenarios**:

1. **Given** updated product docs, **When** a reviewer follows the learning-path section, **Then** they know how to use the path in one short session and across multiple days.
2. **Given** seed deck names or counts changed, **When** smoke tests run, **Then** E2E/API assumptions are updated and `@smoke` still passes.
3. **Given** both seed accounts, **When** either signs in, **Then** they can practice the full published path day one (admin and member memberships intact).

---

### Edge Cases

- Learner skips Beginner and opens Expert first → allowed; guidance still labels Expert as advanced.
- Empty custom (non-seed) decks the user creates → `stage` unset; appear outside curriculum stage groups; must not break Home layout.
- Deck with mixed open + MCQ cards (required for curriculum) → practice session branches correctly per card kind.
- Renamed or reorganized seed decks → previous flat demo decks are **replaced** (not kept alongside); existing progress for removed card IDs may be orphaned; fresh demo DBs are the expected demo path (no migration of old demo progress required).
- Very long Home curriculum list → stages remain scannable (grouping/labels), not a flat undifferentiated list.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST present seeded interview-prep content as a learning path with three stages: **Beginner**, **Intermediate**, and **Expert**.
- **FR-002**: Home MUST group curriculum decks by stage (Beginner → Intermediate → Expert sections), show stage labels (and optional short path copy), and MUST NOT use hard unlock gates. Each stage MUST have **1–3 multi-topic decks** (skill tracks combined inside decks — not a full stage×track matrix). Curriculum membership is determined by deck **`stage`** (see FR-012).
- **FR-003**: Seeded curriculum MUST cover at least these skill tracks: Playwright/E2E, API & authz, test strategy / quality fundamentals, and behavioral (STAR); MAY include deeper SDET topics at Intermediate/Expert. Tracks MAY be mixed within a stage’s decks rather than one deck per track.
- **FR-004**: Each stage MUST provide enough cards for a real practice session: **at least 8 cards total per stage** across that stage’s seeded decks (combined), and **at least one deck per stage** that itself has **≥6 cards**.
- **FR-005**: Curriculum MUST mix **open** and **mcq** cards **inside the same curriculum decks** (not separate MCQ-only islands). Each stage MUST include at least one open card and at least one MCQ card somewhere in that stage’s content. Within a deck, prefer concept/open rehearsal before related MCQ checks when both appear.
- **FR-006**: Cards within each seeded curriculum deck MUST be ordered so foundational/concept prompts precede synthesis or scenario-heavy prompts.
- **FR-007**: Cards MUST carry tags (or equivalent metadata) that support topic and stage discovery (e.g. stage + skill topic).
- **FR-008**: Both seeded users (admin and member) MUST have membership on all curriculum decks day one with existing RBAC (member can practice; cannot delete).
- **FR-009**: Existing practice behavior MUST remain unchanged: deck play with auto-advance, open flip + confidence XP, MCQ grade XP, streak/mastery rules from `001`/`002`.
- **FR-010**: Product docs (`using-quest-deck` and demo guide) MUST explain the learning path, recommended start, and short-session vs multi-day use.
- **FR-011**: Quality suite MUST remain green: update smoke/E2E expectations for new deck names, counts, or Home structure; retain `@smoke` coverage for login, practice, and progression.
- **FR-012**: Each deck MUST support an optional **`stage`** of `beginner` | `intermediate` | `expert`, or unset/`null`. Seeded curriculum decks MUST set `stage`. User-created decks MUST default to unset/`null` and MUST appear outside the curriculum stage groups (e.g. a separate “Your decks” area). `stage` MUST be returned on deck list/detail so Home can group without parsing names.
- **FR-013**: Seed MUST **replace** the previous flat demo decks (including legacy names such as “Playwright & E2E”, “API testing & authz”, “Behavioral (STAR)”, and “QA fundamentals (MCQ)”) with the new staged curriculum set. Fresh seed / reset-demo DB is the supported upgrade path; migrating in-place demo progress is NOT required.
- **FR-014**: Exactly **one** seeded Beginner deck MUST be marked as the recommended start (e.g. `recommendedStart: true`). Home MUST show a **Start here** affordance on that deck only. User-created decks MUST NOT be recommended starts by default.

### Key Entities

- **Learning stage**: Beginner | Intermediate | Expert — stored as optional deck **`stage`** (`beginner` | `intermediate` | `expert`); unset means not part of the official curriculum path.
- **Curriculum deck**: A seeded deck with a non-null `stage`, covering one or more skill tracks; contains ordered cards. At most one Beginner curriculum deck has `recommendedStart`.
- **Card** (existing): open or mcq; gains consistent stage/topic tagging for discovery.
- **Learner progress** (existing): per-card confidence / mastery; path does not add hard prerequisites.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A first-time seeded user can identify the **Start here** Beginner deck on Home in under 10 seconds without reading external docs.
- **SC-002**: A learner can complete one full Beginner deck practice session (≥6 cards) in a single sitting and see XP/streak update afterward.
- **SC-003**: The seeded curriculum includes content for all three stages and at least four skill tracks, with each stage meeting the card-count minimums in FR-004.
- **SC-004**: A portfolio reviewer following the docs can demonstrate “where to start → practice → what’s next” in under 5 minutes.
- **SC-005**: Soft path only: Expert content remains reachable without completing Beginner (verified by manual or automated UI check).
- **SC-006**: Smoke suite passes after seed/UX updates, including practice and login journeys.

## Assumptions

- Soft guidance (recommended order + labels) is preferred over hard locks; hard gates are out of scope unless a later feature explicitly adds them.
- Prefer expanding/reorganizing seed content and light Home stage grouping over introducing a heavy new “path” domain entity; optional deck **`stage`** is the thin field used for grouping (clarified 2026-07-19).
- Curriculum topology is stage-first with 1–3 multi-topic decks per stage (clarified 2026-07-19), not a full skill-track matrix.
- Existing cyberpunk visual language stays; this feature is curriculum + clarity, not a redesign.
- XP, level, title, and streak formulas stay as defined in `001`/`002`.
- Card edit/delete remain out of scope; seed and admin add-card remain the content paths.
- Replacing older demo decks is **required** for this feature (clarified 2026-07-19); tests and docs will be updated to the new curriculum names and counts.
- “Substantial” content means meeting FR-004 minimums in this release; larger libraries can grow later without changing path semantics.
- Curriculum decks intentionally mix open + MCQ in the same deck (clarified 2026-07-19); separate MCQ-only seed decks are not part of this path design.
- Custom user-created decks are not required to join the official curriculum path in this feature.
