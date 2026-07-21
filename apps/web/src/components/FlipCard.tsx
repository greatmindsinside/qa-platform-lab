/**
 * @fileoverview 3D flip flashcard (open practice).
 *
 * **What:** Front = prompt; back = answer hint. Click or Show hint flips.
 * **Why:** Pure presentation — practice/XP stay on the server.
 */

export type FlipCardProps = {
  prompt: string;
  answerHint: string;
  flipped: boolean;
  onFlip: () => void;
  /** When true, skip the 3D rotate transition (used on card change). */
  instantSwap?: boolean;
};

/**
 * Physical-style study card. Parent owns flip state (and confidence rating below).
 */
export function FlipCard({
  prompt,
  answerHint,
  flipped,
  onFlip,
  instantSwap = false,
}: FlipCardProps) {
  return (
    <div className="flip-stage">
      <button
        type="button"
        className={`flip-card${flipped ? ' is-flipped' : ''}${instantSwap ? ' instant-swap' : ''}`}
        onClick={onFlip}
        aria-pressed={flipped}
        aria-label={flipped ? 'Flip flashcard back' : 'Flip flashcard'}
      >
        <div className="flip-card-inner">
          <div
            className="flip-face flip-front"
            aria-hidden={flipped}
          >
            <span className="flip-face-label">Question</span>
            <p className="flip-face-body">{prompt}</p>
          </div>
          <div
            className="flip-face flip-back"
            aria-hidden={!flipped}
          >
            <span className="flip-face-label">Answer</span>
            <p className="flip-face-body hint">
              {answerHint || 'No hint yet.'}
            </p>
          </div>
        </div>
      </button>
      <button
        type="button"
        className="secondary flip-reveal-btn"
        onClick={onFlip}
      >
        {flipped ? 'Hide hint' : 'Show hint'}
      </button>
    </div>
  );
}
