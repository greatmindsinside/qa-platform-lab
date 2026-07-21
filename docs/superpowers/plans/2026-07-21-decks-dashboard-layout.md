# Decks Dashboard Layout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the Decks page into a compact dashboard (Continue Learning, filters, card grid, header Create) and extend `GET /api/decks` with `cardCount` + `completedCount`.

**Architecture:** Compute counts in existing `mapDeck` from the confidence list already loaded for mastery. Add pure UI helpers for Continue Learning pick, CTA label, and filter. Rewrite `DecksPage` + CSS; update E2E locators that still expect Practice/Open and stage headings.

**Tech Stack:** TypeScript, Fastify/SQLite API, React + React Router, Vitest, Playwright, existing quest-shell CSS tokens.

**Spec:** `docs/superpowers/specs/2026-07-21-decks-dashboard-layout-design.md`

## Global Constraints

- No new dashboard endpoint; extend `Deck` on existing list/create responses
- No search, no ⋮ menu, no page tagline, no next-quest title, no last-activity
- Mastery formula stays as today (`solid` | `mastered` in `deckMasteryPercent`) — do not change
- `completedCount` = cards with non-null confidence (practiced)
- Copy: `X / Y practiced` (not “quests completed”)
- CTA labels: Start Deck | Resume Practice | Practice Again → `/decks/:id/play`; title → `/decks/:id`
- Continue Learning: `recommendedStart` until mastery 100%, else next Beginner→Intermediate→Expert with mastery &lt; 100%; else hide
- Content max-width ~1280px; grid `repeat(auto-fit, minmax(300px, 1fr))`; card padding 20–24px
- Update E2E that look for `Practice`, `Open`, `Beginner` headings, `Create a new deck` summary, `.start-here-badge`
- Do not rewrite HomePage or DeckDetailPage beyond what tests require for navigation

## File map

| File | Responsibility |
|------|----------------|
| `packages/shared/src/index.ts` | Add `cardCount`, `completedCount` to `Deck` |
| `apps/api/src/data/mappers.ts` | Populate new fields in `mapDeck` |
| `apps/web/src/lib/path-grouping.ts` | Add `pickContinueLearningDeck`, `deckPrimaryCta`, `filterDecksByTab` |
| `apps/web/src/pages/DecksPage.tsx` | Dashboard UI |
| `apps/web/src/styles.css` | Grid, continue card, filters, progress bar, create header |
| `tests/unit/deck-stage.test.ts` | Assert list returns counts |
| `tests/unit/path-grouping.test.ts` | Continue / CTA / filter helpers |
| `tests/e2e/shell-ux.spec.ts` | New locators |
| `tests/e2e/learning-path.spec.ts` | Filters + Continue Learning vs stage headings |
| `tests/e2e/practice.spec.ts` | Start Deck / Resume Practice |
| `tests/e2e/mcq-practice.spec.ts` | Same CTA locator |

---

### Task 1: Extend `Deck` DTO with counts

**Files:**
- Modify: `packages/shared/src/index.ts`
- Modify: `apps/api/src/data/mappers.ts`
- Test: `tests/unit/deck-stage.test.ts`

**Interfaces:**
- Produces: `Deck.cardCount: number`, `Deck.completedCount: number` on every mapped deck

- [ ] **Step 1: Write the failing assertion**

In `tests/unit/deck-stage.test.ts`, extend the seeded curriculum test:

```ts
const decks = res.json() as Array<{
  name: string;
  stage: string | null;
  recommendedStart: boolean;
  cardCount: number;
  completedCount: number;
  masteryPercent: number;
}>;
const foundations = decks.find(
  (d) => d.name === CURRICULUM_DECKS.foundations,
);
expect(foundations).toMatchObject({
  stage: 'beginner',
  recommendedStart: true,
});
expect(foundations!.cardCount).toBeGreaterThan(0);
expect(foundations!.completedCount).toBeGreaterThanOrEqual(0);
expect(foundations!.completedCount).toBeLessThanOrEqual(foundations!.cardCount);
```

Also assert create-deck response includes `cardCount: 0` and `completedCount: 0`.

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn test:unit tests/unit/deck-stage.test.ts`

Expected: FAIL (missing `cardCount` / `completedCount` or undefined)

- [ ] **Step 3: Update shared type + mapper**

In `packages/shared/src/index.ts`:

```ts
export type Deck = {
  id: number;
  name: string;
  description: string;
  ownerUserId: number;
  masteryPercent?: number;
  /** Total cards in the deck. */
  cardCount: number;
  /** Cards with any progress (non-null confidence). */
  completedCount: number;
  stage: LearningStage | null;
  recommendedStart: boolean;
};
```

In `apps/api/src/data/mappers.ts` `mapDeck`:

```ts
export function mapDeck(
  row: DeckRow,
  confidences: Array<Confidence | null | undefined>,
): Deck {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    ownerUserId: row.owner_user_id,
    masteryPercent: deckMasteryPercent(confidences),
    cardCount: confidences.length,
    completedCount: confidences.filter((c) => c != null).length,
    stage: row.stage ?? null,
    recommendedStart: Boolean(row.recommended_start),
  };
}
```

Update `tests/unit/path-grouping.test.ts` `deck()` helper to include `cardCount: 0`, `completedCount: 0` so TypeScript still typechecks.

- [ ] **Step 4: Run tests to verify they pass**

Run: `yarn test:unit tests/unit/deck-stage.test.ts tests/unit/path-grouping.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/shared/src/index.ts apps/api/src/data/mappers.ts tests/unit/deck-stage.test.ts tests/unit/path-grouping.test.ts
git commit -m "$(cat <<'EOF'
Add card and practiced counts to deck list DTOs.

EOF
)"
```

---

### Task 2: Continue Learning, CTA, and filter helpers

**Files:**
- Modify: `apps/web/src/lib/path-grouping.ts`
- Test: `tests/unit/path-grouping.test.ts`

**Interfaces:**
- Consumes: `Deck` with `masteryPercent`, `completedCount`, `recommendedStart`, `stage`
- Produces:
  - `export type DeckFilterTab = 'all' | LearningStage | 'yours'`
  - `pickContinueLearningDeck(decks: Deck[]): Deck | null`
  - `deckPrimaryCta(deck: Deck): { label: 'Start Deck' | 'Resume Practice' | 'Practice Again'; to: string }`
  - `filterDecksByTab(decks: Deck[], tab: DeckFilterTab): Deck[]`

- [ ] **Step 1: Write failing tests**

Append to `tests/unit/path-grouping.test.ts`:

```ts
import {
  groupDecksByPath,
  pickContinueLearningDeck,
  deckPrimaryCta,
  filterDecksByTab,
} from '../../apps/web/src/lib/path-grouping.ts';

function deck(
  partial: Partial<Deck> & Pick<Deck, 'id' | 'name' | 'stage'>,
): Deck {
  return {
    description: '',
    ownerUserId: 1,
    recommendedStart: false,
    cardCount: 10,
    completedCount: 0,
    masteryPercent: 0,
    ...partial,
  };
}

describe('pickContinueLearningDeck', () => {
  it('prefers recommendedStart until mastery 100', () => {
    const decks = [
      deck({
        id: 1,
        name: 'Start',
        stage: 'beginner',
        recommendedStart: true,
        masteryPercent: 13,
        completedCount: 2,
      }),
      deck({
        id: 2,
        name: 'Mid',
        stage: 'intermediate',
        masteryPercent: 50,
        completedCount: 5,
      }),
    ];
    expect(pickContinueLearningDeck(decks)?.name).toBe('Start');
  });

  it('moves to next incomplete stage after start deck is complete', () => {
    const decks = [
      deck({
        id: 1,
        name: 'Start',
        stage: 'beginner',
        recommendedStart: true,
        masteryPercent: 100,
        completedCount: 10,
      }),
      deck({
        id: 2,
        name: 'Mid',
        stage: 'intermediate',
        masteryPercent: 0,
        completedCount: 0,
      }),
      deck({
        id: 3,
        name: 'Hard',
        stage: 'expert',
        masteryPercent: 0,
        completedCount: 0,
      }),
    ];
    expect(pickContinueLearningDeck(decks)?.name).toBe('Mid');
  });

  it('returns null when all path decks are complete', () => {
    const decks = [
      deck({
        id: 1,
        name: 'Start',
        stage: 'beginner',
        recommendedStart: true,
        masteryPercent: 100,
        completedCount: 10,
      }),
      deck({
        id: 2,
        name: 'Mid',
        stage: 'intermediate',
        masteryPercent: 100,
        completedCount: 10,
      }),
      deck({ id: 3, name: 'Custom', stage: null, masteryPercent: 0 }),
    ];
    expect(pickContinueLearningDeck(decks)).toBeNull();
  });
});

describe('deckPrimaryCta', () => {
  it('labels by progress state', () => {
    expect(
      deckPrimaryCta(deck({ id: 1, name: 'A', stage: 'beginner', completedCount: 0 }))
        .label,
    ).toBe('Start Deck');
    expect(
      deckPrimaryCta(
        deck({
          id: 1,
          name: 'A',
          stage: 'beginner',
          completedCount: 2,
          masteryPercent: 13,
        }),
      ).label,
    ).toBe('Resume Practice');
    expect(
      deckPrimaryCta(
        deck({
          id: 1,
          name: 'A',
          stage: 'beginner',
          completedCount: 10,
          masteryPercent: 100,
        }),
      ).label,
    ).toBe('Practice Again');
  });
});

describe('filterDecksByTab', () => {
  const decks = [
    deck({ id: 1, name: 'B', stage: 'beginner' }),
    deck({ id: 2, name: 'I', stage: 'intermediate' }),
    deck({ id: 3, name: 'E', stage: 'expert' }),
    deck({ id: 4, name: 'Mine', stage: null }),
  ];

  it('filters path and custom decks', () => {
    expect(filterDecksByTab(decks, 'all').map((d) => d.name)).toEqual([
      'B',
      'I',
      'E',
    ]);
    expect(filterDecksByTab(decks, 'beginner').map((d) => d.name)).toEqual([
      'B',
    ]);
    expect(filterDecksByTab(decks, 'yours').map((d) => d.name)).toEqual([
      'Mine',
    ]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn test:unit tests/unit/path-grouping.test.ts`

Expected: FAIL — exports missing

- [ ] **Step 3: Implement helpers**

Add to `apps/web/src/lib/path-grouping.ts`:

```ts
import type { Deck, LearningStage } from '@lab/shared';

export type DeckFilterTab = 'all' | LearningStage | 'yours';

function masteryOf(deck: Deck): number {
  return deck.masteryPercent ?? 0;
}

/** Curriculum continue target; null when all path decks are at 100% mastery. */
export function pickContinueLearningDeck(decks: Deck[]): Deck | null {
  const start = decks.find((d) => d.recommendedStart);
  if (start && masteryOf(start) < 100) return start;

  for (const stage of STAGE_ORDER) {
    const ordered = sortStageDecks(decks.filter((d) => d.stage === stage));
    const incomplete = ordered.find((d) => masteryOf(d) < 100);
    if (incomplete) return incomplete;
  }
  return null;
}

export function deckPrimaryCta(deck: Deck): {
  label: 'Start Deck' | 'Resume Practice' | 'Practice Again';
  to: string;
} {
  const mastery = masteryOf(deck);
  const to = `/decks/${deck.id}/play`;
  if (mastery >= 100) return { label: 'Practice Again', to };
  if ((deck.completedCount ?? 0) > 0) return { label: 'Resume Practice', to };
  return { label: 'Start Deck', to };
}

/** Path decks for all/stage tabs; custom decks for yours. */
export function filterDecksByTab(decks: Deck[], tab: DeckFilterTab): Deck[] {
  if (tab === 'yours') {
    return [...decks.filter((d) => d.stage == null)].sort((a, b) => a.id - b.id);
  }
  if (tab === 'all') {
    return STAGE_ORDER.flatMap((stage) =>
      sortStageDecks(decks.filter((d) => d.stage === stage)),
    );
  }
  return sortStageDecks(decks.filter((d) => d.stage === tab));
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `yarn test:unit tests/unit/path-grouping.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/lib/path-grouping.ts tests/unit/path-grouping.test.ts
git commit -m "$(cat <<'EOF'
Add Decks dashboard continue, CTA, and filter helpers.

EOF
)"
```

---

### Task 3: Rebuild DecksPage UI + styles

**Files:**
- Modify: `apps/web/src/pages/DecksPage.tsx` (full rewrite of render)
- Modify: `apps/web/src/styles.css` (deck-tile / new dashboard classes)

**Interfaces:**
- Consumes: helpers from Task 2; `api.decks` / `api.createDeck`
- Produces: page with Continue Learning, filter tabs, grid, Your Decks, header Create

- [ ] **Step 1: Rewrite `DecksPage.tsx`**

Structure (keep existing load/create state machine):

```tsx
/**
 * @fileoverview Decks dashboard — continue learning, filters, compact grid.
 */

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import type { Deck, LearningStage } from '@lab/shared';
import { api } from '../lib/api';
import {
  STAGE_LABELS,
  type DeckFilterTab,
  deckPrimaryCta,
  filterDecksByTab,
  pickContinueLearningDeck,
} from '../lib/path-grouping';

export type DecksPageProps = { token: string };

const FILTER_TABS: { id: DeckFilterTab; label: string }[] = [
  { id: 'all', label: 'All Decks' },
  { id: 'beginner', label: 'Beginner' },
  { id: 'intermediate', label: 'Intermediate' },
  { id: 'expert', label: 'Expert' },
  { id: 'yours', label: 'My Decks' },
];

function stageBadgeLabel(stage: LearningStage | null): string | null {
  if (!stage) return null;
  return STAGE_LABELS[stage];
}

function DeckCard({ deck }: { deck: Deck }) {
  const cta = deckPrimaryCta(deck);
  const mastery = deck.masteryPercent ?? 0;
  const badge = stageBadgeLabel(deck.stage);
  return (
    <li className="deck-card">
      <div className="deck-card-top">
        {badge ? (
          <span className={`stage-badge stage-badge-${deck.stage}`}>{badge}</span>
        ) : null}
        <Link className="deck-card-title" to={`/decks/${deck.id}`}>
          {deck.name}
        </Link>
        {deck.description ? (
          <p className="muted deck-card-desc">{deck.description}</p>
        ) : null}
      </div>
      <div className="deck-card-progress">
        <div
          className="mastery-bar"
          role="progressbar"
          aria-valuenow={mastery}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${mastery}% mastery`}
        >
          <span className="mastery-bar-fill" style={{ width: `${mastery}%` }} />
        </div>
        <p className="muted deck-card-meta">
          {mastery}% · {deck.completedCount} / {deck.cardCount} practiced
        </p>
      </div>
      <Link className="practice-deck-cta" to={cta.to}>
        {cta.label}
      </Link>
    </li>
  );
}

export function DecksPage({ token }: DecksPageProps) {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [deckName, setDeckName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<DeckFilterTab>('all');
  const [createOpen, setCreateOpen] = useState(false);

  // existing useEffect load...

  const continueDeck = useMemo(
    () => pickContinueLearningDeck(decks),
    [decks],
  );
  const pathDecks = useMemo(
    () => filterDecksByTab(decks, filter === 'yours' ? 'all' : filter),
    [decks, filter],
  );
  const yourDecks = useMemo(
    () => filterDecksByTab(decks, 'yours'),
    [decks],
  );
  const showPathGrid = filter !== 'yours';

  async function createDeck(e: FormEvent) {
    // existing create; on success: setCreateOpen(false)
  }

  const createForm = (
    <form className="row stack-sm create-deck-form" onSubmit={createDeck}>
      <label style={{ flex: 1 }}>
        Deck name
        <input
          value={deckName}
          onChange={(e) => setDeckName(e.target.value)}
          placeholder="New deck"
          required
          minLength={2}
        />
      </label>
      <button type="submit">Create deck</button>
      <button type="button" className="text-link" onClick={() => setCreateOpen(false)}>
        Cancel
      </button>
    </form>
  );

  return (
    <div className="stack shell-page decks-dashboard">
      <header className="decks-page-header">
        <h1 className="page-title">Decks</h1>
        <button
          type="button"
          className="create-deck-header-btn"
          onClick={() => setCreateOpen(true)}
        >
          + Create Deck
        </button>
      </header>

      {createOpen ? <div className="panel create-deck-panel">{createForm}</div> : null}
      {/* error + loading */}

      {!loading && continueDeck ? (
        <section className="continue-learning" aria-labelledby="continue-heading">
          <h2 id="continue-heading" className="section-title continue-label">
            Continue Learning
          </h2>
          <div className="continue-card">
            <div className="continue-card-main">
              <div className="deck-tile-badges">
                {stageBadgeLabel(continueDeck.stage) ? (
                  <span className={`stage-badge stage-badge-${continueDeck.stage}`}>
                    {stageBadgeLabel(continueDeck.stage)}
                  </span>
                ) : null}
              </div>
              <Link className="deck-card-title" to={`/decks/${continueDeck.id}`}>
                {continueDeck.name}
              </Link>
              <div className="deck-card-progress">
                <div
                  className="mastery-bar"
                  role="progressbar"
                  aria-valuenow={continueDeck.masteryPercent ?? 0}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`${continueDeck.masteryPercent ?? 0}% mastery`}
                >
                  <span
                    className="mastery-bar-fill"
                    style={{ width: `${continueDeck.masteryPercent ?? 0}%` }}
                  />
                </div>
                <p className="muted deck-card-meta">
                  {continueDeck.masteryPercent ?? 0}% mastery ·{' '}
                  {continueDeck.completedCount} of {continueDeck.cardCount} practiced
                </p>
              </div>
            </div>
            <Link
              className="practice-deck-cta"
              to={deckPrimaryCta(continueDeck).to}
            >
              {deckPrimaryCta(continueDeck).label}
            </Link>
          </div>
        </section>
      ) : null}

      {!loading ? (
        <>
          <div
            className="deck-filter-tabs"
            role="tablist"
            aria-label="Filter decks"
          >
            {FILTER_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={filter === tab.id}
                className={
                  filter === tab.id ? 'deck-filter-tab is-active' : 'deck-filter-tab'
                }
                onClick={() => setFilter(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {showPathGrid ? (
            <section className="stack" aria-label="Curriculum decks">
              {pathDecks.length === 0 ? (
                <p className="muted">No decks in this stage</p>
              ) : (
                <ul className="deck-card-grid">
                  {pathDecks.map((d) => (
                    <DeckCard key={d.id} deck={d} />
                  ))}
                </ul>
              )}
            </section>
          ) : null}

          <section className="stack your-decks-section" aria-labelledby="your-decks-heading">
            <h2 id="your-decks-heading" className="section-title">
              Your Decks
            </h2>
            <ul className="deck-card-grid">
              <li className="deck-card deck-card-create">
                <button
                  type="button"
                  className="deck-create-tile"
                  onClick={() => setCreateOpen(true)}
                >
                  <strong>+ Create a Deck</strong>
                  <span className="muted">Build your own practice path</span>
                </button>
              </li>
              {yourDecks.map((d) => (
                <DeckCard key={d.id} deck={d} />
              ))}
            </ul>
            {yourDecks.length === 0 ? (
              <p className="muted">No custom decks yet</p>
            ) : null}
          </section>
        </>
      ) : null}
    </div>
  );
}
```

Fill in the omitted load/`createDeck` bodies from the current file (same API calls); on successful create call `setCreateOpen(false)`.

- [ ] **Step 2: Add CSS**

In `apps/web/src/styles.css`, add (near existing `.deck-tiles` block; keep old classes if unused elsewhere or leave harmless):

```css
.decks-dashboard {
  max-width: 1280px;
  width: 100%;
  margin-inline: auto;
}

.decks-page-header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.create-deck-header-btn {
  /* use existing button look; cyan primary */
}

.continue-label {
  color: var(--amber);
}

.continue-card {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1.25rem;
  padding: 1.25rem 1.5rem;
  border: 1px solid rgba(255, 193, 74, 0.45);
  background: var(--panel);
  border-radius: 4px;
}

.deck-filter-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem 1rem;
}

.deck-filter-tab {
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  color: var(--muted);
  padding: 0.35rem 0.15rem;
  cursor: pointer;
  box-shadow: none;
}

.deck-filter-tab.is-active {
  color: var(--cyan);
  border-bottom-color: var(--cyan);
}

.deck-card-grid {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 24px;
}

.deck-card {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  padding: 1.25rem; /* 20px */
  border-radius: 4px;
  background: var(--panel);
  border: 1px solid var(--panel-edge);
}

.deck-card-title {
  display: block;
  font-size: 1.05rem;
  font-weight: 700;
  color: inherit;
  text-decoration: none;
}

.deck-card-title:hover {
  color: var(--cyan);
}

.deck-card-desc {
  margin: 0.35rem 0 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.mastery-bar {
  height: 0.45rem;
  border-radius: 2px;
  background: rgba(0, 232, 255, 0.12);
  overflow: hidden;
}

.mastery-bar-fill {
  display: block;
  height: 100%;
  background: var(--cyan);
}

.deck-card-create {
  border-style: dashed;
}

.deck-create-tile {
  display: grid;
  gap: 0.35rem;
  width: 100%;
  text-align: left;
  background: transparent;
  border: none;
  color: inherit;
  cursor: pointer;
  box-shadow: none;
  padding: 0;
}
```

Tune so Expert badge stays magenta; Continue Learning uses amber border only.

- [ ] **Step 3: Typecheck**

Run: `yarn typecheck`

Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/pages/DecksPage.tsx apps/web/src/styles.css
git commit -m "$(cat <<'EOF'
Rebuild Decks page as a compact learning dashboard.

EOF
)"
```

---

### Task 4: Update E2E locators + smoke verify

**Files:**
- Modify: `tests/e2e/shell-ux.spec.ts`
- Modify: `tests/e2e/learning-path.spec.ts`
- Modify: `tests/e2e/practice.spec.ts`
- Modify: `tests/e2e/mcq-practice.spec.ts`

- [ ] **Step 1: Update shell-ux**

- Replace expectation of `heading` Beginner with filter tab `All Decks` or Continue Learning / grid.
- Open deck via title link (not `Open`):

```ts
await expect(page.getByRole('tab', { name: 'All Decks' })).toBeVisible();
await page
  .getByRole('link', { name: CURRICULUM_DECKS.foundations, exact: true })
  .first()
  .click();
```

- Create deck via header button:

```ts
await page.getByRole('button', { name: '+ Create Deck' }).click();
await page.getByLabel('Deck name').fill(deckName);
await page.getByRole('button', { name: 'Create deck' }).click();
await page.getByRole('tab', { name: 'My Decks' }).click();
await page.getByRole('link', { name: deckName, exact: true }).click();
```

- [ ] **Step 2: Update learning-path**

```ts
await expect(page.getByRole('heading', { name: 'Continue Learning' })).toBeVisible();
await expect(page.getByRole('tab', { name: 'Beginner' })).toBeVisible();
await expect(page.getByRole('tab', { name: 'Intermediate' })).toBeVisible();
await expect(page.getByRole('tab', { name: 'Expert' })).toBeVisible();
await expect(page.locator('.start-here-badge')).toHaveCount(0);

await page.getByRole('tab', { name: 'Expert' }).click();
await page
  .getByRole('listitem')
  .filter({ hasText: CURRICULUM_DECKS.strategy })
  .getByRole('link', { name: /Start Deck|Resume Practice|Practice Again/ })
  .click();
```

- [ ] **Step 3: Update practice + mcq-practice**

Replace `.getByRole('link', { name: 'Practice' })` with:

```ts
.getByRole('link', { name: /Start Deck|Resume Practice|Practice Again/ })
```

scoped to the foundations listitem (or continue card — either works if foundations is continue target for fresh seed).

- [ ] **Step 4: Run unit + smoke**

Run: `yarn test:unit && yarn test:smoke`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add tests/e2e/shell-ux.spec.ts tests/e2e/learning-path.spec.ts tests/e2e/practice.spec.ts tests/e2e/mcq-practice.spec.ts
git commit -m "$(cat <<'EOF'
Update Decks E2E locators for dashboard CTAs and filters.

EOF
)"
```

---

## Spec coverage checklist

| Spec requirement | Task |
|------------------|------|
| `cardCount` / `completedCount` on Deck | 1 |
| Continue Learning curriculum pick | 2, 3 |
| CTA Start / Resume / Practice Again | 2, 3 |
| Filter tabs | 2, 3 |
| Compact grid + progress bar | 3 |
| Create Deck in header + Your Decks tile | 3 |
| No search / ⋮ / tagline | 3 |
| E2E updates | 4 |
| Max-width 1280 / minmax 300 grid | 3 |

## Placeholder / consistency review

- Types use `cardCount` / `completedCount` consistently across tasks
- CTA labels match spec exactly
- Mastery formula unchanged (solid|mastered)
- No TBD placeholders
