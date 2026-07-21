# App Shell Unification Implementation Plan

> **For agentic workers:** Implement task-by-task. Steps use checkbox syntax.

**Goal:** Put `AppShell` around every authenticated route so Home, practice, and adventure match deck detail chrome.

**Architecture:** Authenticated layout route in `App.tsx` wraps `AppShell` + `Outlet`; pages drop duplicate headers.

**Tech Stack:** React Router 6, existing `AppShell` + `styles.css` quest-shell tokens.

## Global Constraints

- Login stays without shell
- Do not break `@smoke` E2E locators for Practice / End session / Adventure

---

### Task 1: Authenticated layout route

**Files:** `apps/web/src/App.tsx`, optionally `apps/web/src/components/AuthenticatedLayout.tsx`

- [x] Add layout with `AppShell` + `Outlet`, derive `activeNav` from pathname
- [x] Nest authenticated routes under the layout
- [x] Pass `user` + `onSignOut` into shell; stop requiring every page to own Sign out

### Task 2: Strip page-level chrome

**Files:** `HomePage.tsx`, `DeckDetailPage.tsx`, `AdventurePage.tsx`, `DeckPracticePage.tsx`, `PracticePage.tsx`

- [x] Remove duplicate brand / Sign out / outer `app-shell` / nested `AppShell`
- [x] Keep page content panels; trim redundant “← Home” where sidebar covers it

### Task 3: CSS + verify

- [x] Ensure `shell-main` fits adventure/practice panels (no broken max-width)
- [x] `yarn lint && yarn typecheck && yarn test:smoke`
