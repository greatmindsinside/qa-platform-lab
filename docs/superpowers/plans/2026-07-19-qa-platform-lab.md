# QA Platform Lab (Week-1 MVP) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a new public monorepo `qa-platform-lab` with a tiny B2B projects SaaS plus unit/API/E2E/cross-layer tests, PR smoke CI, and portfolio docs a hiring manager can clone and run in ≤5 minutes.

**Architecture:** Yarn workspaces monorepo: `apps/api` (Fastify + better-sqlite3 + JWT bearer auth), `apps/web` (Vite + React), `packages/testkit` (seed credentials + typed API helpers), root `tests/` for Vitest unit and Playwright API/E2E/cross-layer. Product risk centers on RBAC delete and invite membership; quality system proves those risks across layers.

**Tech Stack:** Node 22+, TypeScript 5, Fastify 5, better-sqlite3, jose (JWT), Vite 6, React 19, Vitest, Playwright, ESLint, GitHub Actions

## Global Constraints

- Spec: `docs/superpowers/specs/2026-07-19-qa-platform-lab-portfolio-design.md`
- Repo root: `C:/Users/great/Desktop/qa-platform-lab` (https://github.com/greatmindsinside/qa-platform-lab)
- Node **≥ 22**; package manager **yarn 1** (classic) for familiarity
- Seed passwords are public demo secrets only: `admin@lab.local` / `Admin123!` and `member@lab.local` / `Member123!`
- Never auto-submit anything external; this app has no third-party apply flows
- MVP out of scope: Allure, axe, visual, k6, Pact, OAuth, email, Postgres, QA dashboard, self-healing
- Commit implementation steps only when the user explicitly asks to commit
- Prefer role/label Playwright locators over CSS

---

## File structure

| Path | Responsibility |
| ---- | -------------- |
| `package.json` | Workspaces root; scripts `dev`, `test:unit`, `test:smoke`, `test:all`, `typecheck`, `lint` |
| `tsconfig.base.json` | Shared strict TS options |
| `.gitignore` | `node_modules`, `dist`, `test-results`, `playwright-report`, `*.db` |
| `apps/api/package.json` | API package |
| `apps/api/src/domain/rbac.ts` | Pure `canDeleteProject(role)` |
| `apps/api/src/db.ts` | SQLite schema + open connection |
| `apps/api/src/seed.ts` | Idempotent seed users |
| `apps/api/src/auth.ts` | Password hash verify, JWT sign/verify |
| `apps/api/src/routes/*.ts` | `/auth/login`, `/projects`, invite, delete |
| `apps/api/src/server.ts` | Fastify app factory `buildApp()` + listen |
| `apps/web/` | Vite React UI: Login, ProjectList, ProjectDetail |
| `packages/testkit/src/index.ts` | `SEED_USERS`, `ApiClient`, `resetDatabase()` helper |
| `tests/unit/rbac.test.ts` | Domain unit tests |
| `tests/api/*.spec.ts` | Playwright request tests |
| `tests/e2e/*.spec.ts` | UI journeys |
| `tests/cross-layer/invite.spec.ts` | UI invite + API assert |
| `playwright.config.ts` | Projects: api, e2e, cross-layer; grep tags |
| `.github/workflows/ci.yml` | PR smoke vs main full |
| `README.md`, `docs/quality-architecture.md`, `docs/demo.md` | Portfolio packaging |

---

### Task 1: Scaffold new repo + workspaces

**Files:**
- Create: `C:/Users/great/Desktop/qa-platform-lab/` (entire tree listed below)
- Create: `package.json`, `tsconfig.base.json`, `.gitignore`, `apps/api/package.json`, `apps/web/package.json`, `packages/testkit/package.json`, `README.md` (stub)

**Interfaces:**
- Produces: yarn workspaces named `@lab/api`, `@lab/web`, `@lab/testkit`

- [ ] **Step 1: Create directory and git init**

```bash
mkdir -p /c/Users/great/Desktop/qa-platform-lab
cd /c/Users/great/Desktop/qa-platform-lab
git init
```

- [ ] **Step 2: Write root `package.json`**

```json
{
  "name": "qa-platform-lab",
  "private": true,
  "workspaces": ["apps/*", "packages/*"],
  "scripts": {
    "dev:api": "yarn workspace @lab/api dev",
    "dev:web": "yarn workspace @lab/web dev",
    "dev": "yarn dev:api & yarn dev:web",
    "build": "yarn workspace @lab/api build && yarn workspace @lab/web build",
    "typecheck": "yarn workspace @lab/api typecheck && yarn workspace @lab/web typecheck && yarn workspace @lab/testkit typecheck",
    "test:unit": "vitest run",
    "test:smoke": "playwright test --grep @smoke",
    "test:all": "vitest run && playwright test",
    "lint": "echo \"lint wired in Task 9\""
  },
  "devDependencies": {
    "typescript": "^5.8.2",
    "vitest": "^3.0.0",
    "@playwright/test": "^1.51.0"
  },
  "engines": { "node": ">=22" }
}
```

- [ ] **Step 3: Write `tsconfig.base.json` and `.gitignore`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "noUncheckedIndexedAccess": true,
    "declaration": true
  }
}
```

```
node_modules/
dist/
coverage/
test-results/
playwright-report/
blob-report/
*.db
*.db-journal
.env
.DS_Store
```

- [ ] **Step 4: Stub workspace packages**

`apps/api/package.json`:

```json
{
  "name": "@lab/api",
  "version": "0.0.1",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "build": "tsc -p tsconfig.json",
    "typecheck": "tsc -p tsconfig.json --noEmit",
    "start": "node dist/server.js"
  }
}
```

Mirror minimal `apps/web/package.json` (`@lab/web`) and `packages/testkit/package.json` (`@lab/testkit`) with `"type": "module"` and `typecheck` scripts.

- [ ] **Step 5: Stub README**

```markdown
# qa-platform-lab

Owned B2B SaaS sample + risk-based TypeScript quality system (unit → API → E2E → cross-layer).

> Setup instructions land in Task 9. Requires Node 22+.
```

- [ ] **Step 6: Install**

```bash
cd /c/Users/great/Desktop/qa-platform-lab
yarn install
```

Expected: lockfile created; workspaces linked.

- [ ] **Step 7: Commit only if user asks**

---

### Task 2: Domain RBAC (TDD)

**Files:**
- Create: `apps/api/src/domain/rbac.ts`
- Create: `apps/api/tsconfig.json`
- Create: `vitest.config.ts` (repo root)
- Test: `tests/unit/rbac.test.ts`

**Interfaces:**

```ts
export type Role = 'admin' | 'member';
export function canDeleteProject(role: Role): boolean;
```

- [ ] **Step 1: Write failing test**

```ts
// tests/unit/rbac.test.ts
import { describe, expect, it } from 'vitest';
import { canDeleteProject } from '../../apps/api/src/domain/rbac.js';

describe('canDeleteProject', () => {
  it('allows admin', () => {
    expect(canDeleteProject('admin')).toBe(true);
  });
  it('denies member', () => {
    expect(canDeleteProject('member')).toBe(false);
  });
});
```

- [ ] **Step 2: Run to verify fail**

```bash
cd /c/Users/great/Desktop/qa-platform-lab
yarn vitest run tests/unit/rbac.test.ts
```

Expected: FAIL — cannot resolve module / `canDeleteProject` missing.

- [ ] **Step 3: Implement**

```ts
// apps/api/src/domain/rbac.ts
export type Role = 'admin' | 'member';

export function canDeleteProject(role: Role): boolean {
  return role === 'admin';
}
```

`apps/api/tsconfig.json`:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": { "outDir": "dist", "rootDir": "src" },
  "include": ["src"]
}
```

Root `vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/unit/**/*.test.ts'],
  },
});
```

- [ ] **Step 4: Run to verify pass**

```bash
yarn vitest run tests/unit/rbac.test.ts
```

Expected: PASS (2 tests).

- [ ] **Step 5: Commit only if user asks**

---

### Task 3: SQLite schema + seed

**Files:**
- Create: `apps/api/src/db.ts`, `apps/api/src/seed.ts`
- Modify: `apps/api/package.json` (deps: `better-sqlite3`, `bcryptjs`; dev: `@types/better-sqlite3`, `@types/bcryptjs`, `tsx`)
- Test: `tests/unit/seed.test.ts`

**Interfaces:**

```ts
export type Db = import('better-sqlite3').Database;
export function openDb(path?: string): Db;
export function migrate(db: Db): void;
export function seed(db: Db): void;
export const SEED_USERS: {
  email: string;
  password: string;
  role: 'admin' | 'member';
  displayName: string;
}[];
```

- [ ] **Step 1: Add dependencies**

```bash
cd /c/Users/great/Desktop/qa-platform-lab
yarn workspace @lab/api add better-sqlite3 bcryptjs
yarn workspace @lab/api add -D @types/better-sqlite3 @types/bcryptjs tsx
```

- [ ] **Step 2: Write failing seed test**

```ts
// tests/unit/seed.test.ts
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { openDb, migrate, seed } from '../../apps/api/src/db.js';
// If seed is separate, import seed from seed.js and re-export openDb/migrate from db.js

describe('seed', () => {
  const dbPath = path.join(os.tmpdir(), `lab-seed-${Date.now()}.db`);
  afterEach(() => {
    try { fs.unlinkSync(dbPath); } catch { /* ignore */ }
  });

  it('inserts admin and member once', () => {
    const db = openDb(dbPath);
    migrate(db);
    seed(db);
    seed(db); // idempotent
    const rows = db.prepare('SELECT email, role FROM users ORDER BY email').all();
    expect(rows).toEqual([
      { email: 'admin@lab.local', role: 'admin' },
      { email: 'member@lab.local', role: 'member' },
    ]);
    db.close();
  });
});
```

- [ ] **Step 3: Run — expect FAIL**

```bash
yarn vitest run tests/unit/seed.test.ts
```

- [ ] **Step 4: Implement `db.ts` + `seed.ts`**

```ts
// apps/api/src/db.ts
import Database from 'better-sqlite3';
import path from 'node:path';
import { seed } from './seed.js';

export type Db = Database.Database;

export function openDb(dbPath = process.env.LAB_DB_PATH ?? path.join(process.cwd(), 'lab.db')): Db {
  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  return db;
}

export function migrate(db: Db): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('admin','member')),
      display_name TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      owner_user_id INTEGER NOT NULL REFERENCES users(id),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS project_members (
      project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id),
      role TEXT NOT NULL CHECK(role IN ('admin','member')),
      PRIMARY KEY (project_id, user_id)
    );
  `);
}

export function resetAndSeed(dbPath?: string): Db {
  const db = openDb(dbPath);
  migrate(db);
  seed(db);
  return db;
}
```

```ts
// apps/api/src/seed.ts
import bcrypt from 'bcryptjs';
import type { Db } from './db.js';

export const SEED_USERS = [
  { email: 'admin@lab.local', password: 'Admin123!', role: 'admin' as const, displayName: 'Lab Admin' },
  { email: 'member@lab.local', password: 'Member123!', role: 'member' as const, displayName: 'Lab Member' },
];

export function seed(db: Db): void {
  const insert = db.prepare(
    `INSERT OR IGNORE INTO users (email, password_hash, role, display_name)
     VALUES (@email, @password_hash, @role, @display_name)`,
  );
  for (const u of SEED_USERS) {
    insert.run({
      email: u.email,
      password_hash: bcrypt.hashSync(u.password, 8),
      role: u.role,
      display_name: u.displayName,
    });
  }
}
```

Fix the unit test imports to match: `openDb`, `migrate` from `db.js`, `seed` from `seed.js`.

- [ ] **Step 5: Run — expect PASS**

```bash
yarn vitest run tests/unit/seed.test.ts
```

- [ ] **Step 6: Commit only if user asks**

---

### Task 4: Auth + projects API (TDD via Vitest HTTP)

**Files:**
- Create: `apps/api/src/auth.ts`, `apps/api/src/app.ts`, `apps/api/src/routes/auth.ts`, `apps/api/src/routes/projects.ts`, `apps/api/src/server.ts`
- Modify: `apps/api/package.json` (deps: `fastify`, `@fastify/cors`, `jose`)
- Test: `tests/unit/api-auth-projects.test.ts`

**Interfaces:**

```ts
export function buildApp(opts?: { dbPath?: string }): Promise<import('fastify').FastifyInstance>;
// Routes:
// POST /api/auth/login { email, password } -> { token, user: { id, email, role, displayName } }
// GET  /api/projects  Authorization: Bearer <token> -> Project[]
// POST /api/projects { name, description? } -> Project
// PATCH /api/projects/:id { name?, description? } -> Project
// POST /api/projects/:id/invites { email, role: 'admin'|'member' } -> { projectId, userId, role }
// DELETE /api/projects/:id -> 204 | 403
```

- [ ] **Step 1: Install API deps**

```bash
yarn workspace @lab/api add fastify @fastify/cors jose
```

- [ ] **Step 2: Write failing API integration tests** (inject Fastify, no Playwright yet)

```ts
// tests/unit/api-auth-projects.test.ts
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { buildApp } from '../../apps/api/src/app.js';

describe('API auth + projects', () => {
  let dbPath: string;
  let app: Awaited<ReturnType<typeof buildApp>>;

  beforeEach(async () => {
    dbPath = path.join(os.tmpdir(), `lab-api-${Date.now()}.db`);
    app = await buildApp({ dbPath });
  });

  afterEach(async () => {
    await app.close();
    try { fs.unlinkSync(dbPath); } catch { /* ignore */ }
  });

  async function login(email: string, password: string) {
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { email, password },
    });
    expect(res.statusCode).toBe(200);
    return res.json() as { token: string };
  }

  it('logs in admin', async () => {
    const { token } = await login('admin@lab.local', 'Admin123!');
    expect(token).toBeTruthy();
  });

  it('rejects bad password', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { email: 'admin@lab.local', password: 'wrong' },
    });
    expect(res.statusCode).toBe(401);
  });

  it('creates project as admin', async () => {
    const { token } = await login('admin@lab.local', 'Admin123!');
    const res = await app.inject({
      method: 'POST',
      url: '/api/projects',
      headers: { authorization: `Bearer ${token}` },
      payload: { name: 'Alpha', description: 'first' },
    });
    expect(res.statusCode).toBe(201);
    expect(res.json()).toMatchObject({ name: 'Alpha' });
  });

  it('member cannot delete project (403)', async () => {
    const admin = await login('admin@lab.local', 'Admin123!');
    const created = await app.inject({
      method: 'POST',
      url: '/api/projects',
      headers: { authorization: `Bearer ${admin.token}` },
      payload: { name: 'Beta' },
    });
    const projectId = (created.json() as { id: number }).id;
    await app.inject({
      method: 'POST',
      url: `/api/projects/${projectId}/invites`,
      headers: { authorization: `Bearer ${admin.token}` },
      payload: { email: 'member@lab.local', role: 'member' },
    });
    const member = await login('member@lab.local', 'Member123!');
    const del = await app.inject({
      method: 'DELETE',
      url: `/api/projects/${projectId}`,
      headers: { authorization: `Bearer ${member.token}` },
    });
    expect(del.statusCode).toBe(403);
  });

  it('admin can delete project (204)', async () => {
    const admin = await login('admin@lab.local', 'Admin123!');
    const created = await app.inject({
      method: 'POST',
      url: '/api/projects',
      headers: { authorization: `Bearer ${admin.token}` },
      payload: { name: 'Gamma' },
    });
    const projectId = (created.json() as { id: number }).id;
    const del = await app.inject({
      method: 'DELETE',
      url: `/api/projects/${projectId}`,
      headers: { authorization: `Bearer ${admin.token}` },
    });
    expect(del.statusCode).toBe(204);
  });
});
```

- [ ] **Step 3: Run — expect FAIL**

```bash
yarn vitest run tests/unit/api-auth-projects.test.ts
```

- [ ] **Step 4: Implement auth + app**

Minimal shapes (implement fully; keep files small):

```ts
// apps/api/src/auth.ts
import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import type { Role } from './domain/rbac.js';

const secret = () => new TextEncoder().encode(process.env.LAB_JWT_SECRET ?? 'lab-dev-secret-change-me');

export async function signToken(payload: { sub: string; role: Role; email: string }): Promise<string> {
  return new SignJWT({ role: payload.role, email: payload.email })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(payload.sub)
    .setExpirationTime('8h')
    .sign(secret());
}

export async function verifyToken(token: string): Promise<{ sub: string; role: Role; email: string }> {
  const { payload } = await jwtVerify(token, secret());
  return {
    sub: String(payload.sub),
    role: payload.role as Role,
    email: String(payload.email),
  };
}

export function verifyPassword(plain: string, hash: string): boolean {
  return bcrypt.compareSync(plain, hash);
}
```

`buildApp({ dbPath })` must: open DB, migrate, seed, register CORS, register routes, decorate `db`. Use `canDeleteProject` for DELETE. Invite looks up user by email, inserts `project_members`. List projects returns projects where user is owner or member.

`server.ts`:

```ts
import { buildApp } from './app.js';

const port = Number(process.env.PORT ?? 3333);
const app = await buildApp();
await app.listen({ port, host: '0.0.0.0' });
console.log(`API on http://localhost:${port}`);
```

- [ ] **Step 5: Run — expect PASS**

```bash
yarn vitest run tests/unit/api-auth-projects.test.ts
```

- [ ] **Step 6: Commit only if user asks**

---

### Task 5: testkit + Playwright API project (`@smoke` / `@rbac`)

**Files:**
- Create: `packages/testkit/src/index.ts`, `packages/testkit/tsconfig.json`
- Create: `playwright.config.ts`
- Create: `tests/api/auth.spec.ts`, `tests/api/rbac-delete.spec.ts`
- Create: `scripts/start-api-for-tests.mjs` (or use Playwright `webServer`)

**Interfaces:**

```ts
// packages/testkit/src/index.ts
export const SEED_USERS = [ /* same credentials as API seed */ ];
export class ApiClient {
  constructor(private baseURL: string, private token?: string) {}
  withToken(token: string): ApiClient;
  login(email: string, password: string): Promise<{ token: string }>;
  createProject(name: string): Promise<{ id: number; name: string }>;
  invite(projectId: number, email: string, role: 'admin' | 'member'): Promise<void>;
  deleteProject(projectId: number): Promise<{ status: number }>;
  getMemberships(projectId: number): Promise<{ email: string; role: string }[]>;
}
```

- [ ] **Step 1: Implement testkit `ApiClient` using `fetch`**

- [ ] **Step 2: Write `playwright.config.ts`**

```ts
import { defineConfig } from '@playwright/test';

const API = process.env.LAB_API_URL ?? 'http://127.0.0.1:3333';
const WEB = process.env.LAB_WEB_URL ?? 'http://127.0.0.1:5173';

export default defineConfig({
  testDir: './tests',
  timeout: 30_000,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: { trace: 'on-first-retry' },
  projects: [
    { name: 'api', testMatch: /tests\/api\/.*\.spec\.ts/ },
    { name: 'e2e', testMatch: /tests\/e2e\/.*\.spec\.ts/, use: { baseURL: WEB } },
    { name: 'cross-layer', testMatch: /tests\/cross-layer\/.*\.spec\.ts/, use: { baseURL: WEB } },
  ],
  webServer: [
    {
      command: 'yarn workspace @lab/api dev',
      url: `${API}/api/health`,
      reuseExistingServer: !process.env.CI,
      env: { PORT: '3333', LAB_DB_PATH: './test-lab.db' },
    },
    {
      command: 'yarn workspace @lab/web dev --host 127.0.0.1 --port 5173',
      url: WEB,
      reuseExistingServer: !process.env.CI,
    },
  ],
});
```

Add `GET /api/health` → `{ ok: true }` in Task 4 app if missing.

- [ ] **Step 3: Write API specs with tags**

```ts
// tests/api/auth.spec.ts
import { test, expect } from '@playwright/test';
import { ApiClient, SEED_USERS } from '@lab/testkit';

const base = process.env.LAB_API_URL ?? 'http://127.0.0.1:3333';

test('login happy @smoke @auth', async () => {
  const client = new ApiClient(base);
  const admin = SEED_USERS.find((u) => u.role === 'admin')!;
  const { token } = await client.login(admin.email, admin.password);
  expect(token).toBeTruthy();
});

test('login bad password @auth', async ({ request }) => {
  const res = await request.post(`${base}/api/auth/login`, {
    data: { email: 'admin@lab.local', password: 'nope' },
  });
  expect(res.status()).toBe(401);
});
```

```ts
// tests/api/rbac-delete.spec.ts
import { test, expect } from '@playwright/test';
import { ApiClient, SEED_USERS } from '@lab/testkit';

const base = process.env.LAB_API_URL ?? 'http://127.0.0.1:3333';

test('member delete forbidden; admin delete ok @smoke @rbac @mutation', async () => {
  const adminUser = SEED_USERS.find((u) => u.role === 'admin')!;
  const memberUser = SEED_USERS.find((u) => u.role === 'member')!;
  const admin = await new ApiClient(base).login(adminUser.email, adminUser.password).then((r) =>
    new ApiClient(base, r.token),
  );
  const project = await admin.createProject(`rbac-${Date.now()}`);
  await admin.invite(project.id, memberUser.email, 'member');
  const member = await new ApiClient(base).login(memberUser.email, memberUser.password).then((r) =>
    new ApiClient(base, r.token),
  );
  expect((await member.deleteProject(project.id)).status).toBe(403);
  expect((await admin.deleteProject(project.id)).status).toBe(204);
});
```

Wire `@lab/testkit` exports in its `package.json` `"exports": { ".": "./src/index.ts" }` (or built `dist`) so Playwright/tsx can resolve.

- [ ] **Step 4: Run smoke API only (web may 404 until Task 6 — temporarily comment webServer web entry OR stub web)**

Until web exists, set `webServer` to API-only, or add a one-line Vite stub page. Prefer stub in Task 5:

`apps/web` minimal Vite `index.html` + `npm create` equivalent so `webServer` health check passes.

- [ ] **Step 5: Run**

```bash
yarn playwright test --project=api --grep @smoke
```

Expected: PASS.

- [ ] **Step 6: Commit only if user asks**

---

### Task 6: React UI (login, list/create, invite, delete)

**Files:**
- Create: `apps/web` Vite React TS app files: `src/main.tsx`, `src/App.tsx`, `src/api.ts`, `src/pages/LoginPage.tsx`, `src/pages/ProjectsPage.tsx`, `src/pages/ProjectDetailPage.tsx`
- Modify: `apps/web/package.json` (react, react-dom, vite, `@vitejs/plugin-react`)

**Interfaces:**
- Consumes: same REST API as Task 4
- Produces: accessible UI — email/password fields, buttons named "Sign in", "Create project", "Invite", "Delete project"

- [ ] **Step 1: Scaffold Vite React**

```bash
cd /c/Users/great/Desktop/qa-platform-lab/apps/web
# If empty stub exists, add deps:
yarn workspace @lab/web add react react-dom
yarn workspace @lab/web add -D vite @vitejs/plugin-react typescript @types/react @types/react-dom
```

`vite.config.ts` proxy `/api` → `http://127.0.0.1:3333`.

- [ ] **Step 2: Implement `api.ts` client** storing token in `sessionStorage`

- [ ] **Step 3: Implement pages**

Requirements:
- Login form labels: "Email", "Password"; button role `Sign in`
- Projects page: heading "Projects"; textbox "Project name"; button "Create project"; list links by project name
- Detail: textbox "Invite email"; combobox/select "Role"; button "Invite"; button "Delete project" (visible to all; server enforces RBAC; show error text on 403)

Keep CSS minimal (unopinionated layout).

- [ ] **Step 4: Manual smoke**

```bash
yarn dev:api
# other terminal
yarn dev:web
```

Log in as admin, create project, invite member, confirm member sees 403 on delete.

- [ ] **Step 5: Commit only if user asks**

---

### Task 7: E2E Playwright UI

**Files:**
- Create: `tests/e2e/login.spec.ts`, `tests/e2e/create-project.spec.ts`
- Create: `tests/fixtures/lab.ts` (Playwright fixtures `asAdmin` / `asMember` UI helpers)

**Interfaces:**

```ts
// tests/fixtures/lab.ts
import { test as base, expect } from '@playwright/test';
import { SEED_USERS } from '@lab/testkit';

export const test = base.extend<{ asAdmin: void; asMember: void }>({
  asAdmin: async ({ page }, use) => {
    const admin = SEED_USERS.find((u) => u.role === 'admin')!;
    await page.goto('/login');
    await page.getByLabel('Email').fill(admin.email);
    await page.getByLabel('Password').fill(admin.password);
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page.getByRole('heading', { name: 'Projects' })).toBeVisible();
    await use();
  },
  // asMember analogous
});
export { expect };
```

- [ ] **Step 1: Write failing E2E specs**

```ts
// tests/e2e/login.spec.ts
import { test, expect } from '../fixtures/lab';

test('admin login @smoke @auth', async ({ page, asAdmin }) => {
  await expect(page.getByRole('heading', { name: 'Projects' })).toBeVisible();
});

test('bad password shows error @auth', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Email').fill('admin@lab.local');
  await page.getByLabel('Password').fill('wrong');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page.getByText(/invalid|unauthorized|failed/i)).toBeVisible();
});
```

```ts
// tests/e2e/create-project.spec.ts
import { test, expect } from '../fixtures/lab';

test('create project via UI @smoke @mutation', async ({ page, asAdmin }) => {
  const name = `UI-${Date.now()}`;
  await page.getByLabel('Project name').fill(name);
  await page.getByRole('button', { name: 'Create project' }).click();
  await expect(page.getByRole('link', { name })).toBeVisible();
});
```

- [ ] **Step 2: Run**

```bash
yarn playwright test --project=e2e --grep @smoke
```

Expected: PASS (fix UI labels if needed).

- [ ] **Step 3: Commit only if user asks**

---

### Task 8: Cross-layer invite test

**Files:**
- Create: `tests/cross-layer/invite.spec.ts`
- Modify: API if needed — `GET /api/projects/:id/members` returning `{ email, role }[]`

**Interfaces:**
- Consumes: UI invite + `ApiClient.getMemberships(projectId)`
- Produces: one tagged test `@smoke` proving UI → API membership

- [ ] **Step 1: Ensure members endpoint exists** (add Vitest inject test if new)

- [ ] **Step 2: Write cross-layer spec**

```ts
import { test, expect } from '../fixtures/lab';
import { ApiClient, SEED_USERS } from '@lab/testkit';

const apiBase = process.env.LAB_API_URL ?? 'http://127.0.0.1:3333';

test('invite member in UI appears in API @smoke @mutation', async ({ page, asAdmin }) => {
  const name = `XL-${Date.now()}`;
  await page.getByLabel('Project name').fill(name);
  await page.getByRole('button', { name: 'Create project' }).click();
  await page.getByRole('link', { name }).click();
  await page.getByLabel('Invite email').fill('member@lab.local');
  await page.getByLabel('Role').selectOption('member');
  await page.getByRole('button', { name: 'Invite' }).click();
  await expect(page.getByText('member@lab.local')).toBeVisible();

  const admin = SEED_USERS.find((u) => u.role === 'admin')!;
  const token = (await new ApiClient(apiBase).login(admin.email, admin.password)).token;
  const client = new ApiClient(apiBase, token);
  // Resolve project id: list projects and find by name
  const projects = await client.listProjects();
  const project = projects.find((p) => p.name === name)!;
  const members = await client.getMemberships(project.id);
  expect(members.some((m) => m.email === 'member@lab.local' && m.role === 'member')).toBe(true);
});
```

Add `listProjects()` to `ApiClient` if missing.

- [ ] **Step 3: Run**

```bash
yarn playwright test --project=cross-layer --grep @smoke
```

Expected: PASS.

- [ ] **Step 4: Commit only if user asks**

---

### Task 9: CI + portfolio docs + lint/typecheck scripts

**Files:**
- Create: `.github/workflows/ci.yml`
- Create: `docs/quality-architecture.md`, `docs/demo.md`
- Modify: `README.md`, root `package.json` scripts, add eslint if lightweight

- [ ] **Step 1: Write CI workflow**

```yaml
name: ci
on:
  pull_request:
  push:
    branches: [main]
jobs:
  pr-smoke:
    if: github.event_name == 'pull_request'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '22', cache: yarn }
      - run: yarn install --frozen-lockfile
      - run: yarn typecheck
      - run: yarn test:unit
      - run: npx playwright install --with-deps chromium
      - run: yarn test:smoke
      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
  main-full:
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '22', cache: yarn }
      - run: yarn install --frozen-lockfile
      - run: yarn typecheck
      - run: yarn test:all
      - run: npx playwright install --with-deps chromium
      - run: yarn playwright test
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

Fix `test:all` so it does not double-run Playwright before browsers install — prefer:

```json
"test:unit": "vitest run",
"test:smoke": "playwright test --grep @smoke",
"test:all": "vitest run && playwright test"
```

And in `main-full`, run `yarn test:unit` then install browsers then `yarn playwright test` (remove duplicate from `test:all` in CI).

- [ ] **Step 2: Write `docs/quality-architecture.md`**

Must include: pyramid diagram (text), tags (`@smoke` `@auth` `@rbac` `@mutation`), flake policy (“quarantine with `@flaky`, fix within one week”), explicit non-goals list from the design spec, how PR vs `main` gates differ.

- [ ] **Step 3: Write `docs/demo.md`**

60-second script:

1. Open README CI badge
2. Show `canDeleteProject` unit test
3. Run or open report for `@rbac` member 403
4. Show cross-layer invite spec
5. Walk UI login as admin once

- [ ] **Step 4: Finalize README**

Include:
- One-sentence problem statement from design
- Stack badges (text OK)
- CI badge markdown (repo slug placeholder `YOUR_USER/qa-platform-lab`)
- Node 22+
- Commands:

```bash
yarn install
yarn test:unit
yarn test:smoke
```

- Expected smoke time note (~under 2 minutes locally)
- Resume-safe bullet for copy/paste from design spec

- [ ] **Step 5: Local verification gate**

```bash
cd /c/Users/great/Desktop/qa-platform-lab
yarn typecheck
yarn test:unit
npx playwright install chromium
yarn test:smoke
yarn playwright test
```

Expected: all green.

- [ ] **Step 6: Publish checklist (human)**

1. Create public GitHub repo `qa-platform-lab`
2. Push `main`
3. Confirm Actions green
4. Pin repo; add LinkedIn Featured link
5. Optional: add one-line pointer from copilot career notes to the URL

- [ ] **Step 7: Commit only if user asks**

---

## Out of scope for this plan (Phase 2+)

AJV/OpenAPI schemas, axe, flake quarantine automation, demo GIF, QA ops page, k6, Pact, Postgres — tracked in design spec Phases 2–3 only.

---

## Spec coverage self-check

| Spec requirement | Task |
| ---------------- | ---- |
| Greenfield B2B projects SaaS | 3–6 |
| Roles admin/member; admin-only delete | 2, 4, 5 |
| Invite member | 4, 6, 8 |
| Unit Vitest | 2, 3, 4 |
| API + E2E + cross-layer | 5, 7, 8 |
| Fixtures asAdmin/asMember | 7 |
| Tags @smoke @auth @rbac @mutation | 5, 7, 8 |
| CI PR smoke / main full + report artifact | 9 |
| quality-architecture + README + demo | 9 |
| Implement in this public repo | 1 + publish checklist |
| Phase 2/3 deferred | Out of scope section |

**Placeholder scan:** none intentional. **Type consistency:** `Role = 'admin' \| 'member'`; seed emails/passwords consistent across seed, testkit, docs.
