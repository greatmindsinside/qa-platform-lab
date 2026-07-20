# Quality architecture

Quest Deck’s quality system is the portfolio half of the dual north star: the same product you practice with is the AUT under a layered test pyramid.

## Layers

| Layer | Tool | What it proves |
| ----- | ---- | -------------- |
| Unit / inject | Vitest | Domain XP/streak/RBAC; Fastify inject for health/login/practice/delete |
| API | Playwright | HTTP against a live API (`@smoke`, `@auth`, `@rbac`, `@progression`) |
| E2E | Playwright | Browser login → practice → Home streak |
| Cross-layer | Playwright | API invite + UI visibility (`@mutation`) |

## Tags

- `@smoke` — PR gate (~clone → green)
- `@auth` — login / session
- `@rbac` — membership-based delete
- `@progression` — XP / streak
- `@mutation` — state-changing flows

## Local commands

```bash
yarn lint
yarn typecheck
yarn test:unit
yarn test:smoke
yarn test:all
```

## Authz test obligation

At least one test proves delete uses **deck membership** role: a global `member` with deck `admin` membership can delete (204), while deck `member` gets 403.
