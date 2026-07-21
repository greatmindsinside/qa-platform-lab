/**
 * @fileoverview MCQ option display shuffle (client-only).
 *
 * **What:** Permute A–D order for practice; map display index ↔ stored index.
 * **Why:** Server grades against stable correctIndex; UI must not leak position.
 */

export type McqDisplayOrder = {
  /** Options in on-screen A–D order. */
  displayOptions: string[];
  /** displayIndex → original stored index. */
  toOriginal: number[];
};

/** Fisher–Yates index permutation. */
export function shuffleIndices(
  length: number,
  random: () => number = Math.random,
): number[] {
  const order = Array.from({ length }, (_, i) => i);
  for (let i = length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    const tmp = order[i]!;
    order[i] = order[j]!;
    order[j] = tmp;
  }
  return order;
}

/** Apply a known permutation to option strings. */
export function orderMcqOptions(
  options: readonly string[],
  toOriginal: readonly number[],
): McqDisplayOrder {
  if (options.length !== toOriginal.length) {
    throw new Error('options/order length mismatch');
  }
  return {
    displayOptions: toOriginal.map((i) => {
      const text = options[i];
      if (text === undefined) throw new Error('invalid option index');
      return text;
    }),
    toOriginal: [...toOriginal],
  };
}

/** Shuffle options for display; grading still uses original indices. */
export function shuffleMcqOptions(
  options: readonly string[],
  random: () => number = Math.random,
): McqDisplayOrder {
  return orderMcqOptions(options, shuffleIndices(options.length, random));
}

/** Map API correctIndex back to the on-screen A–D slot. */
export function displayIndexForOriginal(
  toOriginal: readonly number[],
  originalIndex: number,
): number {
  return toOriginal.indexOf(originalIndex);
}
