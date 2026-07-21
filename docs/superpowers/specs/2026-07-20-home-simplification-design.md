# Home simplification design

**Date:** 2026-07-20  
**Status:** Approved  
**Philosophy:** Apple-like clarity — if copy is needed to explain the UI, remove the copy and simplify the UI.

## Goal

Make `/` an obvious next-step screen: quiet progress, one Practice action. Quests and the full catalog stay in the sidebar (`Quests`, `Decks`).

## Decisions (approved)

| Choice | Decision |
|--------|----------|
| Layout | Progress-first, then one primary Practice button |
| Quest on Home | None — sidebar only |
| Approach | Greeting + quiet progress + Practice; deck name as a quiet line under the button |

## Layout

Top to bottom inside the existing app shell main area:

1. **Greeting** — `{displayName}` only (no “Welcome back,” no “Home” page title, no instructional subtitle).
2. **Progress** — Level, total XP, streak, and the existing thin XP bar. Numbers only; no “to next level” prose beyond the existing `N / 100` style if kept as a compact label.
3. **Primary action** — One large **Practice** control linking to `/decks/{recommendedId}/play`.
4. **Deck name** — Single quiet line under the button (name only). No description, mastery %, Open link, or section headings like “Continue practicing.”

Absent from Home:

- Quest / adventure block and blurbs  
- “Browse all decks” / “Open quests” footer CTAs  
- Dual Practice + Open pair  
- Explanatory muted paragraphs  

## Logic

- **Recommended deck:** unchanged — `recommendedStart` → else lowest mastery among staged decks → else first deck.
- **Empty / no decks:** show greeting + progress + a single **Decks** button to `/decks` (only when there is nothing to practice).
- **Loading:** short status (“Loading…”) only.
- **Error:** `role="alert"` with the error message only.

Data still loaded: decks + `/api/me` (for progress refresh). Adventure list is not required for Home and can be dropped from this page’s fetch.

## Visual

- Keep Quest Deck shell tokens (dark theme); do not introduce a new brand system.
- Center or left-align as a single quiet column — one composition, not a dashboard of cards.
- Practice CTA uses existing primary button / `practice-deck-cta` language; generous tap target, no competing secondary next to it.

## Non-goals

- Changing sidebar, Decks catalog, Quests/adventure UI, XP math, or API contracts  
- Adding new Home widgets (leaderboard teaser, stats grid, tips)

## Test impact

- E2E that assert Home headings like “Continue practicing,” quest blurbs, or “Browse all decks” need updating.
- Home a11y smoke should still pass (main landmark, no serious violations).
- Practice smoke that starts from Decks nav remains valid; optional: assert Home Practice reaches a play session.
