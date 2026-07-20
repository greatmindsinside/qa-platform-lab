/**
 * @fileoverview Session auth hook for Quest Deck web.
 *
 * **What:** Persists JWT in `localStorage` and loads `/api/me` into React state.
 * **Why:** Keeps auth out of page components (SRP) so screens stay presentational
 * and never re-implement token storage.
 */

import { useEffect, useState } from 'react';
import type { PublicUser } from '@lab/shared';
import { ApiError, api } from '../lib/api';

/** localStorage key for the bearer token (demo-only; not HttpOnly). */
const TOKEN_KEY = 'quest-deck-token';

export type AuthStatus = 'loading' | 'authenticated' | 'anonymous';

/**
 * Auth session for the SPA: token + public user profile helpers.
 */
export function useAuth() {
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem(TOKEN_KEY),
  );
  const [user, setUser] = useState<PublicUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>(() =>
    localStorage.getItem(TOKEN_KEY) ? 'loading' : 'anonymous',
  );

  useEffect(() => {
    if (!token) {
      setUser(null);
      setStatus('anonymous');
      return;
    }

    let cancelled = false;
    setStatus((prev) => (prev === 'authenticated' ? 'authenticated' : 'loading'));

    void api
      .me(token)
      .then((next) => {
        if (cancelled) return;
        setUser(next);
        setStatus('authenticated');
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        // Only wipe the session on unauthorized — keep token on network blips.
        if (err instanceof ApiError && err.status === 401) {
          localStorage.removeItem(TOKEN_KEY);
          setToken(null);
          setUser(null);
          setStatus('anonymous');
          return;
        }
        setStatus((prev) => (prev === 'authenticated' ? 'authenticated' : 'anonymous'));
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  function signIn(next: string, nextUser: PublicUser) {
    localStorage.setItem(TOKEN_KEY, next);
    setToken(next);
    setUser(nextUser);
    setStatus('authenticated');
  }

  function signOut() {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
    setStatus('anonymous');
  }

  return { token, user, status, setUser, signIn, signOut };
}
