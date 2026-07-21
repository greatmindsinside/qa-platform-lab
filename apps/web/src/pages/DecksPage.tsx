/**
 * @fileoverview Decks dashboard — continue learning, filters, compact grid.
 */

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import type { Deck, LearningStage } from '@lab/shared';
import { api } from '../lib/api';
import {
  STAGE_LABELS,
  type DeckFilterTab,
  deckPrimaryCta,
  filterDecksByTab,
  pickContinueLearningDeck,
} from '../lib/path-grouping';

export type DecksPageProps = { token: string };

const FILTER_TABS: { id: DeckFilterTab; label: string }[] = [
  { id: 'all', label: 'All Decks' },
  { id: 'beginner', label: 'Beginner' },
  { id: 'intermediate', label: 'Intermediate' },
  { id: 'expert', label: 'Expert' },
  { id: 'yours', label: 'My Decks' },
];

function stageBadgeLabel(stage: LearningStage | null): string | null {
  if (!stage) return null;
  return STAGE_LABELS[stage];
}

function DeckCard({ deck }: { deck: Deck }) {
  const cta = deckPrimaryCta(deck);
  const mastery = deck.masteryPercent ?? 0;
  const badge = stageBadgeLabel(deck.stage);
  return (
    <li className="deck-card">
      <div className="deck-card-top">
        {badge ? (
          <span className={`stage-badge stage-badge-${deck.stage}`}>{badge}</span>
        ) : null}
        <Link className="deck-card-title" to={`/decks/${deck.id}`}>
          {deck.name}
        </Link>
        {deck.description ? (
          <p className="muted deck-card-desc">{deck.description}</p>
        ) : null}
      </div>
      <div className="deck-card-progress">
        <div
          className="mastery-bar"
          role="progressbar"
          aria-valuenow={mastery}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${mastery}% mastery`}
        >
          <span className="mastery-bar-fill" style={{ width: `${mastery}%` }} />
        </div>
        <p className="muted deck-card-meta">
          {deck.completedCount} / {deck.cardCount} practiced
        </p>
      </div>
      <Link className="practice-deck-cta" to={cta.to}>
        {cta.label}
      </Link>
    </li>
  );
}

/**
 * Full deck library for the Decks nav item.
 */
export function DecksPage({ token }: DecksPageProps) {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [deckName, setDeckName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<DeckFilterTab>('all');
  const [createOpen, setCreateOpen] = useState(false);

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

  const continueDeck = useMemo(
    () => pickContinueLearningDeck(decks),
    [decks],
  );
  const continueCta = continueDeck ? deckPrimaryCta(continueDeck) : null;
  const pathDecks = useMemo(
    () => filterDecksByTab(decks, filter === 'yours' ? 'all' : filter),
    [decks, filter],
  );
  const yourDecks = useMemo(
    () => filterDecksByTab(decks, 'yours'),
    [decks],
  );
  const showPathGrid = filter !== 'yours';

  async function createDeck(e: FormEvent) {
    e.preventDefault();
    setError('');
    try {
      await api.createDeck(token, deckName);
      setDeckName('');
      setCreateOpen(false);
      setDecks(await api.decks(token));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Create failed');
    }
  }

  const createForm = (
    <form className="row stack-sm create-deck-form" onSubmit={createDeck}>
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
      <button type="button" className="text-link" onClick={() => setCreateOpen(false)}>
        Cancel
      </button>
    </form>
  );

  return (
    <div className="stack shell-page decks-dashboard">
      <header className="decks-page-header">
        <h1 className="page-title">Decks</h1>
        <button
          type="button"
          className="create-deck-header-btn"
          onClick={() => setCreateOpen(true)}
        >
          + Create Deck
        </button>
      </header>

      {createOpen ? <div className="panel create-deck-panel">{createForm}</div> : null}

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

      {!loading && continueDeck && continueCta ? (
        <section className="continue-learning" aria-labelledby="continue-heading">
          <h2 id="continue-heading" className="decks-section-heading continue-label">
            Continue Learning
          </h2>
          <div className="continue-card">
            <div className="continue-card-main">
              <div className="deck-tile-badges">
                {stageBadgeLabel(continueDeck.stage) ? (
                  <span className={`stage-badge stage-badge-${continueDeck.stage}`}>
                    {stageBadgeLabel(continueDeck.stage)}
                  </span>
                ) : null}
              </div>
              <Link className="deck-card-title" to={`/decks/${continueDeck.id}`}>
                {continueDeck.name}
              </Link>
              <div className="deck-card-progress">
                <div
                  className="mastery-bar"
                  role="progressbar"
                  aria-valuenow={continueDeck.masteryPercent ?? 0}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`${continueDeck.masteryPercent ?? 0}% mastery`}
                >
                  <span
                    className="mastery-bar-fill"
                    style={{ width: `${continueDeck.masteryPercent ?? 0}%` }}
                  />
                </div>
                <p className="muted deck-card-meta">
                  {continueDeck.completedCount} / {continueDeck.cardCount}{' '}
                  practiced
                </p>
              </div>
            </div>
            <Link className="practice-deck-cta" to={continueCta.to}>
              {continueCta.label}
            </Link>
          </div>
        </section>
      ) : null}

      {!loading ? (
        <>
          <div
            className="deck-filter-tabs"
            role="toolbar"
            aria-label="Filter decks"
          >
            {FILTER_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                aria-pressed={filter === tab.id}
                className={
                  filter === tab.id ? 'deck-filter-tab is-active' : 'deck-filter-tab'
                }
                onClick={() => setFilter(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {showPathGrid ? (
            <section className="stack" aria-label="Curriculum decks">
              {pathDecks.length === 0 ? (
                <p className="muted">No decks in this stage</p>
              ) : (
                <ul className="deck-card-grid">
                  {pathDecks.map((d) => (
                    <DeckCard key={d.id} deck={d} />
                  ))}
                </ul>
              )}
            </section>
          ) : null}

          <section className="stack your-decks-section" aria-labelledby="your-decks-heading">
            <h2 id="your-decks-heading" className="decks-section-heading">
              Your Decks
            </h2>
            <ul className="deck-card-grid">
              <li className="deck-card deck-card-create">
                <button
                  type="button"
                  className="deck-create-tile"
                  onClick={() => setCreateOpen(true)}
                >
                  + Create a Deck
                </button>
              </li>
              {yourDecks.map((d) => (
                <DeckCard key={d.id} deck={d} />
              ))}
            </ul>
          </section>
        </>
      ) : null}
    </div>
  );
}
