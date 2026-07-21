/**
 * @fileoverview Deck detail — practice hub + contents + management rail.
 *
 * **What:** Deck name, mastery, card list, practice CTA, invite/delete for admins.
 * **Why:** Real prep/RBAC flows without dashboard garnish.
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

function MasteryRing({ percent }: { percent: number }) {
  const p = Math.max(0, Math.min(100, percent));
  const style = {
    background: `conic-gradient(var(--shell-mastery) ${p * 3.6}deg, rgba(255,255,255,0.08) 0)`,
  };
  return (
    <div
      className="mastery-ring"
      style={style}
      role="progressbar"
      aria-valuenow={p}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Deck mastery"
    >
      <div className="mastery-ring-inner">
        <strong>{p}%</strong>
        <span>MASTERY</span>
      </div>
    </div>
  );
}

/**
 * Deck hub: name + mastery, contents grid, practice + management rail.
 */
export function DeckDetailPage({
  token,
  user,
  onUser,
}: DeckDetailPageProps) {
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
  const [inviteOpen, setInviteOpen] = useState(false);
  const [cardQuery, setCardQuery] = useState('');
  const [loadState, setLoadState] = useState<'loading' | 'ready' | 'missing'>(
    'loading',
  );

  const reload = useCallback(async () => {
    setLoadState('loading');
    const decks = await api.decks(token);
    const found = decks.find((d) => d.id === deckId) ?? null;
    if (!found) {
      setDeck(null);
      setCards([]);
      setMembers([]);
      setLoadState('missing');
      return;
    }
    setDeck(found);
    setCards(await api.cards(token, deckId));
    setMembers(await api.members(token, deckId));
    onUser(await api.me(token));
    setLoadState('ready');
  }, [token, deckId, onUser]);

  useEffect(() => {
    void reload().catch((e: Error) => {
      setError(e.message);
      setLoadState('missing');
    });
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
    const name = deck?.name ?? 'this deck';
    const ok = window.confirm(
      `Delete “${name}”? This permanently removes the deck and its cards. This cannot be undone.`,
    );
    if (!ok) return;
    setError('');
    try {
      await api.deleteDeck(token, deckId);
      navigate('/');
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Could not delete the deck. Try again or refresh the page.',
      );
    }
  }

  if (loadState === 'loading' || !deck) {
    return (
      <div className="practice-loading stack">
        {loadState === 'missing' ? (
          <>
            <p className="error">{error || 'Deck not found'}</p>
            <Link to="/">← Home</Link>
          </>
        ) : (
          <p className="muted">Loading deck…</p>
        )}
      </div>
    );
  }

  const mastery = deck.masteryPercent ?? 0;
  const filtered = cards.filter((c) =>
    cardQuery.trim()
      ? c.prompt.toLowerCase().includes(cardQuery.trim().toLowerCase())
      : true,
  );
  const stageLabel = deck.stage
    ? deck.stage.charAt(0).toUpperCase() + deck.stage.slice(1)
    : 'Custom';

  return (
    <div className="deck-dashboard">
      <div className="deck-dashboard-main stack">
          <section className="active-quest panel">
            <div className="active-quest-body">
              <div className="active-quest-meta">
                <span className="muted">
                  {deck.recommendedStart
                    ? 'Start here'
                    : `${stageLabel} path`}
                </span>
              </div>
              <h1 className="active-quest-title">{deck.name}</h1>
              {deck.description ? (
                <p className="active-quest-desc">{deck.description}</p>
              ) : null}
            </div>
            <MasteryRing percent={mastery} />
          </section>

          <section className="deck-contents stack-sm">
            <div className="deck-contents-head row">
              <h2 className="section-title" style={{ margin: 0 }}>
                Cards (
                  {cardQuery.trim()
                    ? `${filtered.length} of ${cards.length}`
                    : cards.length}
                )
              </h2>
              <label className="deck-search">
                <span className="visually-hidden">Search cards</span>
                <input
                  type="search"
                  placeholder="Search…"
                  value={cardQuery}
                  onChange={(e) => setCardQuery(e.target.value)}
                  aria-label="Search cards"
                />
              </label>
            </div>

            {filtered.length === 0 ? (
              <p className="muted">
                {cards.length === 0
                  ? 'No cards. Add cards under Deck Management.'
                  : 'No cards match your search.'}
              </p>
            ) : (
              <ul className="quest-card-grid">
                {filtered.map((c) => (
                  <li key={c.id}>
                    <Link
                      to={`/practice/${c.id}`}
                      className={`quest-card quest-card-${c.kind}`}
                    >
                      <div className="quest-card-top">
                        <span className={`deck-badge deck-badge-${c.kind}`}>
                          {c.kind === 'mcq' ? 'MCQ' : 'OPEN'}
                        </span>
                      </div>
                      <strong className="quest-card-title">
                        {c.prompt.length > 72
                          ? `${c.prompt.slice(0, 72)}…`
                          : c.prompt}
                      </strong>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {error ? (
            <p className="error" role="alert">
              {error}
            </p>
          ) : null}
          {message ? <p className="muted">{message}</p> : null}
        </div>

        <aside className="deck-rail stack">
          {cards.length > 0 ? (
            <Link
              className="start-practice-cta"
              to={`/decks/${deckId}/play`}
            >
              <span className="start-practice-copy">
                <strong>Practice</strong>
                <small>Full deck session</small>
              </span>
            </Link>
          ) : (
            <p className="muted rail-card">Add cards to enable practice.</p>
          )}

          <div className="rail-card stack-sm">
            <h3 className="rail-heading">Deck Management</h3>
            {isDeckAdmin ? (
              <>
                <button
                  type="button"
                  className="rail-action"
                  aria-expanded={inviteOpen}
                  aria-controls="invite-panel"
                  onClick={() => setInviteOpen((v) => !v)}
                >
                  <span>Invite Collaborators</span>
                  <span aria-hidden>›</span>
                </button>
                {inviteOpen ? (
                  <form
                    id="invite-panel"
                    className="stack-sm invite-inline"
                    onSubmit={invite}
                  >
                    <label>
                      Email
                      <input
                        type="email"
                        required
                        autoComplete="email"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                      />
                    </label>
                    <label>
                      Role
                      <select
                        aria-label="Invite role"
                        value={inviteRole}
                        onChange={(e) =>
                          setInviteRole(e.target.value as Role)
                        }
                      >
                        <option value="member">member</option>
                        <option value="admin">admin</option>
                      </select>
                    </label>
                    <button type="submit">Send invite</button>
                  </form>
                ) : null}
                <button
                  type="button"
                  className="rail-action rail-action-danger"
                  onClick={() => void removeDeck()}
                >
                  <span>Delete Deck</span>
                  <span aria-hidden>›</span>
                </button>
                <details className="admin-details add-card-details">
                  <summary>Add card</summary>
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
                        required
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
                            onChange={(e) =>
                              setCorrectIndex(Number(e.target.value))
                            }
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
                </details>
              </>
            ) : (
              <p className="muted" style={{ margin: 0 }}>
                Member access — practice only.
              </p>
            )}
            <ul className="rail-members muted">
              {members.map((m) => (
                <li key={m.userId}>
                  {m.email} ({m.role})
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
  );
}
