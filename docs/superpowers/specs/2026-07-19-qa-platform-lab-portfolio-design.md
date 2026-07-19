# QA Platform Lab — Portfolio Design

**Date:** 2026-07-19  
**Status:** Approved for planning (Approach 1 — B2B SaaS mini-app + owned test system)  
**Repo:** [greatmindsinside/qa-platform-lab](https://github.com/greatmindsinside/qa-platform-lab) (public)  
**Working name:** `qa-platform-lab`

## Goal

Ship a cloneable portfolio proof that a hiring manager can run in ~5 minutes, demonstrating **cohesive Quality Engineering system ownership** (not isolated tool skills): product under test + layered tests + CI gates + risk-based coverage + cross-layer validation.

**Job-search outcomes:**

- Resume / LinkedIn: one system narrative for Senior/Staff QA Automation and Quality Platform roles
- Interview: 60-second walkthrough (RBAC + UI/API/DB cross-layer + CI artifact)
- Ongoing side project: MVP in ~1 week, then phased depth

## Decisions locked

| Topic              | Choice                                                                                         |
| ------------------ | ---------------------------------------------------------------------------------------------- |
| Outcome            | **A** — Public portfolio proof (clone, run, understand quickly)                                |
| Cadence            | **C** — Ongoing side project; MVP linkable in ~1 week, then layers                             |
| AUT strategy       | **A** — Greenfield mini-product (own the app and the suite)                                    |
| Product approach   | **1** — Tiny B2B SaaS + owned test system (not SauceDemo wrapper, not test-shell-only)         |
| Domain             | Team access / projects: login, CRUD projects, invite member, admin-only delete                 |
| Stack              | React + TypeScript UI; Node + TypeScript API (Fastify or Express); SQLite (Postgres-ready)     |
| Auth               | Simple session or JWT; roles `admin` \| `member`                                               |
| Headline proof     | Cross-layer invite + RBAC 403 even if UI bypassed                                              |
| Out of MVP scope   | Billing, OAuth, email delivery, multi-tenant orgs, Allure, visual, a11y, k6, Pact, QA dashboard, self-healing |

## Product (AUT)

### MVP users and flows

1. Sign in (seeded `admin@lab.local`, `member@lab.local`)
2. List / create / edit projects (workspaces)
3. Invite a member to a project (role: admin | member)
4. Guarded action: only admins can delete a project

### Non-goals (product)

No billing, OAuth, real email, fancy UI, or multi-org tenancy. Product exists to create **authz, CRUD, and state** risk for the quality system.

## Test architecture

### Layers

| Layer       | Tool                         | Proves                                      |
| ----------- | ---------------------------- | ------------------------------------------- |
| Unit        | Vitest                       | Domain rules (roles, validation) without HTTP |
| API         | Playwright `request` or Vitest + fetch | Auth, CRUD, 403 authz, schema       |
| E2E         | Playwright UI                | Critical journeys only                      |
| Cross-layer | Hybrid specs                 | UI action → API and/or DB assert            |

### Week-1 MVP (must ship)

1. Seeded admin + member accounts
2. Fixtures: `asAdmin`, `asMember` (API + UI)
3. Tags: `@smoke` `@auth` `@rbac` `@mutation`
4. Specs:
   - Login happy path + bad password
   - Create project (API + one UI path)
   - RBAC: member delete → 403; admin delete → 204 + row gone
   - One cross-layer invite: UI invite → GET membership → DB/API confirms role
5. CI: PR = lint + typecheck + unit + `@smoke`; `main` = full suite; HTML report artifact
6. `docs/quality-architecture.md` — layers, tags, flake policy, explicit non-automated areas
7. README: one-sentence problem, stack, CI badge, clone → install → `test:smoke` in 5 minutes

### Phase 2 (weeks 2–4)

- AJV/OpenAPI schema on mutating endpoints
- axe smoke on login + project list
- Flake quarantine (`@flaky`) + issue template
- Trace-on-failure + short demo GIF/Loom linked from README

### Phase 3 (ongoing)

- Tiny QA ops page (last CI run, failures by tag)
- Optional k6 smoke on auth + list projects
- Contract tests if UI/API packages split
- Postgres swap + migration tests

### Explicitly deferred (peer-saturated / low early ROI)

Self-healing locators, agentic MCP demos, SauceDemo/ReqRes-only frameworks, kitchen-sink Allure+visual+k6+Pact in week 1.

## Repo shape

```
apps/api/                 # Fastify/Express + SQLite
apps/web/                 # React UI
packages/testkit/         # shared fixtures, seed, clients
tests/unit/
tests/api/
tests/e2e/
tests/cross-layer/
docs/quality-architecture.md
docs/demo.md              # 60-second interview script + commands
.github/workflows/ci.yml
README.md
```

## CI gates

| Trigger | Jobs                                      | Pass rule                          |
| ------- | ----------------------------------------- | ---------------------------------- |
| PR      | lint, typecheck, unit, Playwright `@smoke` | Must be green to merge            |
| `main`  | full API + E2E + cross-layer              | Public CI badge tracks `main`      |
| Failure | Playwright HTML report + traces           | Linked from Actions run            |

PR smoke target: under ~2 minutes. Document expected full-suite time in README.

## Job-search packaging

1. Pin public repo on GitHub; feature on LinkedIn
2. Resume bullet (system, not tool list):  
   *Designed and owned a full-stack TypeScript quality system (unit → API → E2E → UI/API/DB cross-layer) with RBAC risk coverage and PR smoke gates for a sample B2B SaaS.*
3. Interview script: product risk → pyramid → RBAC 403 → cross-layer invite → CI artifact
4. Do **not** list Playwright / CI / API as separate skill projects
5. Do **not** claim this lab as employer production work
6. Private `job-application-copilot` remains a separate talking point for real-system scale when asked

## Peer-portfolio context (why this shape)

Most peer SDET repos wrap SauceDemo/ReqRes with POM + CI + Allure. That is table stakes. Owning the AUT plus cross-layer and RBAC proof differentiates toward Senior/Staff and Quality Platform narratives aligned with Lawson’s target roles (QA Automation, SDET, Quality Platform / Test Infrastructure).

## Success criteria

- [ ] Stranger can clone and run `@smoke` in ≤5 minutes with documented Node version
- [ ] CI badge green on `main`
- [ ] At least one RBAC and one cross-layer test visible in report
- [ ] `docs/quality-architecture.md` explains the system in one sitting
- [ ] Resume/LinkedIn link uses the system bullet above

## Implementation boundary

Implement in **this** repository. Keep personal job-search tooling (`job-application-copilot`) separate; it may remain a private talking point for real-system scale in interviews.
