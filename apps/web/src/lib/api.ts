/**
 * @fileoverview Browser HTTP client for Quest Deck (web only).
 *
 * **What:** Thin fetch wrappers matching `contracts/rest-api.md`.
 * **Why:** Isolates transport from UI; must not import `@lab/testkit`
 * (constitution smell ban). No XP/RBAC math here — server is source of truth.
 */

import type {
  AdventureSceneView,
  AdventureSummary,
  Card,
  Deck,
  DeckMember,
  LeaderboardEntry,
  PracticeResult,
  PublicUser,
} from '@lab/shared';

/** Empty in Vite proxy mode; Playwright sets absolute API origin. */
const API_BASE = import.meta.env.VITE_API_URL ?? '';

/** Transport error with HTTP status for callers (e.g. auth 401 handling). */
export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

/**
 * Build auth headers; omit Content-Type on body-less methods (e.g. DELETE)
 * so Fastify does not reject empty JSON bodies.
 */
function authHeaders(token: string | null, withJson = true): HeadersInit {
  const headers: Record<string, string> = {};
  if (withJson) headers['content-type'] = 'application/json';
  if (token) headers.authorization = `Bearer ${token}`;
  return headers;
}

async function parse<T>(res: Response): Promise<T> {
  if (res.status === 204) return undefined as T;

  const text = await res.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text) as unknown;
    } catch {
      data = null;
    }
  }

  if (!res.ok) {
    const message =
      typeof data === 'object' &&
      data !== null &&
      'error' in data &&
      typeof (data as { error: unknown }).error === 'string'
        ? (data as { error: string }).error
        : `Request failed (${res.status})`;
    throw new ApiError(message, res.status);
  }

  return data as T;
}

/** Named API operations used by pages/hooks. */
export const api = {
  async login(email: string, password: string) {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: authHeaders(null),
      body: JSON.stringify({ email, password }),
    });
    return parse<{ token: string; user: PublicUser }>(res);
  },
  async me(token: string) {
    const res = await fetch(`${API_BASE}/api/me`, {
      headers: authHeaders(token),
    });
    return parse<PublicUser>(res);
  },
  async updateProfile(token: string, displayName: string) {
    const res = await fetch(`${API_BASE}/api/me`, {
      method: 'PATCH',
      headers: authHeaders(token),
      body: JSON.stringify({ displayName }),
    });
    return parse<PublicUser>(res);
  },
  async leaderboard(token: string) {
    const res = await fetch(`${API_BASE}/api/leaderboard`, {
      headers: authHeaders(token),
    });
    return parse<LeaderboardEntry[]>(res);
  },
  async submitSupport(token: string, subject: string, message: string) {
    const res = await fetch(`${API_BASE}/api/support`, {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify({ subject, message }),
    });
    return parse<{ ok: true; ticketId: string }>(res);
  },
  async decks(token: string) {
    const res = await fetch(`${API_BASE}/api/decks`, {
      headers: authHeaders(token),
    });
    return parse<Deck[]>(res);
  },
  async cards(token: string, deckId: number) {
    const res = await fetch(`${API_BASE}/api/decks/${deckId}/cards`, {
      headers: authHeaders(token),
    });
    return parse<Card[]>(res);
  },
  async practice(token: string, cardId: number, confidence: string) {
    const res = await fetch(`${API_BASE}/api/cards/${cardId}/practice`, {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify({ confidence }),
    });
    return parse<PracticeResult>(res);
  },
  async practiceMcq(token: string, cardId: number, selectedIndex: number) {
    const res = await fetch(`${API_BASE}/api/cards/${cardId}/practice`, {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify({ selectedIndex }),
    });
    return parse<PracticeResult>(res);
  },
  async createDeck(token: string, name: string, description = '') {
    const res = await fetch(`${API_BASE}/api/decks`, {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify({ name, description }),
    });
    return parse<Deck>(res);
  },
  async createCard(
    token: string,
    deckId: number,
    input: {
      kind?: 'open' | 'mcq';
      prompt: string;
      answerHint?: string;
      options?: [string, string, string, string];
      correctIndex?: number;
      tags?: string[];
    },
  ) {
    const res = await fetch(`${API_BASE}/api/decks/${deckId}/cards`, {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify(input),
    });
    return parse<Card>(res);
  },
  async invite(token: string, deckId: number, email: string, role: string) {
    const res = await fetch(`${API_BASE}/api/decks/${deckId}/invites`, {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify({ email, role }),
    });
    return parse<DeckMember>(res);
  },
  async members(token: string, deckId: number) {
    const res = await fetch(`${API_BASE}/api/decks/${deckId}/members`, {
      headers: authHeaders(token),
    });
    return parse<DeckMember[]>(res);
  },
  async deleteDeck(token: string, deckId: number) {
    const res = await fetch(`${API_BASE}/api/decks/${deckId}`, {
      method: 'DELETE',
      headers: authHeaders(token, false),
    });
    return parse<void>(res);
  },
  async adventures(token: string) {
    const res = await fetch(`${API_BASE}/api/adventures`, {
      headers: authHeaders(token),
    });
    return parse<AdventureSummary[]>(res);
  },
  async adventureScene(token: string, adventureId: number) {
    const res = await fetch(`${API_BASE}/api/adventures/${adventureId}/scene`, {
      headers: authHeaders(token),
    });
    return parse<AdventureSceneView>(res);
  },
  async adventureChoice(
    token: string,
    adventureId: number,
    choiceId: number,
  ) {
    const res = await fetch(
      `${API_BASE}/api/adventures/${adventureId}/choices`,
      {
        method: 'POST',
        headers: authHeaders(token),
        body: JSON.stringify({ choiceId }),
      },
    );
    return parse<AdventureSceneView>(res);
  },
  async adventureRestart(token: string, adventureId: number) {
    const res = await fetch(
      `${API_BASE}/api/adventures/${adventureId}/restart`,
      {
        method: 'POST',
        headers: authHeaders(token),
      },
    );
    return parse<AdventureSceneView>(res);
  },
};
