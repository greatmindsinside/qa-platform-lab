# Feature Specification: MCQ Cards

**Feature id**: `002-mcq-cards`  
**Created**: 2026-07-19  
**Status**: Approved (Phase 2 — spec package only until implement)  
**Delivery**: Ships on **`main`** after `001-quest-deck` MVP is green  
**Prerequisite**: [`specs/001-quest-deck/`](../001-quest-deck/) implemented and smoke-passing  
**Input**: Plan MCQ Spec Kit Package (card kind `mcq` alongside open cards; 1B full package / 2A right-wrong scoring)

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Practice an MCQ card (Priority: P1)

As a job seeker, I open an MCQ card, see four labeled choices (A–D), select one, and immediately learn if I was correct while earning XP and keeping my streak — so factual QA knowledge gets objective feedback (unlike open STAR rehearsal).

**Why this priority**: Dual north star — useful prep check + new domain/API risk for the quality system.

**Independent Test**: Login → open deck “QA fundamentals (MCQ)” → practice one card → select correct option → see correct + xpAwarded 15 → Home XP/streak updated.

**Acceptance Scenarios**:

1. **Given** an MCQ card, **When** I open Practice, **Then** I see the prompt and exactly four choices labeled A–D in stored order (no shuffle).
2. **Given** I select the correct option, **When** practice succeeds, **Then** response includes `correct: true`, `xpAwarded: 15`, progression fields, and `correctIndex`.
3. **Given** I select an incorrect option, **When** practice succeeds, **Then** response includes `correct: false`, `xpAwarded: 5`, progression fields, and `correctIndex` (so I can learn from the miss).
4. **Given** any completed MCQ practice, **When** the event is recorded, **Then** streak rules from `001` still apply (practice counts as a practice day).
5. **Given** an MCQ Practice screen, **When** I view controls, **Then** I do **not** see Learning/Solid/Mastered buttons (those remain open-card only).

---

### User Story 2 - Admin creates MCQ cards (Priority: P2)

As deck admin, I create an MCQ card with prompt, four options, and one correct index so I can grow factual decks; members may practice but not create.

**Why this priority**: Extends ownership/CRUD story without changing deck RBAC.

**Independent Test**: Admin POST MCQ card → 201; member POST → 403; GET cards returns `kind` + `options` but **not** `correctIndex`.

**Acceptance Scenarios**:

1. **Given** I am deck admin, **When** I create a card with `kind: mcq`, four options, and `correctIndex` 0–3, **Then** I get 201 and the card appears in the deck list.
2. **Given** I am deck member, **When** I attempt to create an MCQ card, **Then** I get 403.
3. **Given** an MCQ card exists, **When** I GET cards for the deck, **Then** each MCQ item includes `kind: "mcq"` and `options` (length 4) and **omits** `correctIndex`.
4. **Given** invalid create (≠4 options or `correctIndex` out of range), **When** I POST, **Then** I get 400.

---

### User Story 3 - Quality proof for MCQ (Priority: P1)

As a portfolio reviewer (or CI), I can point to unit tests for grading/XP, an API practice test for wrong selection (+5 XP), and one E2E MCQ journey tagged `@smoke @progression`.

**Why this priority**: Job-portfolio north star — new behavior must be proven across layers.

**Independent Test**: `yarn test:unit` covers `gradeMcq` / `xpForMcq` / `confidenceAfterMcq`; Playwright API + E2E `@smoke` green.

**Acceptance Scenarios**:

1. **Given** domain unit tests, **When** they run, **Then** correct→15 XP, incorrect→5 XP, and mastery mapping rules hold.
2. **Given** API practice with wrong `selectedIndex`, **When** called as a seeded user, **Then** status 200, `correct: false`, `xpAwarded: 5`.
3. **Given** E2E, **When** I complete one correct MCQ selection in the UI, **Then** the test tagged `@smoke @progression` passes.
4. **Given** open-card practice, **When** exercised, **Then** existing `001` confidence flow is unchanged.

---

### Edge Cases

- Practice open card with `{ selectedIndex }` → 400.
- Practice MCQ with `{ confidence }` → 400.
- `selectedIndex` not in 0–3 → 400.
- Empty options / wrong length on create → 400.
- GET never leaks `correctIndex` before practice response.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST support card `kind` of `open` (default, `001` behavior) or `mcq`.
- **FR-002**: MCQ cards MUST have exactly four option strings and one `correctIndex` in `0|1|2|3`.
- **FR-003**: MCQ Practice MUST accept `{ selectedIndex }`, grade on the server, award XP (correct **15**, incorrect **5**), update streak per `001` rules, and return `correct`, `correctIndex`, and progression fields (`totalXp`, `level`, `title`, `currentStreak`, `xpIntoLevel`, `xpToNextLevel`).
- **FR-004**: Open-card Practice MUST remain `{ confidence }` with `001` XP/improve-bonus rules; UI MUST branch on `kind`.
- **FR-005**: GET cards MUST return `kind` and, for MCQ, `options`; MUST NOT return `correctIndex` on GET.
- **FR-006**: Deck admin MAY create MCQ cards; members MUST NOT create cards (same authz as `001` card create).
- **FR-007**: System MUST seed deck **“QA fundamentals (MCQ)”** with ≥4 MCQ cards; admin = deck admin; member = deck member on that deck.
- **FR-008**: After MCQ practice, system MUST update `CardProgress.confidence` via mastery mapping (see Assumptions) so `masteryPercent` remains meaningful.
- **FR-009**: Quality suite MUST include domain unit tests, API practice coverage, and one UI E2E `@smoke @progression` for MCQ.
- **FR-010**: Option order MUST be stable as stored (no shuffle in this feature).

### Key Entities

- **Card** (extended): `kind`, optional `options`, optional `correctIndex`
- **PracticeEvent** (extended): optional `selectedIndex`, `wasCorrect`
- **CardProgress**: confidence still used for deck mastery (mapped from MCQ results)

## Success Criteria *(mandatory)*

- **SC-001**: Author can complete a factual MCQ prep session on the seeded MCQ deck with clear right/wrong feedback.
- **SC-002**: Open-card rehearsal flow from `001` still works unchanged.
- **SC-003**: Hiring manager can see MCQ unit + `@smoke` coverage in the suite/report.
- **SC-004**: `correctIndex` is not exposed on GET cards (anti-cheat for solo prep honesty).

## Assumptions

- **XP (MCQ):** correct = +15; incorrect = +5; no improve-bonus.
- **Mastery mapping:**  
  - incorrect → confidence = `learning`  
  - correct and previous confidence was not `solid` or `mastered` → `solid`  
  - correct and previous was `solid` or `mastered` → `mastered`  
  - correct and previous was `learning` or null → `solid`
- Open-card formulas from `001` unchanged.
- Phase 2 only — does not alter `001` task list T001–T027.
- UI labels for choices: accessible names **A**, **B**, **C**, **D** (or “Option A”…); submit via selecting the option (role/button).

## Out of scope

Multi-select; ≠4 options; timers; negative marking; AI generation; shuffling; card edit/delete; changing open-card XP; boss mode; streak freezes.
