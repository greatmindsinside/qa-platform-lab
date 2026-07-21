# Interview demo script (≈5 minutes)

1. **Clone & smoke** — `yarn install` → `yarn workspace @lab/shared build` → `yarn workspace @lab/testkit build` → `yarn test:smoke`. Point at tags in [`tests/README.md`](../tests/README.md); open [`tests/api/rbac-delete.spec.ts`](../tests/api/rbac-delete.spec.ts) (`@rbac`) and [`tests/api/practice-xp.spec.ts`](../tests/api/practice-xp.spec.ts) (`@progression`).
2. **Run the app** — `yarn workspace @lab/shared build` then `yarn dev`. Open `http://127.0.0.1:5173` (or the port Vite prints if 5173 is busy). Sign in as `admin@lab.local` / `Admin123!`.
3. **Learning path** — On Home, show **Beginner → Intermediate → Expert** and **Start here** on **QA Foundations**. Proof: [`tests/e2e/learning-path.spec.ts`](../tests/e2e/learning-path.spec.ts); design: [`specs/003-learning-path/`](../specs/003-learning-path/).
3b. **Adventure (optional 60s)** — Open **Flaky Friday** from Home → pick choices → ending takeaways → Home XP +25 on first completion. Proof: [`tests/e2e/adventure.spec.ts`](../tests/e2e/adventure.spec.ts); design: [`specs/005-qa-adventure/`](../specs/005-qa-adventure/).
4. **Prep loop** — **Practice** on Start here → flip / **Show hint** → **Learning** → XP toast → auto-advance into an MCQ → pick A–D. **← End session** or finish → Home streak/XP. Proof: [`tests/e2e/practice.spec.ts`](../tests/e2e/practice.spec.ts), [`tests/e2e/mcq-practice.spec.ts`](../tests/e2e/mcq-practice.spec.ts).
5. **Soft path** — Without finishing Beginner, open **Quality Strategy & Influence** (Expert) → Practice still works (no lock). Same learning-path E2E + [`specs/003-learning-path/`](../specs/003-learning-path/).
6. **Member path** — Sign in as `member@lab.local` / `Member123!`. Create a deck as admin → invite member → member **Delete** → 403. Proof: [`tests/api/rbac-delete.spec.ts`](../tests/api/rbac-delete.spec.ts); invite visibility: [`tests/cross-layer/invite.spec.ts`](../tests/cross-layer/invite.spec.ts).
7. **Architecture** — Fastify `domain` / `application` / `http`; membership RBAC; Spec Kit under `specs/001`–`005`. Walk the matrix in [quality-architecture.md](./quality-architecture.md).

Resume line: *Designed and owned a full-stack TypeScript quality system (unit → API → E2E → cross-layer) with RBAC, progression rules, a Beginner→Expert interview-prep curriculum, and a choice-driven QA adventure.*
