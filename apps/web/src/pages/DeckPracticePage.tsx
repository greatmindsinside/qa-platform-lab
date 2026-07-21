/**
 * @fileoverview Full-deck practice session with user-paced Next.
 *
 * **What:** Walk every card; progress bar, inline result, Next to advance.
 * **Why:** Prep sessions without auto-advance delay theater.
 */

import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import type { Card, PracticeResult, PublicUser } from '@lab/shared';
import { FlipCard } from '../components/FlipCard';
import { api } from '../lib/api';
import {
  displayIndexForOriginal,
  shuffleMcqOptions,
  type McqDisplayOrder,
} from '../lib/mcq-order';
import { resumePracticeIndex } from '../lib/path-grouping';

const OPTION_LABELS = ['A', 'B', 'C', 'D'] as const;

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
  /** Display slot indices (A–D after shuffle). */
  selectedIndex: number;
  correct: boolean;
  correctIndex: number;
};

type CardResult = {
  line: string;
  xpAwarded: number;
};

function buildMcqOrders(list: Card[]): Record<number, McqDisplayOrder> {
  const orders: Record<number, McqDisplayOrder> = {};
  for (const c of list) {
    if (c.kind === 'mcq' && c.options && c.options.length > 0) {
      orders[c.id] = shuffleMcqOptions(c.options);
    }
  }
  return orders;
}

/**
 * Deck play-through: grade → result → Next.
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
  const [summary, setSummary] = useState<SessionSummary | null>(null);
  const [instantSwap, setInstantSwap] = useState(false);
  const [mcqFeedback, setMcqFeedback] = useState<McqFeedback | null>(null);
  const [cardResult, setCardResult] = useState<CardResult | null>(null);
  const [mcqOrders, setMcqOrders] = useState<Record<number, McqDisplayOrder>>(
    {},
  );

  const indexRef = useRef(0);
  const cardsLengthRef = useRef(0);
  const practiceLockRef = useRef(false);
  const xpEarnedRef = useRef(0);
  const practicedRef = useRef(0);
  const lastStreakRef = useRef(0);

  useEffect(() => {
    indexRef.current = index;
  }, [index]);

  useEffect(() => {
    cardsLengthRef.current = cards.length;
  }, [cards.length]);

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
        setMcqOrders(buildMcqOrders(list));
        const start = resumePracticeIndex(list);
        setIndex(start);
        indexRef.current = start;
        setFlipped(false);
        setMcqFeedback(null);
        setCardResult(null);
        setSummary(null);
        xpEarnedRef.current = 0;
        practicedRef.current = 0;
        lastStreakRef.current = 0;
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

  function finishSession() {
    setSummary({
      cardsPracticed: practicedRef.current,
      xpEarned: xpEarnedRef.current,
      streak: lastStreakRef.current,
    });
  }

  function goNext() {
    const nextIndex = indexRef.current + 1;
    if (nextIndex >= cardsLengthRef.current) {
      finishSession();
      return;
    }
    setInstantSwap(true);
    indexRef.current = nextIndex;
    setIndex(nextIndex);
    setFlipped(false);
    setMcqFeedback(null);
    setCardResult(null);
    practiceLockRef.current = false;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setInstantSwap(false));
    });
  }

  async function afterPractice(res: PracticeResult, result: CardResult) {
    xpEarnedRef.current += res.xpAwarded;
    practicedRef.current += 1;
    lastStreakRef.current = res.currentStreak;
    setCardResult(result);
    onUser(await api.me(token));
  }

  async function rate(confidence: string) {
    const card = cards[indexRef.current];
    if (!card || practiceLockRef.current || cardResult) return;
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
    }
  }

  async function selectOption(displayIndex: number) {
    const card = cards[indexRef.current];
    if (!card || practiceLockRef.current || cardResult) return;
    const order = mcqOrders[card.id];
    const originalIndex = order?.toOriginal[displayIndex] ?? displayIndex;
    practiceLockRef.current = true;
    setError('');
    setBusy(true);
    try {
      const res = await api.practiceMcq(token, card.id, originalIndex);
      const correct = res.correct ?? false;
      const correctOriginal = res.correctIndex ?? 0;
      const correctDisplay = order
        ? displayIndexForOriginal(order.toOriginal, correctOriginal)
        : correctOriginal;
      setMcqFeedback({
        selectedIndex: displayIndex,
        correct,
        correctIndex: correctDisplay >= 0 ? correctDisplay : correctOriginal,
      });
      const verdict = correct ? 'Correct' : 'Incorrect';
      const key = correct
        ? ''
        : ` · answer ${OPTION_LABELS[correctDisplay] ?? correctOriginal}`;
      await afterPractice(res, {
        xpAwarded: res.xpAwarded,
        line: `${verdict}${key} · +${res.xpAwarded} XP`,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Practice failed');
      practiceLockRef.current = false;
    } finally {
      setBusy(false);
    }
  }

  if (summary) {
    function restartSession() {
      setSummary(null);
      setIndex(0);
      indexRef.current = 0;
      setFlipped(false);
      setMcqFeedback(null);
      setCardResult(null);
      setMcqOrders(buildMcqOrders(cards));
      setError('');
      setInstantSwap(false);
      practiceLockRef.current = false;
      xpEarnedRef.current = 0;
      practicedRef.current = 0;
      lastStreakRef.current = 0;
    }

    return (
      <div className="stack shell-page">
        <div className="stack practice-surface session-complete">
          <p className="page-section-heading">Session complete</p>
          <h1 className="page-title">{deckName}</h1>
          <p className="session-xp-big">+{summary.xpEarned} XP</p>
          <p className="muted practice-result">
            {summary.cardsPracticed} card
            {summary.cardsPracticed === 1 ? '' : 's'} practiced · streak{' '}
            {summary.streak}
          </p>
          <div className="row session-complete-actions">
            <button type="button" className="home-apple-cta" onClick={restartSession}>
              Practice again
            </button>
            <Link className="text-link" to={`/decks/${deckId}`}>
              Back to deck
            </Link>
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
  const answeringLocked = busy || Boolean(cardResult);
  const isLast = position >= total;

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
      <div className="stack practice-surface">
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <Link className="practice-back text-link" to={`/decks/${deckId}`}>
            ← Deck
          </Link>
          <p className="muted practice-progress" aria-live="polite">
            Card {position} of {total}
          </p>
        </div>

        <div
          className="mastery-bar session-progress-bar"
          role="progressbar"
          aria-valuenow={progressPct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Session progress"
        >
          <span className="mastery-bar-fill" style={{ width: `${progressPct}%` }} />
        </div>

        <h1 className="page-title practice-title">
          {deckName || 'Practice'}
        </h1>

        {isMcq ? (
          <>
            <p className="practice-prompt">{card.prompt}</p>
            <div className="mcq-options" role="group" aria-label="Answer options">
              {(mcqOrders[card.id]?.displayOptions ?? card.options ?? []).map(
                (opt, optIndex) => (
                  <button
                    key={`${card.id}-${optIndex}-${opt}`}
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
                ),
              )}
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

        {cardResult ? (
          <div className="stack-sm">
            <p className="practice-result" role="status">
              {cardResult.line}
            </p>
            {isMcq && card.answerHint ? (
              <p className="muted practice-mcq-explain">{card.answerHint}</p>
            ) : null}
            <button type="button" onClick={goNext}>
              {isLast ? 'Finish' : 'Next'}
            </button>
          </div>
        ) : null}

        {error ? (
          <p className="error" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    </div>
  );
}
