/**
 * @fileoverview Seed curriculum invariants (003-learning-path).
 */

import { describe, expect, it } from 'vitest';
import {
  CURRICULUM_DECKS,
  LEGACY_SEED_DECK_NAMES,
  SEED_USERS,
  type LearningStage,
} from '@lab/shared';
import { openMemoryDb } from '../../apps/api/src/data/db.ts';
import { DeckStore } from '../../apps/api/src/data/deck-store.ts';
import { UserStore } from '../../apps/api/src/data/user-store.ts';
import { seedDatabase } from '../../apps/api/src/seed.ts';

const STAGES: LearningStage[] = ['beginner', 'intermediate', 'expert'];

describe('seed curriculum', () => {
  it('seeds staged path with floors, mixed kinds, and no legacy names', async () => {
    const db = openMemoryDb();
    await seedDatabase(db);
    const users = new UserStore(db);
    const decks = new DeckStore(db);

    const admin = users.findByEmail(SEED_USERS.admin.email)!;
    const member = users.findByEmail(SEED_USERS.member.email)!;
    const adminDecks = decks.listDecksForUser(admin.id);
    const memberDecks = decks.listDecksForUser(member.id);

    expect(adminDecks).toHaveLength(3);
    expect(memberDecks).toHaveLength(3);

    const names = adminDecks.map((d) => d.name);
    expect(names).toEqual(
      expect.arrayContaining([
        CURRICULUM_DECKS.foundations,
        CURRICULUM_DECKS.applied,
        CURRICULUM_DECKS.strategy,
      ]),
    );
    for (const legacy of LEGACY_SEED_DECK_NAMES) {
      expect(names).not.toContain(legacy);
    }

    const recommended = adminDecks.filter((d) => d.recommended_start);
    expect(recommended).toHaveLength(1);
    expect(recommended[0]!.stage).toBe('beginner');
    expect(recommended[0]!.name).toBe(CURRICULUM_DECKS.foundations);

    for (const stage of STAGES) {
      const stageDecks = adminDecks.filter((d) => d.stage === stage);
      expect(stageDecks.length).toBeGreaterThanOrEqual(1);
      expect(stageDecks.length).toBeLessThanOrEqual(3);

      const cards = stageDecks.flatMap((d) => decks.listCards(d.id));
      expect(cards.length).toBeGreaterThanOrEqual(8);
      expect(Math.max(...stageDecks.map((d) => decks.listCards(d.id).length))).toBeGreaterThanOrEqual(
        6,
      );
      expect(cards.some((c) => c.kind === 'open')).toBe(true);
      expect(cards.some((c) => c.kind === 'mcq')).toBe(true);
    }

    for (const deck of adminDecks) {
      expect(decks.getMembership(deck.id, admin.id)).toBe('admin');
      expect(decks.getMembership(deck.id, member.id)).toBe('member');
      const cards = decks.listCards(deck.id);
      expect(cards.some((c) => c.kind === 'open')).toBe(true);
      expect(cards.some((c) => c.kind === 'mcq')).toBe(true);
    }
  });

  it('is idempotent when curriculum already exists', async () => {
    const db = openMemoryDb();
    await seedDatabase(db);
    const decks = new DeckStore(db);
    const admin = new UserStore(db).findByEmail(SEED_USERS.admin.email)!;
    const before = decks
      .listDecksForUser(admin.id)
      .map((d) => ({ id: d.id, count: decks.listCards(d.id).length }));
    await seedDatabase(db);
    expect(decks.listDecksForUser(admin.id)).toHaveLength(3);
    for (const row of before) {
      expect(decks.listCards(row.id)).toHaveLength(row.count);
    }
  });

  it('backfills new senior cards onto an already-seeded expert deck', async () => {
    const db = openMemoryDb();
    await seedDatabase(db);
    const decks = new DeckStore(db);
    const admin = new UserStore(db).findByEmail(SEED_USERS.admin.email)!;
    const strategy = decks
      .listDecksForUser(admin.id)
      .find((d) => d.name === CURRICULUM_DECKS.strategy)!;
    const seniorPrompt =
      'How would you measure whether the QA strategy is working for the org?';
    expect(
      decks.listCards(strategy.id).some((c) => c.prompt === seniorPrompt),
    ).toBe(true);
    expect(decks.listCards(strategy.id).length).toBeGreaterThanOrEqual(16);
  });

  it('syncs clearer answer hints and renames corrected prompts on re-seed', async () => {
    const db = openMemoryDb();
    await seedDatabase(db);
    const decks = new DeckStore(db);
    const admin = new UserStore(db).findByEmail(SEED_USERS.admin.email)!;
    const foundations = decks
      .listDecksForUser(admin.id)
      .find((d) => d.name === CURRICULUM_DECKS.foundations)!;

    const pyramid = decks
      .listCards(foundations.id)
      .find((c) => c.prompt.startsWith('What is the test pyramid'));
    expect(pyramid?.answer_hint).toMatch(/unit tests at the base/i);

    const locatorMcq = decks
      .listCards(foundations.id)
      .find((c) => c.prompt.includes('locating elements for assertions'));
    expect(locatorMcq?.kind).toBe('mcq');
    expect(locatorMcq?.answer_hint.length).toBeGreaterThan(20);
    expect(decks.listCards(foundations.id)).toHaveLength(8);
  });

  it('removes legacy demo decks on upgrade when curriculum already exists', async () => {
    const db = openMemoryDb();
    await seedDatabase(db);
    const users = new UserStore(db);
    const decks = new DeckStore(db);
    const admin = users.findByEmail(SEED_USERS.admin.email)!;
    const member = users.findByEmail(SEED_USERS.member.email)!;

    for (const name of LEGACY_SEED_DECK_NAMES) {
      const legacy = decks.createDeck({
        name,
        description: 'legacy leftover',
        ownerUserId: admin.id,
      });
      decks.upsertMember(legacy.id, admin.id, 'admin');
      decks.upsertMember(legacy.id, member.id, 'member');
    }
    expect(decks.listDecksForUser(admin.id).length).toBeGreaterThan(3);

    await seedDatabase(db);

    const names = decks.listDecksForUser(admin.id).map((d) => d.name);
    expect(names).toHaveLength(3);
    for (const legacy of LEGACY_SEED_DECK_NAMES) {
      expect(names).not.toContain(legacy);
    }
  });

  it('seeds Flaky Friday adventure with branch and endings', async () => {
    const db = openMemoryDb();
    await seedDatabase(db);
    const { AdventureStore } = await import(
      '../../apps/api/src/data/adventure-store.ts'
    );
    const store = new AdventureStore(db);
    const adventure = store.findBySlug('flaky-friday');
    expect(adventure).toBeTruthy();
    const scenes = store.listScenes(adventure!.id);
    expect(scenes.length).toBeGreaterThanOrEqual(8);
    const endings = scenes.filter((s) => s.is_ending);
    expect(endings.length).toBeGreaterThanOrEqual(2);
    expect(endings.some((s) => s.ending_tone === 'strong')).toBe(true);
    expect(endings.some((s) => s.ending_tone === 'weak')).toBe(true);

    const choiceTags = new Set<string>();
    for (const scene of scenes) {
      for (const choice of store.listChoices(scene.id)) {
        for (const tag of JSON.parse(choice.lesson_tags_json) as string[]) {
          choiceTags.add(tag);
        }
      }
    }
    expect(choiceTags.size).toBeGreaterThanOrEqual(3);
  });
});
