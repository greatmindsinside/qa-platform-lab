/**
 * @fileoverview Login screen for Quest Deck.
 *
 * **What:** Email/password form that calls the API and hands the session up.
 * **Why:** Isolated page so routing (`App`) stays thin and accessible labels
 * (Email / Password / Sign in) stay testable for Playwright `@auth`.
 */

import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import type { PublicUser } from '@lab/shared';
import { api } from '../lib/api';

export type LoginPageProps = {
  onLogin: (token: string, user: PublicUser) => void;
};

/**
 * Seed-friendly login UI (defaults to admin for local demo).
 */
export function LoginPage({ onLogin }: LoginPageProps) {
  const [email, setEmail] = useState('admin@lab.local');
  const [password, setPassword] = useState('Admin123!');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError('');
    // Prefer FormData so autofill / automation that skips React onChange still works.
    const fd = new FormData(e.currentTarget);
    const nextEmail = String(fd.get('email') ?? email).trim();
    const nextPassword = String(fd.get('password') ?? password);
    try {
      const res = await api.login(nextEmail, nextPassword);
      onLogin(res.token, res.user);
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="app-shell">
      <div className="login-panel panel stack">
        <p className="brand hero-brand">Quest Deck</p>
        <p className="muted">Interview prep with light RPG progression.</p>
        <form className="stack" onSubmit={submit}>
          <label>
            Email
            <input
              name="email"
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <label>
            Password
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          {error ? (
            <p className="error" role="alert">
              {error}
            </p>
          ) : null}
          <button type="submit" disabled={busy}>
            Sign in
          </button>
        </form>
      </div>
    </div>
  );
}
