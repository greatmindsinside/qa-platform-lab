/**
 * @fileoverview Full-deck practice session with auto-advance + session HUD.
 *
 * **What:** Walk every card; progress bar, XP toast, MCQ feedback, flip-gated ratings.
 * **Why:** Prep sessions need a continuous, self-explanatory loop.
 */

import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import type { Card, PracticeResult, PublicUser } from '@lab/shared';
import { FlipCard } from '../components/FlipCard';
import { api } from '../lib/api';

const OPTION_LABELS = ['A', 'B', 'C', 'D'] as const;
const AUTO_ADVANCE_MS = 1400;

export type DeckPracticePageProps = {
  token: string;
  onUser: (u: PublicUser) => void;
};

type SessionSummary = {
  cardsPracticed: number;
  xpEarned: number;
  streak: number;
};

type McqFeedback = {
  selectedIndex: number;
  correct: boolean;
  correctIndex: number;
};

type XpToast = {
  line: string;
  xpAwarded: number;
};

/**
 * Deck play-through: HUD + auto-advance after each practice.
 */
export function DeckPracticePage({ token, onUser }: DeckPracticePageProps) {
  const { id } = useParams();
  const deckId = Number(id);
  const [deckName, setDeckName] = useState('');
  const [cards, setCards] = useState<Card[]>([]);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [advancing, setAdvancing] = useState(false);
  const [summary, setSummary] = useState<SessionSummary | null>(null);
  const [instantSwap, setInstantSwap] = useState(false);
  const [mcqFeedback, setMcqFeedback] = useState<McqFeedback | null>(null);
  const [xpToast, setXpToast] = useState<XpToast | null>(null);

  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const indexRef = useRef(0);
  const cardsLengthRef = useRef(0);
  const practiceLockRef = useRef(false);
  const advanceScheduledRef = useRef(false);
  const xpEarnedRef = useRef(0);
  const practicedRef = useRef(0);

  useEffect(() => {
    indexRef.current = index;
  }, [index]);

  useEffect(() => {
    cardsLengthRef.current = cards.length;
  }, [cards.length]);

  useEffect(() => {
    return () => {
      if (advanceTimer.current) clearTimeout(advanceTimer.current);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const decks = await api.decks(token);
        if (cancelled) return;
        const deck = decks.find((d) => d.id === deckId);
        if (!deck) {
          setError('Deck not found');
          return;
        }
        setDeckName(deck.name);
        const list = await api.cards(token, deckId);
        if (cancelled) return;
        if (list.length === 0) {
          setError('This deck has no cards yet');
          return;
        }
        setCards(list);
        setIndex(0);
        indexRef.current = 0;
        setFlipped(false);
        setMcqFeedback(null);
        setXpToast(null);
        setSummary(null);
        xpEarnedRef.current = 0;
        practicedRef.current = 0;
        advanceScheduledRef.current = false;
        practiceLockRef.current = false;
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load deck');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token, deckId]);

  function clearAdvanceTimer() {
    if (advanceTimer.current) {
      clearTimeout(advanceTimer.current);
      advanceTimer.current = null;
    }
  }

  function finishSession(nextXp: number, nextPracticed: number, streak: number) {
    advanceScheduledRef.current = false;
    setAdvancing(false);
    setXpToast(null);
    setSummary({
      cardsPracticed: nextPracticed,
      xpEarned: nextXp,
      streak,
    });
  }

  function scheduleAdvance(streak: number) {
    if (advanceScheduledRef.current) return;
    advanceScheduledRef.current = true;
    setAdvancing(true);
    clearAdvanceTimer();

    const fromIndex = indexRef.current;
    const nextXp = xpEarnedRef.current;
    const nextPracticed = practicedRef.current;

    advanceTimer.current = setTimeout(() => {
      advanceTimer.current = null;
      const nextIndex = fromIndex + 1;
      if (nextIndex >= cardsLengthRef.current) {
        finishSession(nextXp, nextPracticed, streak);
        return;
      }
      setInstantSwap(true);
      indexRef.current = nextIndex;
      setIndex(nextIndex);
      setFlipped(false);
      setMcqFeedback(null);
      setXpToast(null);
      setAdvancing(false);
      advanceScheduledRef.current = false;
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setInstantSwap(false));
      });
    }, AUTO_ADVANCE_MS);
  }

  async function afterPractice(res: PracticeResult, toast: XpToast) {
    const nextXp = xpEarnedRef.current + res.xpAwarded;
    const nextPracticed = practicedRef.current + 1;
    xpEarnedRef.current = nextXp;
    practicedRef.current = nextPracticed;
    setXpToast(toast);
    onUser(await api.me(token));
    scheduleAdvance(res.currentStreak);
  }

  async function rate(confidence: string) {
    const card = cards[indexRef.current];
    if (!card || practiceLockRef.current || advanceScheduledRef.current) return;
    if (!flipped) return;
    practiceLockRef.current = true;
    setError('');
    setBusy(true);
    try {
      const res = await api.practice(token, card.id, confidence);
      await afterPractice(res, {
        xpAwarded: res.xpAwarded,
        line: `+${res.xpAwarded} XP · streak ${res.currentStreak}`,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Practice failed');
      practiceLockRef.current = false;
    } finally {
      setBusy(false);
      if (!advanceScheduledRef.current) {
        practiceLockRef.current = false;
      }
    }
  }

  async function selectOption(selectedIndex: number) {
    const card = cards[indexRef.current];
    if (!card || practiceLockRef.current || advanceScheduledRef.current) return;
    practiceLockRef.current = true;
    setError('');
    setBusy(true);
    try {
      const res = await api.practiceMcq(token, card.id, selectedIndex);
      const correct = res.correct ?? false;
      const correctIndex = res.correctIndex ?? 0;
      setMcqFeedback({ selectedIndex, correct, correctIndex });
      const verdict = correct ? 'Correct!' : 'Incorrect';
      const key = ` · answer ${OPTION_LABELS[correctIndex] ?? correctIndex}`;
      await afterPractice(res, {
        xpAwarded: res.xpAwarded,
        line: `${verdict}${correct ? '' : key} · +${res.xpAwarded} XP`,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Practice failed');
      practiceLockRef.current = false;
    } finally {
      setBusy(false);
      if (!advanceScheduledRef.current) {
        practiceLockRef.current = false;
      }
    }
  }

  useEffect(() => {
    if (!advancing && !summary) {
      practiceLockRef.current = false;
    }
  }, [advancing, index, summary]);

  if (summary) {
    function restartSession() {
      clearAdvanceTimer();
      setSummary(null);
      setIndex(0);
      indexRef.current = 0;
      setFlipped(false);
      setMcqFeedback(null);
      setXpToast(null);
      setError('');
      setAdvancing(false);
      setInstantSwap(false);
      advanceScheduledRef.current = false;
      practiceLockRef.current = false;
      xpEarnedRef.current = 0;
      practicedRef.current = 0;
    }

    return (
      <div className="stack shell-page">
        <div className="panel stack practice-panel session-complete">
          <p className="session-complete-label">Session complete</p>
          <h1 className="brand practice-title">{deckName}</h1>
          <p className="session-xp-big">+{summary.xpEarned} XP</p>
          <p className="practice-result">
            {summary.cardsPracticed} card
            {summary.cardsPracticed === 1 ? '' : 's'} practiced · streak{' '}
            {summary.streak}
          </p>
          <p className="practice-guide">Nice work — keep the streak going tomorrow.</p>
          <div className="row session-complete-actions">
            <button type="button" className="practice-cta-link" onClick={restartSession}>
              Practice again
            </button>
            <Link className="text-link" to={`/decks/${deckId}`}>
              Back to deck
            </Link>
            <Link to="/">Home</Link>
          </div>
        </div>
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className="practice-loading stack shell-page">
        {error ? (
          <>
            <p className="error" role="alert">
              {error}
            </p>
            <Link to={`/decks/${deckId}`}>← Deck</Link>
            <Link to="/">Home</Link>
          </>
        ) : (
          <>
            <p className="muted">Loading session…</p>
            <Link to={`/decks/${deckId}`}>← Deck</Link>
          </>
        )}
      </div>
    );
  }

  const card = cards[index]!;
  const isMcq = card.kind === 'mcq';
  const total = cards.length;
  const position = index + 1;
  const progressPct = Math.round((position / total) * 100);

  const guide = advancing
    ? position >= total
      ? 'Finishing session…'
      : 'Moving to next card…'
    : isMcq
      ? 'Pick A–D — next card opens automatically'
      : flipped
        ? 'Rate how solid you feel — next card opens automatically'
        : 'Flip the card to reveal the hint, then rate your confidence';

  const answeringLocked = busy || advancing || Boolean(xpToast);

  function mcqOptionClass(optIndex: number): string {
    const base = 'mcq-option';
    if (!mcqFeedback) return base;
    if (optIndex === mcqFeedback.correctIndex) return `${base} is-correct`;
    if (optIndex === mcqFeedback.selectedIndex && !mcqFeedback.correct) {
      return `${base} is-wrong`;
    }
    return base;
  }

  return (
    <div className="stack shell-page">
      <div className="panel stack practice-panel">
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <Link className="practice-back" to={`/decks/${deckId}`}>
            ← End session
          </Link>
          <p className="practice-progress" aria-live="polite">
            Card {position} of {total}
          </p>
        </div>

        <div
          className="session-progress"
          role="progressbar"
          aria-valuenow={progressPct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Session progress"
        >
          <span style={{ width: `${progressPct}%` }} />
        </div>

        <h1 className="brand practice-title">
          {deckName || 'Practice'}
          {isMcq ? ' · MCQ' : ''}
        </h1>
        <p className="practice-guide">{guide}</p>

        {xpToast ? (
          <div className="xp-toast" role="status" aria-live="polite">
            <span className="xp-toast-amount">+{xpToast.xpAwarded} XP</span>
            <span className="xp-toast-detail">{xpToast.line}</span>
          </div>
        ) : null}

        {isMcq ? (
          <>
            <p className="practice-prompt">{card.prompt}</p>
            <div className="mcq-options" role="group" aria-label="Answer options">
              {(card.options ?? []).map((opt, optIndex) => (
                <button
                  key={OPTION_LABELS[optIndex]}
                  type="button"
                  className={mcqOptionClass(optIndex)}
                  disabled={answeringLocked}
                  onClick={() => void selectOption(optIndex)}
                >
                  <span className="mcq-option-letter">
                    {OPTION_LABELS[optIndex]}
                  </span>
                  <span className="mcq-option-text">{opt}</span>
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            <FlipCard
              key={card.id}
              prompt={card.prompt}
              answerHint={card.answerHint}
              flipped={flipped}
              instantSwap={instantSwap}
              onFlip={() => {
                if (!answeringLocked) setFlipped((v) => !v);
              }}
            />
            <p className="muted practice-rate-hint">
              {flipped
                ? 'How confident do you feel?'
                : 'Reveal the hint before rating'}
            </p>
            <div className="row confidence-row">
              <button
                type="button"
                className="confidence-btn"
                disabled={answeringLocked || !flipped}
                onClick={() => void rate('learning')}
              >
                Learning
              </button>
              <button
                type="button"
                className="confidence-btn"
                disabled={answeringLocked || !flipped}
                onClick={() => void rate('solid')}
              >
                Solid
              </button>
              <button
                type="button"
                className="confidence-btn confidence-btn-mastered"
                disabled={answeringLocked || !flipped}
                onClick={() => void rate('mastered')}
              >
                Mastered
              </button>
            </div>
          </>
        )}

        {error ? (
          <p className="error" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    </div>
  );
}
