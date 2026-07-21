# Plan: Deck-detail mockup layout

**Date:** 2026-07-20  
**Spec:** [design](../specs/2026-07-20-deck-detail-layout-design.md)

## Files

| File | Role |
|------|------|
| `apps/web/src/components/AppShell.tsx` | Top bar, left nav, footer |
| `apps/web/src/pages/DeckDetailPage.tsx` | Active quest, card grid, right rail |
| `apps/web/src/styles.css` | Shell + deck-layout tokens/styles |
| `apps/web/src/App.tsx` | Pass user/signOut into deck page only (page owns shell) |

## Tasks

1. Add `AppShell` with profile (level/title), nav links, stub Settings/Support/Leaderboard
2. Rebuild `DeckDetailPage` layout to match mockup; keep invite/delete/add-card
3. CSS: gold accents, mastery ring, MCQ/OPEN card tiles, yellow Start Practice
4. Run lint + smoke
