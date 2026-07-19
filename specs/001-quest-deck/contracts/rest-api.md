# REST API Contract (MVP)

Base URL: `http://127.0.0.1:3333`  
Auth: `Authorization: Bearer <jwt>` where noted.

| Method | Path | Auth | Request | Success | Errors |
| ------ | ---- | ---- | ------- | ------- | ------ |
| GET | `/api/health` | no | — | `200 { ok: true }` | — |
| POST | `/api/auth/login` | no | `{ email, password }` | `200 { token, user }` | `401` |
| GET | `/api/me` | yes | — | `200` profile + `totalXp, level, title, currentStreak` | `401` |
| GET | `/api/decks` | yes | — | `200 Deck[]` (member of) | `401` |
| POST | `/api/decks` | yes | `{ name, description? }` | `201 Deck` (creator = admin member) | `401` |
| PATCH | `/api/decks/:id` | yes | `{ name?, description? }` | `200 Deck` | `401/403/404` |
| DELETE | `/api/decks/:id` | yes | — | `204` | `403` if not deck admin; `404` |
| POST | `/api/decks/:id/invites` | yes | `{ email, role }` | `200 DeckMember` | `403` if not admin; `404` user |
| GET | `/api/decks/:id/members` | yes | — | `200 DeckMember[]` | `404` if not member |
| GET | `/api/decks/:id/cards` | yes | — | `200 Card[]` | `404` |
| POST | `/api/decks/:id/cards` | yes | `{ prompt, answerHint?, tags? }` | `201 Card` | `403` |
| POST | `/api/cards/:id/practice` | yes | `{ confidence }` | `200 { xpAwarded, totalXp, level, title, currentStreak }` | `400/401/404` |

Shared types: `@lab/shared` (`Role`, `Confidence`, `Deck`, `Card`, `DeckMember`, `PublicUser`).
