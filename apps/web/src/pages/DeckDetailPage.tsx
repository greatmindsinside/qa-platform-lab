/**
 * @fileoverview Deck detail: play hero + collapsible manage.
 *
 * **What:** Primary Practice entry; cards/members/admin tucked under Manage.
 * **Why:** Prep sessions should not compete with invite/delete on the same screen.
 */

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import type {
  Card,
  CardKind,
  Deck,
  DeckMember,
  PublicUser,
  Role,
} from '@lab/shared';
import { api } from '../lib/api';

export type DeckDetailPageProps = {
  token: string;
  user: PublicUser;
  onUser: (u: PublicUser) => void;
};

const EMPTY_OPTIONS: [string, string, string, string] = ['', '', '', ''];

/**
 * Deck play hero + optional manage panel for cards and collaboration.
 */
export function DeckDetailPage({ token, user, onUser }: DeckDetailPageProps) {
  const { id } = useParams();
  const deckId = Number(id);
  const navigate = useNavigate();
  const [deck, setDeck] = useState<Deck | null>(null);
  const [cards, setCards] = useState<Card[]>([]);
  const [members, setMembers] = useState<DeckMember[]>([]);
  const [inviteEmail, setInviteEmail] = useState('member@lab.local');
  const [inviteRole, setInviteRole] = useState<Role>('member');
  const [kind, setKind] = useState<CardKind>('open');
  const [prompt, setPrompt] = useState('');
  const [answerHint, setAnswerHint] = useState('');
  const [options, setOptions] =
    useState<[string, string, string, string]>(EMPTY_OPTIONS);
  const [correctIndex, setCorrectIndex] = useState(0);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const reload = useCallback(async () => {
    const decks = await api.decks(token);
    setDeck(decks.find((d) => d.id === deckId) ?? null);
    setCards(await api.cards(token, deckId));
    setMembers(await api.members(token, deckId));
    onUser(await api.me(token));
  }, [token, deckId, onUser]);

  useEffect(() => {
    void reload().catch((e: Error) => setError(e.message));
  }, [reload]);

  const isDeckAdmin =
    members.find((m) => m.userId === user.id)?.role === 'admin';

  async function invite(e: FormEvent) {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      await api.invite(token, deckId, inviteEmail, inviteRole);
      setMessage('Invite sent');
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invite failed');
    }
  }

  async function addCard(e: FormEvent) {
    e.preventDefault();
    setError('');
    try {
      if (kind === 'mcq') {
        await api.createCard(token, deckId, {
          kind: 'mcq',
          prompt,
          options,
          correctIndex,
        });
        setOptions(['', '', '', '']);
        setCorrectIndex(0);
      } else {
        await api.createCard(token, deckId, {
          kind: 'open',
          prompt,
          answerHint,
        });
        setAnswerHint('');
      }
      setPrompt('');
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Create card failed');
    }
  }

  async function removeDeck() {
    setError('');
    try {
      await api.deleteDeck(token, deckId);
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    }
  }

  if (!deck) {
    return (
      <div className="app-shell practice-loading">
        <p className="muted">Loading deck…</p>
        {error ? <p className="error">{error}</p> : null}
      </div>
    );
  }

  return (
    <div className="app-shell stack">
      <Link to="/">← Home</Link>
      <div className="panel stack deck-play-hero">
        <h1 className="brand">{deck.name}</h1>
        <p className="muted">{deck.description}</p>
        <div className="deck-mastery-row">
          <span>Mastery {deck.masteryPercent ?? 0}%</span>
          <div
            className="session-progress"
            role="progressbar"
            aria-valuenow={deck.masteryPercent ?? 0}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Deck mastery"
          >
            <span style={{ width: `${deck.masteryPercent ?? 0}%` }} />
          </div>
        </div>
        {cards.length > 0 ? (
          <>
            <p className="practice-guide">
              {cards.length} cards · flip or pick A–D · auto-advance after each answer
            </p>
            <Link className="practice-deck-cta practice-deck-cta-lg" to={`/decks/${deckId}/play`}>
              Practice deck
            </Link>
          </>
        ) : (
          <p className="muted">No cards yet — add some under Manage deck below.</p>
        )}
      </div>

      {error ? <p className="error">{error}</p> : null}
      {message ? <p className="muted">{message}</p> : null}

      <details className="panel admin-details">
        <summary>Manage deck</summary>
        <div className="stack">
          <div className="stack">
            <h2 className="section-title">Cards</h2>
            <p className="muted" style={{ margin: 0 }}>
              Open a single card for one-off review.
            </p>
            <ul className="deck-list">
              {cards.map((c) => (
                <li key={c.id}>
                  <Link to={`/practice/${c.id}`}>
                    <span className={`deck-badge deck-badge-${c.kind}`}>
                      {c.kind === 'mcq' ? 'MCQ' : 'Open'}
                    </span>
                    {c.prompt}
                  </Link>
                </li>
              ))}
            </ul>
            {isDeckAdmin ? (
              <form className="stack" onSubmit={addCard}>
                <label>
                  Kind
                  <select
                    aria-label="Card kind"
                    value={kind}
                    onChange={(e) => setKind(e.target.value as CardKind)}
                  >
                    <option value="open">open</option>
                    <option value="mcq">mcq</option>
                  </select>
                </label>
                <label>
                  Prompt
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    rows={2}
                  />
                </label>
                {kind === 'open' ? (
                  <label>
                    Answer hint
                    <textarea
                      value={answerHint}
                      onChange={(e) => setAnswerHint(e.target.value)}
                      rows={2}
                    />
                  </label>
                ) : (
                  <>
                    {(['A', 'B', 'C', 'D'] as const).map((label, index) => (
                      <label key={label}>
                        Option {label}
                        <input
                          value={options[index]}
                          onChange={(e) => {
                            const next = [...options] as [
                              string,
                              string,
                              string,
                              string,
                            ];
                            next[index] = e.target.value;
                            setOptions(next);
                          }}
                        />
                      </label>
                    ))}
                    <label>
                      Correct option
                      <select
                        aria-label="Correct option"
                        value={correctIndex}
                        onChange={(e) => setCorrectIndex(Number(e.target.value))}
                      >
                        <option value={0}>A</option>
                        <option value={1}>B</option>
                        <option value={2}>C</option>
                        <option value={3}>D</option>
                      </select>
                    </label>
                  </>
                )}
                <button type="submit">Add card</button>
              </form>
            ) : null}
          </div>

          <div className="stack">
            <h2 className="section-title">Members</h2>
            <ul>
              {members.map((m) => (
                <li key={m.userId}>
                  {m.email} ({m.role})
                </li>
              ))}
            </ul>
            {isDeckAdmin ? (
              <form className="row" onSubmit={invite}>
                <label style={{ flex: 1 }}>
                  Invite
                  <input
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                  />
                </label>
                <label>
                  Role
                  <select
                    aria-label="Invite role"
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as Role)}
                  >
                    <option value="member">member</option>
                    <option value="admin">admin</option>
                  </select>
                </label>
                <button type="submit" style={{ alignSelf: 'end' }}>
                  Invite
                </button>
              </form>
            ) : null}
          </div>

          {isDeckAdmin ? (
            <button type="button" className="danger" onClick={removeDeck}>
              Delete deck
            </button>
          ) : null}
        </div>
      </details>
    </div>
  );
}
