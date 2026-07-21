# Design: Quest Deck deck-detail layout (mockup pass)

**Date:** 2026-07-20  
**Status:** Approved (user: “Do it”)  
**Scope:** Deck detail first; Home shell follow-up later

## Decisions

- **Layout approach:** App shell (top bar + left nav + footer) + deck-detail center/right content
- **Placeholders:** Full visual chrome; Combat Log = static demo lines; Leaderboard/Settings/Support = non-functional
- **Real data:** Deck name/description/mastery, cards (MCQ/OPEN), Start Practice, invite/delete (admin)

## Out of scope

- Restyling Home / Adventure / Practice to this chrome (follow-up)
- Real activity feed / leaderboard APIs
- New backend

## Success

- `/decks/:id` visually matches mockup structure (3-column + chrome)
- Existing practice/invite/delete flows still work
- Smoke tests still green
