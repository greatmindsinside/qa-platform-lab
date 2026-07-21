# UI/UX audit findings — Quest Deck

**Date:** 2026-07-20 (updated 2026-07-20 QA pass)  
**Scope:** Authenticated SPA (`apps/web`) + shared shell

## Application map

| | |
|--|--|
| **Users** | Lab Admin (invite/delete/create), Lab Member (practice/adventure) |
| **Goals** | Sign in → follow learning path → practice decks → adventure → track XP |
| **Stack** | React 19, React Router 7, Vite, CSS tokens, Playwright + axe |
| **Constraints** | Demo JWT in localStorage; real Leaderboard / Settings / Support pages |

## Findings (prior pass — fixed)

| ID | Screen | User problem | Severity | Status |
|----|--------|--------------|----------|--------|
| UX-01 | Deck detail | Delete Deck is one-click destructive | Critical | Fixed |
| UX-02 | Shell | Decks looks active but is not navigable | High | Fixed (`/decks`) |
| UX-03 | Shell | No skip-to-content; no `<main>` | High | Fixed |
| UX-04 | Shell ≤860px | Sidebar dumps into page | High | Fixed |
| UX-05 | Practice | Card-not-found still says Loading… | High | Fixed |
| UX-06 | Deck detail | Fake Combat Log looks live | High | Fixed |
| UX-07 | Home/Shell | Manage / Quests / Adventure mismatch | High | Fixed |
| UX-08 | Global | Weak keyboard focus on CTAs | High | Fixed |
| UX-09 | Adventure | Restart wipes progress without confirm | High | Fixed |
| UX-10 | Shell | Stubs look like real nav | Medium | Fixed (real pages) |
| UX-11–17, 19–20 | Various | a11y / form / auth polish | Medium–Low | Fixed |

## Findings (2026-07-20 follow-up QA)

| ID | Screen | User problem | Severity | Status |
|----|--------|--------------|----------|--------|
| UX-21 | Shell | Settings/Support fall below fold when main content is tall | High | Fixed (viewport shell + scroll main) |
| UX-22 | Shell | Decks loses `aria-current` on `/decks/:id` and play | High | Fixed (drop NavLink `end`) |
| UX-23 | Decks | Empty description shows trailing `·` | Low | Fixed |
| UX-24 | Settings | Display name field can desync from `user` | Low | Fixed |
| UX-25 | Practice | Session errors missing `role="alert"` | Low | Fixed |
