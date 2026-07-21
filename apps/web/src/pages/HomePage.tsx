/**
 * @fileoverview Home — large title, quiet progress, one Practice action.
 *
 * **What:** Display name, XP progress, Practice the continue-learning deck.
 * **Why:** Apple HIG clarity/deference — content first; Decks live in the sidebar.
 */

import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Deck, PublicUser } from '@lab/shared';
import { api } from '../lib/api';
import { deckPrimaryCta, pickContinueLearningDeck } from '../lib/path-grouping';

export type HomePageProps = {
  token: string;
  user: PublicUser;
  onRefresh: (u: PublicUser) => void;
};

/**
 * Post-login hub: progress and one obvious next action.
 */
export function HomePage({ token, user, onRefresh }: HomePageProps) {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void (async () => {
      try {
        const [nextDecks, me] = await Promise.all([
          api.decks(token),
          api.me(token),
        ]);
        if (cancelled) return;
        setDecks(nextDecks);
        onRefresh(me);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Failed to load home');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token, onRefresh]);

  const recommended = useMemo(() => {
    return (
      pickContinueLearningDeck(decks) ??
      decks.find((d) => d.recommendedStart) ??
      decks.find((d) => d.stage != null) ??
      decks[0] ??
      null
    );
  }, [decks]);

  const practiceCta = recommended ? deckPrimaryCta(recommended) : null;

  return (
    <div className="stack shell-page home-apple">
      <header className="home-apple-hero">
        <h1 className="home-apple-title">{user.displayName}</h1>
        <p className="home-apple-meta muted">
          Level {user.level} · {user.totalXp} XP · Streak {user.currentStreak}
        </p>
        <div className="home-apple-progress">
          <div
            className="xp-bar home-apple-bar"
            role="progressbar"
            aria-valuenow={user.xpIntoLevel}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="XP toward next level"
          >
            <span style={{ width: `${user.xpIntoLevel}%` }} />
          </div>
          <p className="home-apple-xp-label muted">
            {user.xpIntoLevel} / 100 to next level
          </p>
        </div>
      </header>

      {error ? (
        <p className="error" role="alert">
          {error}
        </p>
      ) : null}
      {loading ? (
        <p className="muted" role="status">
          Loading…
        </p>
      ) : null}

      {!loading && recommended && practiceCta ? (
        <section className="home-apple-action" aria-label="Next practice">
          <Link className="home-apple-cta" to={practiceCta.to}>
            {practiceCta.label}
          </Link>
          <p className="home-apple-deck muted">{recommended.name}</p>
        </section>
      ) : null}

      {!loading && !recommended ? (
        <section className="home-apple-action" aria-label="Next step">
          <Link className="home-apple-cta" to="/decks">
            Decks
          </Link>
          <p className="home-apple-deck muted">No decks yet</p>
        </section>
      ) : null}
    </div>
  );
}
