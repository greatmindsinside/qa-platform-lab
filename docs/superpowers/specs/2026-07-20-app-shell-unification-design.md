# App shell unification design

**Date:** 2026-07-20  
**Status:** Approved (option A + route-level layout)

## Goal

Every authenticated page uses the same chrome as deck detail: top bar, left sidebar nav, footer (`AppShell` / `quest-shell`). Login and the JWT restore loading gate stay shell-free.

## Scope

| Route | Shell | Nav highlight |
|-------|-------|---------------|
| `/` | Yes | Home |
| `/decks/:id` | Yes | Decks |
| `/decks/:id/play` | Yes | Decks |
| `/practice/:id` | Yes | Decks |
| `/adventure` | Yes | Quests |
| `/login` | No | — |

## Architecture

**Route-level layout** in `App.tsx`: authenticated routes nest under a layout that renders `AppShell` + `<Outlet />`. Pages render only main content (no duplicate brand / Sign out).

`activeNav` is derived from `useLocation()`:
- `/adventure` → `quests`
- `/decks/*` or `/practice/*` → `decks`
- else → `home`

## Page content changes

- **Home:** Remove hero brand row + Sign out; keep XP bar, adventure, path sections.
- **Deck detail:** Remove inner `AppShell` wrapper (layout provides it).
- **Adventure / practice / play:** Drop outer `app-shell`; keep session UI. Adventure may keep Restart; “← Home” is optional (sidebar Home is enough).

## Non-goals

- Redesigning Home tiles or practice card chrome
- Making Leaderboard / Settings / Support functional
- Shell on login

## Test impact

E2E that rely on Main nav Home (already used in MCQ) keep working. Adventure “Back to Home” link remains. A11y smoke on Home must still pass with sidebar landmarks.
