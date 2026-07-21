/**
 * @fileoverview Decks catalog — learning path + custom decks.
 *
 * **What:** Beginner→Expert sections, Your decks, create deck.
 * **Why:** Separate from Home so nav “Decks” is a real destination.
 */

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import type { Deck, LearningStage } from '@lab/shared';
import { api } from '../lib/api';
import { groupDecksByPath, STAGE_LABELS } from '../lib/path-grouping';

export type DecksPageProps = {
  token: string;
};

function stageBadgeLabel(stage: LearningStage | null): string | null {
  if (!stage) return null;
  return STAGE_LABELS[stage];
}

/**
 * Full deck library for the Decks nav item.
 */
export function DecksPage({ token }: DecksPageProps) {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [deckName, setDeckName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void api
      .decks(token)
      .then((next) => {
        if (!cancelled) setDecks(next);
      })
      .catch((e: Error) => {
        if (!cancelled) setError(e.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

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

  return (
    <div className="stack shell-page">
      <header className="stack-sm">
        <h1 className="page-title">Decks</h1>
      </header>

      {error ? (
        <p className="error" role="alert">
          {error}
        </p>
      ) : null}
      {loading ? (
        <p className="muted" role="status">
          Loading decks…
        </p>
      ) : null}

      {!loading
        ? sections.map((section) => (
            <section key={section.key} className="stack path-section">
              <h2 className="section-title">{section.title}</h2>
              {section.key === 'yours' ? (
                <details className="panel admin-details create-deck-panel">
                  <summary>Create a new deck</summary>
                  <form className="row stack-sm" onSubmit={createDeck}>
                    <label style={{ flex: 1 }}>
                      Deck name
                      <input
                        value={deckName}
                        onChange={(e) => setDeckName(e.target.value)}
                        placeholder="New deck"
                        required
                        minLength={2}
                      />
                    </label>
                    <button type="submit">Create deck</button>
                  </form>
                </details>
              ) : null}
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
                            <span
                              className={`stage-badge stage-badge-${d.stage}`}
                            >
                              {stageBadgeLabel(d.stage)}
                            </span>
                          ) : null}
                        </div>
                        <strong className="deck-tile-name">{d.name}</strong>
                        <p className="muted deck-tile-meta">
                          Mastery {d.masteryPercent ?? 0}%
                          {d.description ? ` · ${d.description}` : ''}
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
                          Open
                        </Link>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : null}
            </section>
          ))
        : null}
    </div>
  );
}
