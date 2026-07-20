# How to use this repository

## Audiences

| You are… | Start here |
| -------- | ---------- |
| **Employer / interviewer** | [Root README](../README.md) → `yarn test:smoke` → [quality architecture](./quality-architecture.md) → [demo script](./demo.md) → [tests map](../tests/README.md) |
| **Practitioner** (interview prep with Quest Deck) | [Using Quest Deck](./using-quest-deck.md) |
| **Builder** (changing the product) | [Spec-Driven Development](./spec-driven-development.md) → [CONTRIBUTING](../CONTRIBUTING.md) |

## Employer path (≤5 minutes)

1. Skim [why this repo](../README.md#why-this-repo-for-employers) and the [repo map](../README.md#repo-map).
2. Run smoke: `yarn install` → build `@lab/shared` + `@lab/testkit` → `yarn test:smoke`.
3. Open [quality-architecture.md](./quality-architecture.md) — layers, tags, risk → spec → test → CI matrix.
4. Walk [demo.md](./demo.md); open the cited files under `tests/` when you hit RBAC or progression.

## Canonical artifacts

| Kind | Location |
| ---- | -------- |
| Constitution | [`.specify/memory/constitution.md`](../.specify/memory/constitution.md) |
| MVP | [`specs/001-quest-deck/`](../specs/001-quest-deck/) |
| MCQ cards | [`specs/002-mcq-cards/`](../specs/002-mcq-cards/) |
| Learning path | [`specs/003-learning-path/`](../specs/003-learning-path/) |
| Memory tips (planned) | [`specs/004-memory-tips/`](../specs/004-memory-tips/) |
| Quality architecture | [quality-architecture.md](./quality-architecture.md) |
| OpenAPI starter | [openapi.yaml](./openapi.yaml) |
| Tests map | [`tests/README.md`](../tests/README.md) |
| Interview demo | [demo.md](./demo.md) |

## MVP deep links (builders)

- [Feature spec](../specs/001-quest-deck/spec.md)
- [Plan](../specs/001-quest-deck/plan.md)
- [Tasks](../specs/001-quest-deck/tasks.md)
- [API contract](../specs/001-quest-deck/contracts/rest-api.md)
- [Feature quickstart](../specs/001-quest-deck/quickstart.md)
