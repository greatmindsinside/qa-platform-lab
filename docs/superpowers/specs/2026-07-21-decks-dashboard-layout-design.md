# Decks Dashboard Layout — Design

**Date:** 2026-07-21  
**Scope:** `DecksPage` layout rewrite + `Deck` list DTO progress fields  
**Approach:** Extend existing `GET /api/decks` mapper; rebuild page UI in place  
**Skills:** brainstorming, diogenic-ui

## Problem

The Decks page wastes vertical space: full-width tiles with little information, competing Practice/Open actions, plain-text mastery, disconnected Beginner/Intermediate/Expert sections, and Create Deck buried in Your decks.

## Decisions

| Choice | Value |
|--------|--------|
| Data scope | Extend `Deck` with `cardCount` + `completedCount`; keep `masteryPercent` |
| Next quest / last activity | Out of scope |
| Continue Learning pick | Curriculum: `recommendedStart` until mastery 100%, else next stage deck with mastery &lt; 100% |
| Chrome | Header Create Deck, filters, Continue Learning, grid, Your Decks + create tile; no search, no ⋮ menu, no page tagline |
| Implementation | Approach 1 — extend DTO + rebuild DecksPage (no dashboard endpoint, no N+1 card fetches) |

## Removed (cannot defend)

| Removed | Why |
|---------|-----|
| Dual Practice + Open buttons | Two equal primaries; unclear next step |
| Vertical stage section headings | Same content type split into scroll-heavy lists |
| Start-here badge on tiles | Continue Learning + stage order replace it |
| Search | No search need at current deck count |
| Three-dot overflow menu | Detail via title link; delete stays on detail |
| Page tagline / create explainer | Extra copy without a decision |

## Data contract

Extend `@lab/shared` `Deck`:

| Field | Meaning |
|-------|---------|
| `cardCount` | Total cards in the deck |
| `completedCount` | Cards with any progress row (non-null confidence) |
| `masteryPercent` | Unchanged — share of cards at `mastered` |

Computed in `mapDeck` from the same confidence list already loaded for mastery. No new endpoint.

Copy on UI: `X / Y practiced` (not “quests completed”) so practiced ≠ mastered stays honest.

## CTA state (client)

| State | Rule | Primary label | Target |
|-------|------|---------------|--------|
| Never started | `completedCount === 0` | Start Deck | `/decks/:id/play` |
| In progress | `completedCount > 0` && mastery &lt; 100 | Resume Practice | `/decks/:id/play` |
| Completed | mastery === 100 | Practice Again | `/decks/:id/play` |

Deck title (and featured card title) link to `/decks/:id` for detail.

## Continue Learning

Pick order:

1. If a `recommendedStart` deck exists and mastery &lt; 100 → feature it.
2. Else first curriculum deck in Beginner → Intermediate → Expert with mastery &lt; 100.
3. Else hide the section (no empty placeholder).

Featured card shows: name, stage badge, mastery progress bar + %, `completedCount of cardCount practiced`, one primary CTA. Yellow emphasis for this block only (page-level progression). Cyan for filters, primary buttons, progress bars. Pink only for Expert stage badge.

## Page structure

```
Header: Decks                    [+ Create Deck]
Continue Learning (optional featured card)
Filters: All Decks | Beginner | Intermediate | Expert | My Decks
Curriculum card grid (hidden when My Decks selected)
Your Decks: create tile + custom decks
  (when My Decks: curriculum grid hidden; this block is the main content)
```

### Filter behavior

- Default: All Decks.
- Beginner / Intermediate / Expert: path decks of that stage only.
- All Decks: all path decks (`stage !== null`) in one grid.
- My Decks: hide curriculum grid; show Your Decks block only.
- Your Decks section remains below the grid for All / stage filters (create tile + custom decks).

### Compact deck card

- Stage badge (or none for custom)
- Title → detail
- Description, max two lines (`line-clamp: 2`)
- Progress bar + mastery %
- `X / Y practiced`
- One primary CTA
- Padding ~20–24px; grid `repeat(auto-fit, minmax(300px, 1fr))`, gap ~24px
- Main content max-width ~1280px
- Mobile: one column; sidebar collapse is existing shell behavior

### Create Deck

- Header **+ Create Deck** and Your Decks create tile open the same inline name form.
- On success: refresh list, clear name, collapse form.
- On failure: keep form open; page-level error alert.

## Empty / loading / errors

| State | UI |
|-------|-----|
| Loading | “Loading decks…” |
| List/create error | Single `role="alert"` |
| No custom decks | Create tile + “No custom decks yet” |
| Stage with zero decks | “No decks in this stage” |
| Continue Learning N/A | Section omitted |

Four truths: progress + counts = what; CTA = next; title/detail + shell Sign out = leave. No tutorial chrome.

## Testing

- Unit: `mapDeck` / list API returns `cardCount` + `completedCount`; Continue Learning picker; CTA label helper; filter selection.
- E2E smoke: Decks shows compact grid, single primary CTA per card, Create Deck in header; Continue Learning when Start-here mastery &lt; 100.

## Out of scope

- Search, overflow menus, next-quest title, last-activity timestamps
- New `/api/decks/dashboard` endpoint
- HomePage / DeckDetailPage layout rewrites
- Estimated completion time
