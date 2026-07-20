/**
 * @fileoverview Deck, membership, and card persistence.
 *
 * **What:** SQL for decks, deck_members, and cards (open + MCQ).
 * **Why:** Authz decisions stay in application/domain; this store only
 * reads/writes membership roles as data.
 */

import type { CardKind, LearningStage, Role } from '@lab/shared';
import type { LabDb } from './db.js';

export type DeckRow = {
  id: number;
  name: string;
  description: string;
  owner_user_id: number;
  stage: LearningStage | null;
  recommended_start: number;
};

export type CardRow = {
  id: number;
  deck_id: number;
  kind: CardKind;
  prompt: string;
  answer_hint: string;
  tags_json: string;
  options_json: string | null;
  correct_index: number | null;
};

export type MemberRow = {
  deck_id: number;
  user_id: number;
  role: Role;
  email: string;
  display_name: string;
};

export class DeckStore {
  constructor(private readonly db: LabDb) {}

  createDeck(input: {
    name: string;
    description: string;
    ownerUserId: number;
    stage?: LearningStage | null;
    recommendedStart?: boolean;
  }): DeckRow {
    const result = this.db
      .prepare(
        `INSERT INTO decks (name, description, owner_user_id, stage, recommended_start)
         VALUES (@name, @description, @ownerUserId, @stage, @recommendedStart)`,
      )
      .run({
        name: input.name,
        description: input.description,
        ownerUserId: input.ownerUserId,
        stage: input.stage ?? null,
        recommendedStart: input.recommendedStart ? 1 : 0,
      });
    const deck = this.getDeck(Number(result.lastInsertRowid));
    if (!deck) throw new Error('Failed to create deck');
    return deck;
  }

  getDeck(id: number): DeckRow | null {
    return (
      this.db.prepare(`SELECT * FROM decks WHERE id = ?`).get(id) as
        | DeckRow
        | undefined
    ) ?? null;
  }

  findDeckByName(name: string): DeckRow | null {
    return (
      this.db.prepare(`SELECT * FROM decks WHERE name = ?`).get(name) as
        | DeckRow
        | undefined
    ) ?? null;
  }

  updateDeck(
    id: number,
    patch: { name?: string; description?: string },
  ): DeckRow {
    const current = this.getDeck(id);
    if (!current) throw new Error('Deck not found');
    const name = patch.name ?? current.name;
    const description = patch.description ?? current.description;
    this.db
      .prepare(
        `UPDATE decks SET name = ?, description = ? WHERE id = ?`,
      )
      .run(name, description, id);
    const deck = this.getDeck(id);
    if (!deck) throw new Error('Deck missing after update');
    return deck;
  }

  deleteDeck(id: number): void {
    this.db.prepare(`DELETE FROM decks WHERE id = ?`).run(id);
  }

  listDecksForUser(userId: number): DeckRow[] {
    return this.db
      .prepare(
        `SELECT d.* FROM decks d
         INNER JOIN deck_members m ON m.deck_id = d.id
         WHERE m.user_id = ?
         ORDER BY d.id`,
      )
      .all(userId) as DeckRow[];
  }

  upsertMember(deckId: number, userId: number, role: Role): void {
    this.db
      .prepare(
        `INSERT INTO deck_members (deck_id, user_id, role)
         VALUES (?, ?, ?)
         ON CONFLICT(deck_id, user_id) DO UPDATE SET role = excluded.role`,
      )
      .run(deckId, userId, role);
  }

  getMembership(deckId: number, userId: number): Role | null {
    const row = this.db
      .prepare(
        `SELECT role FROM deck_members WHERE deck_id = ? AND user_id = ?`,
      )
      .get(deckId, userId) as { role: Role } | undefined;
    return row?.role ?? null;
  }

  listMembers(deckId: number): MemberRow[] {
    return this.db
      .prepare(
        `SELECT m.deck_id, m.user_id, m.role, u.email, u.display_name
         FROM deck_members m
         INNER JOIN users u ON u.id = m.user_id
         WHERE m.deck_id = ?
         ORDER BY u.email`,
      )
      .all(deckId) as MemberRow[];
  }

  createCard(input: {
    deckId: number;
    kind: CardKind;
    prompt: string;
    answerHint: string;
    tags: string[];
    options?: [string, string, string, string];
    correctIndex?: number;
  }): CardRow {
    const result = this.db
      .prepare(
        `INSERT INTO cards (
           deck_id, kind, prompt, answer_hint, tags_json, options_json, correct_index
         ) VALUES (
           @deckId, @kind, @prompt, @answerHint, @tagsJson, @optionsJson, @correctIndex
         )`,
      )
      .run({
        deckId: input.deckId,
        kind: input.kind,
        prompt: input.prompt,
        answerHint: input.answerHint,
        tagsJson: JSON.stringify(input.tags),
        optionsJson: input.options ? JSON.stringify(input.options) : null,
        correctIndex: input.correctIndex ?? null,
      });
    const card = this.getCard(Number(result.lastInsertRowid));
    if (!card) throw new Error('Failed to create card');
    return card;
  }

  getCard(id: number): CardRow | null {
    return (
      this.db.prepare(`SELECT * FROM cards WHERE id = ?`).get(id) as
        | CardRow
        | undefined
    ) ?? null;
  }

  listCards(deckId: number): CardRow[] {
    return this.db
      .prepare(`SELECT * FROM cards WHERE deck_id = ? ORDER BY id`)
      .all(deckId) as CardRow[];
  }
}
