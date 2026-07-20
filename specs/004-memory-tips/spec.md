# Feature Specification: Memory Tips for Interview Recall

**Feature id**: `004-memory-tips`  
**Feature Branch**: `004-memory-tips`  
**Created**: 2026-07-19  
**Status**: Draft  
**Prerequisite**: [`specs/001-quest-deck/`](../001-quest-deck/), [`specs/002-mcq-cards/`](../002-mcq-cards/), and [`specs/003-learning-path/`](../003-learning-path/) implemented and smoke-passing  
**Input**: Help learners remember interview answers—not only grade themselves—by surfacing short memory hooks during practice and teaching a few simple recall techniques in-product

## Clarifications

### Session 2026-07-19

- Q: When should `memoryTip` be available from the API (GET vs practice response, by card kind)? → A: Include on GET for **open** cards; withhold on GET for **MCQ** until grade response.
- Q: How much seeded content should include memory tips? → A: ≥3 tips in the recommended Beginner deck **and** ≥1 tip per curriculum stage (Beginner, Intermediate, Expert).
- Q: Where should the 2–4 memory techniques be taught in-product? → A: Practice-screen help link/panel only (plus docs paragraph).
- Q: What happens to auto-advance when the learner expands **Remember this**? → A: Expanding pauses auto-advance until collapse or explicit continue.
- Q: Must Beginner seed tips cover both open and MCQ card kinds? → A: Among ≥3 tipped cards in the recommended Beginner deck, include ≥1 open **and** ≥1 MCQ.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - See a memory hook after practicing (Priority: P1)

As a job seeker practicing a card, after I reveal the answer (open card flip) or receive my grade (MCQ), I see a short, memorable cue that helps the answer stick for a real interview—not only XP and correct/incorrect.

**Why this priority**: Core product intent; without post-reveal hooks, practice remains a quiz with no recall scaffolding.

**Independent Test**: Sign in → start a Foundations (Beginner) deck practice session → flip one open card or grade one MCQ → confirm a **Remember this** memory tip appears on at least one seeded card that has a tip.

**Acceptance Scenarios**:

1. **Given** an open card with a memory tip, **When** I flip to reveal the answer, **Then** I see a compact **Remember this** panel or chip with the tip text (≤200 characters, readable on mobile).
2. **Given** an MCQ card with a memory tip, **When** I submit my selection and see the grade, **Then** I see the memory tip explaining why the correct answer sticks (one hook, not a lecture).
3. **Given** a card with no memory tip, **When** I complete practice on that card, **Then** practice still succeeds and auto-advance works with no error or empty panel blocking the flow.
4. **Given** I have just revealed or graded a card with a tip, **When** the **Remember this** panel is collapsed (default), **Then** auto-advance continues on the existing timing rules.
5. **Given** I expand **Remember this**, **When** auto-advance would otherwise fire, **Then** advance is **paused** until I collapse the tip or explicitly continue to the next card.
6. **Given** an MCQ card before I grade, **When** I view the card in practice, **Then** the memory tip is **not** visible and is **not** present on GET (same anti-cheat posture as withholding `correctIndex`).
7. **Given** an open card with a memory tip, **When** I have not flipped yet, **Then** the tip is **not** shown in the UI even though it may be present on GET (client-gated until flip).

---

### User Story 2 - Admin adds optional memory tips when creating cards (Priority: P2)

As a deck admin, I can optionally add a short memory tip when I create an open or MCQ card so my deck content reinforces recall, not only prompts and answers.

**Why this priority**: Extends the existing add-only card model without new edit/delete scope; complements curated seed content.

**Independent Test**: Deck admin creates a card with `memoryTip` → 201; member create attempt still 403; tip appears after reveal/grade in practice; tip omitted on GET before practice for MCQ.

**Acceptance Scenarios**:

1. **Given** I am deck admin, **When** I create a card with an optional `memoryTip` (≤200 characters), **Then** the card is created and the tip is stored.
2. **Given** I am deck admin, **When** I create a card without `memoryTip`, **Then** the card is created successfully (field is optional).
3. **Given** I am deck member, **When** I attempt to create a card with a memory tip, **Then** I get 403 (same authz as existing card create).
4. **Given** I submit a memory tip longer than 200 characters, **When** I create a card, **Then** I get 400 with a clear validation message.
5. **Given** card edit/delete remain out of scope, **When** I need to fix a tip, **Then** I add a new card (same as current product model).

---

### User Story 3 - Learn simple recall techniques in-product (Priority: P2)

As a job seeker, I can discover 2–4 simple memory techniques (e.g. acronym, vivid image, story/STAR link, teach-back / say-aloud) so I know how to use the tips and build a “remember” habit during prep—not only a “grade yourself” habit.

**Why this priority**: Tips alone are less useful without lightweight technique framing; keeps scope soft (guidance, not a full SRS product).

**Independent Test**: Open a practice session → open the practice-screen **How to remember** help → see names/descriptions of at least two techniques → complete practice without forced scheduling.

**Acceptance Scenarios**:

1. **Given** I am on a practice screen, **When** I open the **How to remember** help link/panel, **Then** I can read brief descriptions of **at least two** and **at most four** simple techniques (acronym, vivid image, story/STAR link, teach-back/say-aloud).
2. **Given** technique guidance is shown, **When** I read it, **Then** it fits in a short scan (not a multi-page course) and does not block starting or continuing practice.
3. **Given** teach-back / spaced self-test is mentioned, **When** I use the product, **Then** there is **no** mandatory spaced-repetition schedule or Anki-style due queue introduced by this feature.
4. **Given** Home or nav, **When** I look for techniques, **Then** there is **no** dedicated techniques route or first-run coachmark required by this feature (practice help + docs are sufficient).

---

### User Story 4 - Seeded curriculum includes memory tips where they help most (Priority: P1)

As a job seeker on the learning path, I encounter memory tips on Beginner-and-above seeded cards where a mnemonic or hook materially helps recall (foundations, acronyms, STAR structure, common QA patterns)—so a Foundations practice session reliably demonstrates the feature.

**Why this priority**: Acceptance criteria require visible tips in Foundations practice; seed quality proves dual north star (prep usefulness + demoable portfolio).

**Independent Test**: Fresh seeded DB → practice recommended Beginner deck → at least one open and one MCQ card with tips appear after reveal/grade; deck has ≥3 tipped cards total.

**Acceptance Scenarios**:

1. **Given** a fresh seeded database with the learning path from `003`, **When** I inspect the recommended Beginner deck, **Then** at least **three** cards have a `memoryTip`, including **at least one open** and **at least one MCQ**, and practicing that deck shows tips after reveal or grade.
2. **Given** seeded curriculum across Beginner, Intermediate, and Expert, **When** I inspect each stage, **Then** each stage has **at least one** card with a memory tip.
3. **Given** seeded tips, **When** they appear, **Then** they favor high-leverage recall (acronyms, frameworks, STAR cues) over restating the full answer — without requiring 100% card coverage.

---

### User Story 5 - Quality proof and docs for the “remember” habit (Priority: P2)

As the author or a portfolio reviewer, I can point to unit/API tests for the new field, an E2E check that a tip appears after reveal/grade, updated docs explaining a short prep session with memory tips, and a still-green smoke suite.

**Why this priority**: Constitution requires layered proof; docs close the loop for interview prep north star.

**Independent Test**: Run unit/API tests for `memoryTip` validation and visibility rules → run E2E asserting tip after flip/grade → read one paragraph in docs on the remember habit → `@smoke` passes.

**Acceptance Scenarios**:

1. **Given** unit or API tests, **When** they run, **Then** optional `memoryTip` persistence, max length, and MCQ tip withholding before grade are covered.
2. **Given** E2E practice flow, **When** a seeded card with a tip is practiced, **Then** a test tagged `@smoke` (or progression) verifies the tip appears after flip or grade.
3. **Given** updated product docs, **When** I read the memory-tips section, **Then** one paragraph explains how to use tips in a short prep session (flip/grade → read hook → optional teach-back → next card).
4. **Given** this feature ships, **When** smoke runs, **Then** login, practice, and progression journeys still pass.

---

### Edge Cases

- Card has `answerHint` but no `memoryTip` → hint still works pre-flip; no memory panel after reveal unless tip exists.
- Card has both `answerHint` and `memoryTip` → hint before flip; memory tip after reveal only (distinct purposes).
- MCQ memory tip text could imply the correct option → tip MUST NOT be on GET or pre-grade practice payload; only in grade response (then post-grade UI).
- Open card `memoryTip` on GET → UI MUST still hide until flip (same gating pattern as showing `answerHint` on the card back).
- Very long tip at exactly 200 characters → must wrap/read cleanly on narrow mobile viewports.
- User expands **Remember this** during auto-advance countdown → auto-advance **pauses** until collapse or explicit continue; expanding must not cancel the practice session.
- Custom user-created cards without tips → practice unchanged from `001`/`002`/`003`.
- Learning path Home and stage grouping → unchanged; this feature does not alter soft path UX.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST support an optional **`memoryTip`** string on cards (open and MCQ), separate from `answerHint`, with maximum length **200 characters**.
- **FR-002**: Memory tips MUST be shown to learners **only after** answer reveal: open cards after flip; MCQ cards after grade. **Open** cards MAY include `memoryTip` on GET (UI MUST hide until flip). **MCQ** cards MUST omit `memoryTip` on GET (anti-cheat aligned with `002`).
- **FR-003**: MCQ practice grade responses MUST include `memoryTip` when present. Open cards MAY source `memoryTip` from GET after flip (no separate reveal endpoint required).
- **FR-004**: Missing `memoryTip` MUST NOT break practice, auto-advance, XP, streak, or mastery behavior from `001`/`002`/`003`.
- **FR-005**: UI MUST present tips in a light **Remember this** chip or collapsible panel. Default (collapsed) MUST **not** block auto-advance. Expanding MUST **pause** auto-advance until the learner collapses the tip or explicitly continues; there is no forced acknowledgment modal.
- **FR-006**: Deck admin MAY supply `memoryTip` on card create; members MUST NOT create cards (unchanged RBAC). Card edit/delete remain out of scope.
- **FR-007**: System MUST validate `memoryTip` length (≤200) on create; empty or omitted tip is allowed.
- **FR-008**: Product MUST teach **2–4** simple memory techniques via a short, scannable **How to remember** help link/panel on the **practice screen** (near the tip UX), with the same guidance reflected in docs—without mandatory spaced-repetition scheduling, dedicated techniques routes, or first-run coachmarks.
- **FR-009**: Seed content for the learning path (`003`) MUST include memory tips with these floors: **≥3** tipped cards in the recommended Beginner deck (including **≥1 open** and **≥1 MCQ**), and **≥1** tipped card in each curriculum stage (Beginner, Intermediate, Expert). Tips SHOULD favor high-leverage recall; 100% coverage is NOT required.
- **FR-010**: Tips MUST stay concise and readable on mobile (target ≤200 chars; no multi-paragraph essays).
- **FR-011**: Product docs MUST add a short section (including at least one paragraph) on using memory tips during a prep session.
- **FR-012**: Quality suite MUST include unit or API coverage for `memoryTip` field rules and visibility, plus E2E verification that a tip appears after open flip or MCQ grade; smoke suite MUST remain green.
- **FR-013**: XP, level, title, streak, and mastery formulas MUST remain unchanged from `001`/`002`.
- **FR-014**: Learning path UX (stage groups, Start here, soft guidance) MUST remain intact.

### Key Entities

- **Card** (extended): optional `memoryTip` (≤200 chars), distinct from `answerHint` (pre-flip) and MCQ `correctIndex` (post-grade only).
- **Practice reveal state**: moment after open flip or MCQ grade when memory tip becomes eligible for display.
- **Memory technique guide**: lightweight practice-screen **How to remember** help copy describing 2–4 recall methods (also mirrored in docs); not a scheduled SRS engine or dedicated route.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In a Foundations (recommended Beginner) practice session, a learner can encounter memory tips on at least three seeded cards after flip or MCQ grade, including both open and MCQ paths; Intermediate and Expert stages each have at least one tipped card.
- **SC-002**: A deck admin can create a card with an optional memory tip; a member cannot.
- **SC-003**: 100% of MCQ cards withhold `memoryTip` (and `correctIndex`) on GET; open cards with tips include `memoryTip` on GET but UI hides until flip (verified by API + UI/E2E checks).
- **SC-004**: Practice on cards without tips completes with the same success rate and flow as before this feature (no new blocking steps).
- **SC-005**: A reader can learn the “remember” habit from product docs in under 60 seconds (one short paragraph plus optional technique list).
- **SC-006**: Smoke suite passes after seed, API, UI, and doc updates.

## Assumptions

- **`memoryTip` is a separate field** from `answerHint`: hint supports pre-flip nudge; tip supports post-reveal recall hook (clearest model per feature input).
- **API visibility by kind (clarified 2026-07-19):** `memoryTip` on GET for open cards; withheld on GET for MCQ until grade response.
- Tips are author-curated in seed first; AI-generated mnemonics are out of scope.
- Default UI: collapsed chip/panel; expansion is optional. **Expand pauses auto-advance** until collapse or explicit continue (clarified 2026-07-19); no forced acknowledgment.
- **Seed tip floors (clarified 2026-07-19):** ≥3 tipped cards in recommended Beginner deck (**≥1 open** and **≥1 MCQ** among them); ≥1 tipped card per curriculum stage. No percentage quota beyond those floors.
- **Technique guide placement (clarified 2026-07-19):** practice-screen **How to remember** help link/panel + docs paragraph; no dedicated page or first-run coachmark.
- Visual design keeps existing cyberpunk Quest Deck look; tip text uses readable body typography consistent with the product.
- Card create remains add-only; admins who need to change a tip add a new card.
- This feature builds on decks, open + MCQ cards, practice sessions, learning path, seed content, and XP/mastery from prior specs—no new product surface beyond memory tips and light technique guidance.

## Out of scope

- Full spaced-repetition engine, Anki clone, or mandatory review schedules
- AI-generated mnemonics
- Voice recording or flashcard audio
- Changing XP formulas, streak rules, or mastery mapping
- Card edit/delete beyond optional tip on create
- Hard learning-path locks or path redesign
- Blocking modals that require acknowledging a tip before continuing
- Dedicated techniques page/route or first-run coachmark for memory methods
