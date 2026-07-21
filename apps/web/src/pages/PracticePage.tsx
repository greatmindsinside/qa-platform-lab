/**
 * @fileoverview Practice loop for open (confidence) and MCQ (A–D) cards.
 *
 * **What:** Open cards use a 3D flip flashcard; MCQ stays option-select.
 * **Why:** XP/grading stay on the server — UI only collects the attempt.
 */

import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import type { Card, PublicUser } from '@lab/shared';
import { FlipCard } from '../components/FlipCard';
import { api } from '../lib/api';

const OPTION_LABELS = ['A', 'B', 'C', 'D'] as const;

export type PracticePageProps = {
  token: string;
  onUser: (u: PublicUser) => void;
};

/**
 * Practice one card — open flip + confidence, or MCQ option select.
 */
export function PracticePage({ token, onUser }: PracticePageProps) {
  const { id } = useParams();
  const cardId = Number(id);
  const [card, setCard] = useState<Card | null>(null);
  const [flipped, setFlipped] = useState(false);
  const [result, setResult] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const decks = await api.decks(token);
        const cardLists = await Promise.all(
          decks.map((d) => api.cards(token, d.id)),
        );
        for (const cards of cardLists) {
          const found = cards.find((c) => c.id === cardId);
          if (found) {
            setCard(found);
            setFlipped(false);
            return;
          }
        }
        setError('Card not found');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load card');
      }
    })();
  }, [token, cardId]);

  async function rate(confidence: string) {
    if (!flipped) return;
    setError('');
    setBusy(true);
    try {
      const res = await api.practice(token, cardId, confidence);
      setResult(
        `+${res.xpAwarded} XP · total ${res.totalXp} · streak ${res.currentStreak}`,
      );
      onUser(await api.me(token));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Practice failed');
    } finally {
      setBusy(false);
    }
  }

  async function selectOption(selectedIndex: number) {
    setError('');
    setBusy(true);
    try {
      const res = await api.practiceMcq(token, cardId, selectedIndex);
      const verdict = res.correct ? 'Correct' : 'Incorrect';
      const key =
        res.correctIndex !== undefined
          ? ` · answer ${OPTION_LABELS[res.correctIndex] ?? res.correctIndex}`
          : '';
      setResult(
        `${verdict}${key} · +${res.xpAwarded} XP · total ${res.totalXp} · streak ${res.currentStreak}`,
      );
      onUser(await api.me(token));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Practice failed');
    } finally {
      setBusy(false);
    }
  }

  if (!card) {
    return (
      <div className="practice-loading shell-page stack">
        {error ? (
          <>
            <p className="error" role="alert">
              {error === 'Card not found'
                ? 'That card was not found. It may have been removed from the deck.'
                : error}
            </p>
            <Link to="/">← Home</Link>
          </>
        ) : (
          <p className="muted" role="status">
            Loading card…
          </p>
        )}
      </div>
    );
  }

  const isMcq = card.kind === 'mcq';

  return (
    <div className="stack shell-page">
      <div className="panel stack practice-panel">
        <Link className="practice-back" to={`/decks/${card.deckId}`}>
          ← Deck
        </Link>
        <h1 className="brand practice-title">
          Practice{isMcq ? ' · MCQ' : ''}
        </h1>

        {isMcq ? (
          <>
            <p className="practice-prompt">{card.prompt}</p>
            <div className="mcq-options" role="group" aria-label="Answer options">
              {(card.options ?? []).map((opt, index) => (
                <button
                  key={OPTION_LABELS[index]}
                  type="button"
                  className="mcq-option"
                  disabled={busy || Boolean(result)}
                  onClick={() => void selectOption(index)}
                >
                  <span className="mcq-option-letter">{OPTION_LABELS[index]}</span>
                  <span className="mcq-option-text">{opt}</span>
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            <FlipCard
              prompt={card.prompt}
              answerHint={card.answerHint}
              flipped={flipped}
              onFlip={() => setFlipped((v) => !v)}
            />
            <p className="muted practice-rate-hint">
              {flipped
                ? 'How confident do you feel?'
                : 'Reveal the hint before rating'}
            </p>
            <div className="row">
              <button
                type="button"
                disabled={busy || !flipped || Boolean(result)}
                onClick={() => void rate('learning')}
              >
                Learning
              </button>
              <button
                type="button"
                disabled={busy || !flipped || Boolean(result)}
                onClick={() => void rate('solid')}
              >
                Solid
              </button>
              <button
                type="button"
                disabled={busy || !flipped || Boolean(result)}
                onClick={() => void rate('mastered')}
              >
                Mastered
              </button>
            </div>
          </>
        )}

        {result ? <p className="practice-result">{result}</p> : null}
        {error ? <p className="error">{error}</p> : null}
        <Link to="/">Back to Home</Link>
      </div>
    </div>
  );
}
