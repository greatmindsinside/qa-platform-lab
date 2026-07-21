/**
 * @fileoverview Home — quiet progress + one Practice action.
 *
 * **What:** Display name, XP bar, Practice the recommended deck.
 * **Why:** Apple-like clarity; Decks/Quests live in the sidebar.
 */

import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Deck, PublicUser } from '@lab/shared';
import { api } from '../lib/api';

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
    const startHere = decks.find((d) => d.recommendedStart);
    if (startHere) return startHere;
    const byMastery = [...decks]
      .filter((d) => d.stage != null)
      .sort(
        (a, b) =>
          (a.masteryPercent ?? 0) - (b.masteryPercent ?? 0) || a.id - b.id,
      );
    return byMastery[0] ?? decks[0] ?? null;
  }, [decks]);

  return (
    <div className="stack shell-page home-simple">
      <header className="home-simple-hero">
        <h1 className="home-simple-name">{user.displayName}</h1>
        <p className="home-simple-progress muted">
          Level {user.level} · {user.totalXp} XP · ★ {user.currentStreak}
        </p>
        <div
          className="xp-bar home-simple-bar"
          role="progressbar"
          aria-valuenow={user.xpIntoLevel}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="XP toward next level"
        >
          <span style={{ width: `${user.xpIntoLevel}%` }} />
        </div>
        <p className="home-simple-xp-label muted">
          {user.xpIntoLevel} / 100
        </p>
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

      {!loading && recommended ? (
        <div className="home-simple-action">
          <Link
            className="practice-deck-cta practice-deck-cta-lg home-simple-practice"
            to={`/decks/${recommended.id}/play`}
          >
            Practice
          </Link>
          <p className="home-simple-deck muted">{recommended.name}</p>
        </div>
      ) : null}

      {!loading && !recommended ? (
        <div className="home-simple-action">
          <Link className="practice-deck-cta practice-deck-cta-lg" to="/decks">
            Decks
          </Link>
        </div>
      ) : null}
    </div>
  );
}
