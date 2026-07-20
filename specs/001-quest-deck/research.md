# Research: Quest Deck MVP

## Decision: Spec Kit as SDD toolchain

**Choice**: GitHub Spec Kit (`specify` CLI + Cursor agent skills)  
**Rationale**: Greenfield 0→1; constitution + gated specify/plan/tasks/implement; GitHub-recognizable for portfolio interviews.  
**Alternatives considered**: OpenSpec (better brownfield deltas — revisit Phase 2); Superpowers-only (kept as execution skills, not primary SDD layout).

## Decision: Product = Quest Deck (not generic B2B projects)

**Choice**: Gamified interview prep decks with XP/level/streak  
**Rationale**: Dual north star — author will use it; still provides authz/CRUD risk for quality proof.  
**Alternatives**: Job tracker; flake log; SauceDemo wrapper (rejected — peer-saturated / not owned AUT).

## Decision: Gamification scope (RPG-lite)

**Choice**: XP, levels, titles, streaks, confidence mastery; no leaderboards/loot/AI  
**Rationale**: Self-Determination Theory (competence/autonomy/relatedness); Duolingo lesson — tiny daily win for streak; avoid dark patterns.  
**Alternatives**: Boss battles / spaced repetition deferred to Phase 2.

## Decision: Stack

**Choice**: Fastify + SQLite + React/Vite + Vitest + Playwright + Yarn workspaces  
**Rationale**: Matches hiring market for modern TS SDET/QE; SQLite keeps clone→run friction low.  
**Alternatives**: Express (fine but Fastify locked); Postgres (Phase 3).

## Decision: Authz model

**Choice**: Deck membership role for delete/invite, not global `users.role`  
**Rationale**: Realistic SaaS authz; invite mentor story; cleaner RBAC tests. Seed member on all decks so prep works day one while delete still 403 for members.  
**Test obligation**: Prove a global-`member` user with deck-`admin` membership can delete (membership wins).

## Decision: XP bar + mastery on list

**Choice**: `xpIntoLevel` / `xpToNextLevel` on `/api/me`; `masteryPercent` on each deck in `GET /api/decks`  
**Rationale**: Dual north star UX — progress must be visible without client-side formula drift.
