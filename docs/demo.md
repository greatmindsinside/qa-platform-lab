# Interview demo script (≈5 minutes)

1. **Clone & smoke** — `yarn install` → `yarn workspace @lab/shared build` → `yarn test:smoke`. Point at `@rbac` / `@progression` tags.
2. **Run the app** — `yarn workspace @lab/shared build` then `yarn dev`. Open `http://127.0.0.1:5173`. Sign in as `admin@lab.local` / `Admin123!`.
3. **Learning path** — On Home, show **Beginner → Intermediate → Expert** sections and the **Start here** badge on **QA Foundations**.
4. **Prep loop** — **Practice** on Start here → flip / **Show hint** → **Learning** → XP toast → auto-advance into an MCQ → pick A–D. **← End session** or finish → Home streak/XP.
5. **Soft path** — Without finishing Beginner, open **Quality Strategy & Influence** (Expert) → Practice still works (no lock).
6. **Member path** — Sign in as `member@lab.local` / `Member123!`. Same curriculum. Create a deck as admin elsewhere → invite member → member **Delete** → 403.
7. **Architecture** — Fastify layers, membership RBAC, Spec Kit under `specs/001-quest-deck/` / `002-mcq-cards/` / `003-learning-path/`.

Resume line: *Designed and owned a full-stack TypeScript quality system (unit → API → E2E → cross-layer) with RBAC, progression rules, and a Beginner→Expert interview-prep curriculum.*
