/**
 * @fileoverview Support — contact ticket (demo accept).
 */

import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';

export type SupportPageProps = {
  token: string;
};

export function SupportPage({ token }: SupportPageProps) {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [ticketId, setTicketId] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    setTicketId('');
    try {
      const res = await api.submitSupport(token, subject, message);
      setTicketId(res.ticketId);
      setSubject('');
      setMessage('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send message');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="stack shell-page">
      <header className="stack-sm">
        <h1 className="page-title">Support</h1>
      </header>

      <section className="panel stack">
        <h2 className="section-title" style={{ margin: 0 }}>
          Contact
        </h2>
        <form className="stack" onSubmit={submit}>
          <label>
            Subject
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
              minLength={3}
              maxLength={120}
            />
          </label>
          <label>
            Message
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
              minLength={10}
              maxLength={2000}
              rows={5}
            />
          </label>
          {error ? (
            <p className="error" role="alert">
              {error}
            </p>
          ) : null}
          {ticketId ? (
            <p className="muted" role="status">
              Ticket received ({ticketId}).{' '}
              <Link to="/">Home</Link>
            </p>
          ) : null}
          <button type="submit" disabled={busy}>
            {busy ? 'Sending…' : 'Send message'}
          </button>
        </form>
      </section>
    </div>
  );
}
