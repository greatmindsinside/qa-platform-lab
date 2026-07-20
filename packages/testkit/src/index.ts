/**
 * @fileoverview Playwright-facing HTTP client for API / cross-layer tests.
 *
 * **What:** Tiny fetch wrapper with optional bearer token.
 * **Why:** Shared by fixtures without importing app internals; web must never
 * depend on this package (constitution smell ban).
 */

export type ApiClientOptions = {
  baseUrl: string;
  token?: string;
};

/**
 * Minimal REST client used by Playwright specs.
 */
export class ApiClient {
  constructor(private readonly options: ApiClientOptions) {}

  /** Return a client copy that sends Authorization. */
  withToken(token: string): ApiClient {
    return new ApiClient({ ...this.options, token });
  }

  async request<T>(
    method: string,
    path: string,
    body?: unknown,
  ): Promise<{ status: number; data: T }> {
    const headers: Record<string, string> = {};
    if (this.options.token) {
      headers.authorization = `Bearer ${this.options.token}`;
    }
    const init: RequestInit = { method, headers };
    if (body !== undefined) {
      headers['content-type'] = 'application/json';
      init.body = JSON.stringify(body);
    }
    const res = await fetch(`${this.options.baseUrl}${path}`, init);
    const text = await res.text();
    let data: T;
    if (!text) {
      data = null as T;
    } else {
      try {
        data = JSON.parse(text) as T;
      } catch {
        data = text as T;
      }
    }
    return { status: res.status, data };
  }

  login(email: string, password: string) {
    return this.request<{ token: string; user: unknown }>('POST', '/api/auth/login', {
      email,
      password,
    });
  }

  me() {
    return this.request('GET', '/api/me');
  }

  decks() {
    return this.request('GET', '/api/decks');
  }

  cards(deckId: number) {
    return this.request('GET', `/api/decks/${deckId}/cards`);
  }

  practice(cardId: number, confidence: string) {
    return this.request('POST', `/api/cards/${cardId}/practice`, { confidence });
  }

  practiceMcq(cardId: number, selectedIndex: number) {
    return this.request('POST', `/api/cards/${cardId}/practice`, {
      selectedIndex,
    });
  }

  createDeck(name: string, description = '') {
    return this.request('POST', '/api/decks', { name, description });
  }

  createCard(deckId: number, body: Record<string, unknown>) {
    return this.request('POST', `/api/decks/${deckId}/cards`, body);
  }

  invite(deckId: number, email: string, role: string) {
    return this.request('POST', `/api/decks/${deckId}/invites`, { email, role });
  }

  deleteDeck(deckId: number) {
    return this.request('DELETE', `/api/decks/${deckId}`);
  }
}
