# Diogenic UI Pass — Design

**Date:** 2026-07-21  
**Scope:** Authenticated SPA (`apps/web`) — surgical product cut  
**Skill:** diogenic-ui

## Decisions

| Choice | Value |
|--------|--------|
| Depth | Product cut (help/garnish out; XP/level/streak stay as product state) |
| Approach | Surgical in-place edits (not layout rewrite) |
| Deck practice | User-paced: result + **Next** (no auto-advance / XP toast) |
| Adventure Restart | Immediate + client Undo (~8s); no confirm |
| Delete Deck | Keep `window.confirm` (irreversible) |

## Principle

Remove everything that cannot defend its existence. Every state answers: What happened? Why? What next? How to leave?

## Shell

- Drop footer link row and “Master Your Craft” tagline.
- Keep nav, skip link, topbar XP/title/streak, Sign out.
- Remove decorative CSS animations (`brand-pulse`, `bar-shimmer`, `panel-in`, gold shimmer/sparkle, `xp-toast-in`, `flip-deal-in`). Keep flip 3D as state change.

## Pages

- **Login:** Brand + form only.
- **Home:** Unchanged (already lean).
- **Decks:** No beginner hint / create explainer; keep Start here badge.
- **Deck detail:** No Active Quest badge, card snips, sword icon, Study tips, rail rank card; keep mastery, cards, Practice, admin, Delete confirm.
- **Practice:** Literal results; ratings disabled until flipped (no coach paragraphs).
- **Deck practice:** Grade → inline result → Next → summary (cards, XP, streak). No engagement copy.
- **Adventure:** No eyebrow; Restart + Undo banner; ending takeaways + XP kept.
- **Leaderboard / Settings:** Strip padding blurbs.
- **Support:** Contact only; delete FAQ.
- **FlipCard:** Show/Hide hint only; no “click to flip” cues.

## Out of scope

API/schema, XP math, routes, streak as data, full visual restyle, deck-detail layout rewrite beyond garnish removal.
