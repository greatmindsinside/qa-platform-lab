/**
 * @fileoverview Support hub — FAQ + contact ticket (demo accept).
 */

import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';

export type SupportPageProps = {
  token: string;
};

const FAQ = [
  {
    q: 'How do I earn XP?',
    a: 'Practice open cards (rate Learning / Solid / Mastered), answer MCQs, and complete the Quests story for a first-time completion bonus.',
  },
  {
    q: 'What is the difference between Home and Decks?',
    a: 'Home shows your next recommended practice and quest. Decks lists the full Beginner → Expert path plus any decks you create.',
  },
  {
    q: 'Can I invite a study partner?',
    a: 'Open a deck you admin, use Invite Collaborators, and enter their lab email (for example member@lab.local).',
  },
  {
    q: 'Why did Restart ask me to confirm?',
    a: 'Restarting a quest mid-run clears your current path. Confirm so you do not lose progress by accident.',
  },
] as const;

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
        <p className="muted" style={{ margin: 0 }}>
          Quick answers for the Quest Deck lab, plus a contact form for the demo.
        </p>
      </header>

      <section className="stack path-section">
        <h2 className="section-title">FAQ</h2>
        <div className="stack">
          {FAQ.map((item) => (
            <details key={item.q} className="panel admin-details">
              <summary>{item.q}</summary>
              <p className="muted" style={{ margin: '0.65rem 0 0' }}>
                {item.a}
              </p>
            </details>
          ))}
        </div>
      </section>

      <section className="panel stack">
        <h2 className="section-title" style={{ margin: 0 }}>
          Contact
        </h2>
        <p className="muted" style={{ margin: 0 }}>
          This lab accepts tickets locally (no email is sent). Use it to practice
          forms and recovery flows.
        </p>
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
              Ticket received ({ticketId}). Thanks — keep practicing on{' '}
              <Link to="/">Home</Link>.
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
