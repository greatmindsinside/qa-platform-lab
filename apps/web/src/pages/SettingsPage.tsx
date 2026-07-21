/**
 * @fileoverview Account settings — profile display name.
 */

import { useEffect, useState, type FormEvent } from 'react';
import type { PublicUser } from '@lab/shared';
import { api } from '../lib/api';

export type SettingsPageProps = {
  token: string;
  user: PublicUser;
  onUser: (u: PublicUser) => void;
  onSignOut: () => void;
};

export function SettingsPage({
  token,
  user,
  onUser,
  onSignOut,
}: SettingsPageProps) {
  const [displayName, setDisplayName] = useState(user.displayName);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setDisplayName(user.displayName);
  }, [user.displayName]);

  async function saveProfile(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const next = await api.updateProfile(token, displayName);
      onUser(next);
      setDisplayName(next.displayName);
      setMessage('Profile saved.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save profile');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="stack shell-page">
      <header className="stack-sm">
        <h1 className="page-title">Settings</h1>
      </header>

      <section className="panel stack">
        <h2 className="section-title" style={{ margin: 0 }}>
          Profile
        </h2>
        <form className="stack" onSubmit={saveProfile}>
          <label>
            Email
            <input type="email" value={user.email} readOnly disabled />
          </label>
          <label>
            Display name
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
              minLength={2}
              maxLength={40}
              autoComplete="nickname"
            />
          </label>
          <p className="muted" style={{ margin: 0 }}>
            Role: {user.role} · Level {user.level} · {user.title}
          </p>
          {error ? (
            <p className="error" role="alert">
              {error}
            </p>
          ) : null}
          {message ? (
            <p className="muted" role="status">
              {message}
            </p>
          ) : null}
          <button type="submit" disabled={busy}>
            {busy ? 'Saving…' : 'Save profile'}
          </button>
        </form>
      </section>

      <section className="panel stack">
        <h2 className="section-title" style={{ margin: 0 }}>
          Session
        </h2>
        <button type="button" className="secondary" onClick={onSignOut}>
          Sign out
        </button>
      </section>
    </div>
  );
}
