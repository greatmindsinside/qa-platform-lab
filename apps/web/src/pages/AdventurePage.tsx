/**
 * @fileoverview Immersive QA text adventure play screen.
 *
 * **What:** Scene prose, choice buttons, ending takeaways, restart with Undo.
 * **Why:** Sibling prep mode to deck practice — choice-driven, no parser.
 */

import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import type { AdventureSceneView, AdventureSummary, PublicUser } from '@lab/shared';
import { api } from '../lib/api';

const UNDO_MS = 8000;

type UndoSnapshot = {
  scene: AdventureSceneView;
  choiceIds: number[];
};

export type AdventurePageProps = {
  token: string;
  onUser: (u: PublicUser) => void;
};

export function AdventurePage({ token, onUser }: AdventurePageProps) {
  const [summary, setSummary] = useState<AdventureSummary | null>(null);
  const [scene, setScene] = useState<AdventureSceneView | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [undoSnapshot, setUndoSnapshot] = useState<UndoSnapshot | null>(null);
  const choicePathRef = useRef<number[]>([]);
  const undoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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
        choicePathRef.current = [];
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load adventure');
      }
    })();
  }, [token]);

  useEffect(() => {
    return () => {
      if (undoTimer.current) clearTimeout(undoTimer.current);
    };
  }, []);

  function clearUndo() {
    if (undoTimer.current) {
      clearTimeout(undoTimer.current);
      undoTimer.current = null;
    }
    setUndoSnapshot(null);
  }

  function armUndo(snapshot: UndoSnapshot) {
    if (undoTimer.current) clearTimeout(undoTimer.current);
    setUndoSnapshot(snapshot);
    undoTimer.current = setTimeout(() => {
      undoTimer.current = null;
      setUndoSnapshot(null);
    }, UNDO_MS);
  }

  async function refreshMe() {
    try {
      onUser(await api.me(token));
    } catch {
      /* Home will refresh on return */
    }
  }

  async function onChoose(choiceId: number) {
    if (!summary || busy) return;
    clearUndo();
    setBusy(true);
    setError('');
    try {
      const next = await api.adventureChoice(token, summary.id, choiceId);
      choicePathRef.current = [...choicePathRef.current, choiceId];
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
    const previous =
      scene && !scene.isEnding
        ? { scene, choiceIds: [...choicePathRef.current] }
        : null;
    setBusy(true);
    setError('');
    try {
      const next = await api.adventureRestart(token, summary.id);
      choicePathRef.current = [];
      setScene(next);
      if (previous) armUndo(previous);
      else clearUndo();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Restart failed');
    } finally {
      setBusy(false);
    }
  }

  async function onUndo() {
    if (!undoSnapshot || !summary || busy) return;
    const snapshot = undoSnapshot;
    clearUndo();
    setBusy(true);
    setError('');
    try {
      // Server is at start after restart; replay choices to restore progress.
      let next = await api.adventureRestart(token, summary.id);
      const path: number[] = [];
      for (const choiceId of snapshot.choiceIds) {
        next = await api.adventureChoice(token, summary.id, choiceId);
        path.push(choiceId);
      }
      choicePathRef.current = path;
      setScene(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Undo failed');
      setScene(snapshot.scene);
      choicePathRef.current = [...snapshot.choiceIds];
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="adventure-shell stack shell-page">
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <Link className="text-link" to="/">
          ← Home
        </Link>
        {summary && !scene?.isEnding ? (
          <button
            type="button"
            className="text-link"
            onClick={() => void onRestart()}
            disabled={busy}
          >
            Restart
          </button>
        ) : (
          <span />
        )}
      </div>

      {undoSnapshot ? (
        <p className="muted" role="status">
          Restarted.{' '}
          <button
            type="button"
            className="text-link"
            onClick={() => void onUndo()}
            disabled={busy}
          >
            Undo
          </button>
        </p>
      ) : null}

      {summary ? (
        <header className="adventure-header stack-sm">
          <h1 className="page-title">{summary.title}</h1>
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
        <article className="adventure-scene stack">
          <p className="adventure-prose">{scene.body}</p>

          {scene.isEnding ? (
            <div className="adventure-summary stack-sm">
              <h2 className="page-section-heading">What you practiced</h2>
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
              <div className="stack-sm">
                <button
                  type="button"
                  className="home-apple-cta"
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
