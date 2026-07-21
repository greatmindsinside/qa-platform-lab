/**
 * @fileoverview Immersive QA text adventure play screen.
 *
 * **What:** Scene prose, choice buttons, ending takeaways, restart.
 * **Why:** Sibling prep mode to deck practice — choice-driven, no parser.
 */

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { AdventureSceneView, AdventureSummary, PublicUser } from '@lab/shared';
import { api } from '../lib/api';

export type AdventurePageProps = {
  token: string;
  onUser: (u: PublicUser) => void;
};

export function AdventurePage({ token, onUser }: AdventurePageProps) {
  const [summary, setSummary] = useState<AdventureSummary | null>(null);
  const [scene, setScene] = useState<AdventureSceneView | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const list = await api.adventures(token);
        const first = list[0];
        if (!first) {
          setError('No adventures available yet.');
          return;
        }
        setSummary(first);
        setScene(await api.adventureScene(token, first.id));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load adventure');
      }
    })();
  }, [token]);

  async function refreshMe() {
    try {
      onUser(await api.me(token));
    } catch {
      /* Home will refresh on return */
    }
  }

  async function onChoose(choiceId: number) {
    if (!summary || busy) return;
    setBusy(true);
    setError('');
    try {
      const next = await api.adventureChoice(token, summary.id, choiceId);
      setScene(next);
      if (next.isEnding) await refreshMe();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Choice failed');
    } finally {
      setBusy(false);
    }
  }

  async function onRestart() {
    if (!summary || busy) return;
    if (scene && !scene.isEnding) {
      const ok = window.confirm(
        'Restart this quest from the beginning? Your current progress will be cleared.',
      );
      if (!ok) return;
    }
    setBusy(true);
    setError('');
    try {
      setScene(await api.adventureRestart(token, summary.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Restart failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="adventure-shell stack shell-page">
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <p className="muted" style={{ margin: 0 }}>
          QA judgment quest
        </p>
        {summary ? (
          <button
            type="button"
            className="secondary"
            onClick={() => void onRestart()}
            disabled={busy}
          >
            Restart
          </button>
        ) : null}
      </div>

      {summary ? (
        <header className="adventure-header stack-sm">
          <p className="brand adventure-brand">{summary.title}</p>
          <p className="muted" style={{ margin: 0 }}>
            {summary.blurb}
          </p>
        </header>
      ) : null}

      {error ? (
        <p className="error" role="alert">
          {error}
        </p>
      ) : null}

      {scene ? (
        <article className="adventure-scene panel stack">
          <p className="adventure-prose">{scene.body}</p>

          {scene.isEnding ? (
            <div className="adventure-summary stack-sm">
              <h2 className="section-title">What you practiced</h2>
              <ul className="adventure-takeaways">
                {(scene.takeaways ?? []).map((t) => (
                  <li key={t.id}>{t.label}</li>
                ))}
              </ul>
              {scene.xpAwarded !== undefined ? (
                <p className="muted">
                  XP this run: {scene.xpAwarded}
                  {scene.totalXp !== undefined
                    ? ` · Total ${scene.totalXp}`
                    : ''}
                </p>
              ) : null}
              <div className="row" style={{ flexWrap: 'wrap' }}>
                <Link className="practice-deck-cta" to="/">
                  Back to Home
                </Link>
                <button
                  type="button"
                  className="secondary"
                  onClick={() => void onRestart()}
                  disabled={busy}
                >
                  Play again
                </button>
              </div>
            </div>
          ) : (
            <div className="adventure-choices stack-sm" role="group" aria-label="Choices">
              {scene.choices.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className="adventure-choice"
                  disabled={busy}
                  onClick={() => void onChoose(c.id)}
                >
                  {c.label}
                </button>
              ))}
            </div>
          )}
        </article>
      ) : !error ? (
        <p className="muted">Loading adventure…</p>
      ) : null}
    </div>
  );
}
