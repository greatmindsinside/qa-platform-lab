/**
 * @fileoverview XP leaderboard for the Quest Deck lab.
 */

import { useEffect, useState } from 'react';
import type { LeaderboardEntry, PublicUser } from '@lab/shared';
import { api } from '../lib/api';

export type LeaderboardPageProps = {
  token: string;
  user: PublicUser;
};

export function LeaderboardPage({ token, user }: LeaderboardPageProps) {
  const [rows, setRows] = useState<LeaderboardEntry[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void api
      .leaderboard(token)
      .then((next) => {
        if (!cancelled) setRows(next);
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

  return (
    <div className="stack shell-page">
      <header className="stack-sm">
        <h1 className="page-title">Leaderboard</h1>
      </header>

      {error ? (
        <p className="error" role="alert">
          {error}
        </p>
      ) : null}
      {loading ? (
        <p className="muted" role="status">
          Loading leaderboard…
        </p>
      ) : null}

      {!loading && rows.length === 0 ? (
        <p className="muted">No learners yet.</p>
      ) : null}

      {!loading && rows.length > 0 ? (
        <div className="panel" style={{ padding: 0, overflow: 'auto' }}>
          <table className="leaderboard-table">
            <caption className="visually-hidden">
              Learners ranked by total experience points
            </caption>
            <thead>
              <tr>
                <th scope="col">Rank</th>
                <th scope="col">Learner</th>
                <th scope="col">Title</th>
                <th scope="col">Level</th>
                <th scope="col">XP</th>
                <th scope="col">Streak</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const isYou = row.userId === user.id;
                return (
                  <tr
                    key={row.userId}
                    className={isYou ? 'leaderboard-you' : undefined}
                  >
                    <td>{row.rank}</td>
                    <td>
                      {row.displayName}
                      {isYou ? (
                        <span className="leaderboard-you-tag"> You</span>
                      ) : null}
                    </td>
                    <td>{row.title}</td>
                    <td>{row.level}</td>
                    <td>{row.totalXp}</td>
                    <td>{row.currentStreak}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
