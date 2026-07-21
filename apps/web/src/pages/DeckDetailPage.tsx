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
import { deckPrimaryCta } from '../lib/path-grouping';

export type DeckDetailPageProps = {
  token: string;
  user: PublicUser;
  onUser: (u: PublicUser) => void;
};

const EMPTY_OPTIONS: [string, string, string, string] = ['', '', '', ''];

/**
 * Deck hub: name + mastery, contents list, practice + management.
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
  const playCta = deckPrimaryCta(deck);

  return (
    <div className="deck-dashboard shell-page">
      <div className="deck-dashboard-main stack">
          <header className="deck-detail-hero stack-sm">
            <p className="muted deck-detail-stage">{stageLabel}</p>
            <h1 className="page-title deck-detail-title">{deck.name}</h1>
            {deck.description ? (
              <p className="muted deck-detail-desc">{deck.description}</p>
            ) : null}
            <div className="deck-card-progress">
              <div
                className="mastery-bar"
                role="progressbar"
                aria-valuenow={mastery}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Deck mastery"
              >
                <span
                  className="mastery-bar-fill"
                  style={{ width: `${mastery}%` }}
                />
              </div>
              <p className="muted deck-card-meta">
                {cards.length} cards · {deck.completedCount} / {deck.cardCount}{' '}
                practiced
              </p>
            </div>
          </header>

          <section className="deck-contents stack-sm">
            <div className="deck-contents-head row">
              <h2 className="page-section-heading">
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
              <ul className="deck-card-list">
                {filtered.map((c) => (
                  <li key={c.id} className="deck-card-list-item">
                    <Link to={`/practice/${c.id}`} className="deck-card-list-link">
                      <span className="muted deck-card-list-kind">
                        {c.confidence
                          ? c.confidence
                          : c.kind === 'mcq'
                            ? 'Choice'
                            : 'Open'}
                      </span>
                      <strong className="deck-card-list-title">
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
            <Link className="home-apple-cta deck-rail-cta" to={playCta.to}>
              {playCta.label}
            </Link>
          ) : (
            <p className="muted">Add cards to enable practice.</p>
          )}

          <div className="stack-sm deck-rail-block">
            <h3 className="page-section-heading">Deck management</h3>
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
                        <option value="open">Open</option>
                        <option value="mcq">Choice</option>
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
