/**
 * @fileoverview Home / progression dashboard with learning-path sections.
 *
 * **What:** XP summary + Beginner→Expert curriculum tiles + Your decks.
 * **Why:** Soft path guidance — Start here, stage labels, no unlock gates.
 */

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import type { Deck, LearningStage, PublicUser } from '@lab/shared';
import { api } from '../lib/api';
import { groupDecksByPath, STAGE_LABELS } from '../lib/path-grouping';

export type HomePageProps = {
  token: string;
  user: PublicUser;
  onRefresh: (u: PublicUser) => void;
  onSignOut: () => void;
};

function stageBadgeLabel(stage: LearningStage | null): string | null {
  if (!stage) return null;
  return STAGE_LABELS[stage];
}

/**
 * Post-login home: RPG-lite summary + staged curriculum + create deck.
 */
export function HomePage({
  token,
  user,
  onRefresh,
  onSignOut,
}: HomePageProps) {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [deckName, setDeckName] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    void api.decks(token).then(setDecks).catch((e: Error) => setError(e.message));
    void api
      .me(token)
      .then(onRefresh)
      .catch((e: Error) => setError(e.message));
  }, [token, onRefresh]);

  const sections = useMemo(() => groupDecksByPath(decks), [decks]);

  async function createDeck(e: FormEvent) {
    e.preventDefault();
    setError('');
    try {
      await api.createDeck(token, deckName);
      setDeckName('');
      setDecks(await api.decks(token));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Create failed');
    }
  }

  const createDeckPanel = (
    <details className="panel admin-details create-deck-panel">
      <summary>Create a new deck</summary>
      <form className="row stack-sm" onSubmit={createDeck}>
        <label style={{ flex: 1 }}>
          Deck name
          <input
            value={deckName}
            onChange={(e) => setDeckName(e.target.value)}
            placeholder="New deck"
          />
        </label>
        <button type="submit">Create deck</button>
      </form>
      <p className="muted" style={{ margin: '0.5rem 0 0' }}>
        Custom decks appear under Your decks (not part of the curriculum path).
      </p>
    </details>
  );

  return (
    <div className="app-shell stack">
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <div>
          <p className="brand hero-brand">Quest Deck</p>
          <p className="muted">
            {user.displayName} · {user.title} · Level {user.level}
          </p>
        </div>
        <button type="button" className="secondary" onClick={onSignOut}>
          Sign out
        </button>
      </div>

      <div className="panel stack">
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <strong>
            {user.totalXp} XP · Streak {user.currentStreak}
          </strong>
          <span className="muted">
            {user.xpIntoLevel} / 100 to next level
          </span>
        </div>
        <div
          className="xp-bar"
          role="progressbar"
          aria-valuenow={user.xpIntoLevel}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="XP toward next level"
        >
          <span style={{ width: `${user.xpIntoLevel}%` }} />
        </div>
      </div>

      <p className="practice-guide">
        Follow the path Beginner → Intermediate → Expert. Soft guidance only —
        every stage stays open.
      </p>
      {error ? <p className="error">{error}</p> : null}

      {sections.map((section) => (
        <section key={section.key} className="stack path-section">
          <h2 className="section-title">{section.title}</h2>
          {section.key === 'beginner' ? (
            <p className="muted path-section-hint" style={{ margin: 0 }}>
              Recommended first stop for foundations, then move up when ready.
            </p>
          ) : null}
          {section.key === 'yours' ? createDeckPanel : null}
          {section.decks.length === 0 && section.key === 'yours' ? (
            <p className="muted">No custom decks yet — create one above.</p>
          ) : section.decks.length > 0 ? (
            <ul className="deck-list deck-tiles">
              {section.decks.map((d) => (
                <li key={d.id} className="deck-tile">
                  <div className="deck-tile-main">
                    <div className="deck-tile-badges">
                      {d.recommendedStart ? (
                        <span className="start-here-badge">Start here</span>
                      ) : null}
                      {stageBadgeLabel(d.stage) ? (
                        <span className={`stage-badge stage-badge-${d.stage}`}>
                          {stageBadgeLabel(d.stage)}
                        </span>
                      ) : null}
                    </div>
                    <strong className="deck-tile-name">{d.name}</strong>
                    <p className="muted deck-tile-meta">
                      Mastery {d.masteryPercent ?? 0}% · {d.description}
                    </p>
                  </div>
                  <div className="deck-tile-actions">
                    <Link
                      className="practice-deck-cta"
                      to={`/decks/${d.id}/play`}
                    >
                      Practice
                    </Link>
                    <Link className="text-link" to={`/decks/${d.id}`}>
                      Manage
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          ) : null}
        </section>
      ))}
    </div>
  );
}
