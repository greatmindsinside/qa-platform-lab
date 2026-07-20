/**
 * @fileoverview Deck / card / invite application service.
 *
 * **What:** Membership-scoped CRUD for decks/cards and invites.
 * **Why:** Enforces membership RBAC via domain predicates before touching
 * stores; routes stay thin (SOLID SRP). Delete never trusts global role.
 */

import type { Card, CardKind, Deck, DeckMember } from '@lab/shared';
import { isCardKind, isRole } from '@lab/shared';
import {
  canCreateCard,
  canDeleteDeck,
  canInvite,
  canManageDeck,
} from '../domain/rbac.js';
import { mapCard, mapDeck } from '../data/mappers.js';
import type { DeckStore } from '../data/deck-store.js';
import type { ProgressStore } from '../data/progress-store.js';
import type { UserStore } from '../data/user-store.js';
import { HttpError } from '../http/http-error.js';

export type CreateCardInput = {
  kind?: string;
  prompt: string;
  answerHint?: string;
  tags?: string[];
  options?: unknown;
  correctIndex?: unknown;
};

/**
 * Deck collaboration and content use-cases.
 */
export class DeckService {
  constructor(
    private readonly decks: DeckStore,
    private readonly users: UserStore,
    private readonly progress: ProgressStore,
  ) {}

  /** List decks the user belongs to, each with caller mastery %. */
  listDecks(userId: number): Deck[] {
    return this.decks.listDecksForUser(userId).map((d) => {
      const confidences = this.progress.listConfidencesForDeck(userId, d.id);
      return mapDeck(d, confidences);
    });
  }

  /** Create deck; creator becomes membership admin. */
  createDeck(
    userId: number,
    input: { name: string; description?: string },
  ): Deck {
    const name = input.name.trim();
    if (!name) throw new HttpError(400, 'Name is required');
    const deck = this.decks.createDeck({
      name,
      description: input.description?.trim() ?? '',
      ownerUserId: userId,
    });
    this.decks.upsertMember(deck.id, userId, 'admin');
    return mapDeck(deck, []);
  }

  /** Patch deck metadata (membership admin only). */
  updateDeck(
    userId: number,
    deckId: number,
    patch: { name?: string; description?: string },
  ): Deck {
    this.requireMembership(deckId, userId);
    const role = this.decks.getMembership(deckId, userId);
    if (!canManageDeck(role)) throw new HttpError(403, 'Forbidden');
    const deck = this.decks.updateDeck(deckId, patch);
    const confidences = this.progress.listConfidencesForDeck(userId, deck.id);
    return mapDeck(deck, confidences);
  }

  /**
   * Delete deck when membership role is admin.
   * Non-members → 404 (no existence leak); members → 403.
   */
  deleteDeck(userId: number, deckId: number): void {
    const deck = this.decks.getDeck(deckId);
    if (!deck) throw new HttpError(404, 'Deck not found');
    const role = this.decks.getMembership(deckId, userId);
    if (role === null) throw new HttpError(404, 'Deck not found');
    if (!canDeleteDeck(role)) throw new HttpError(403, 'Forbidden');
    this.decks.deleteDeck(deckId);
  }

  /** Invite an existing user by email onto the deck (admin only). */
  invite(
    userId: number,
    deckId: number,
    input: { email: string; role: string },
  ): DeckMember {
    this.requireMembership(deckId, userId);
    const actorRole = this.decks.getMembership(deckId, userId);
    if (!canInvite(actorRole)) throw new HttpError(403, 'Forbidden');
    if (!isRole(input.role)) throw new HttpError(400, 'Invalid role');
    const invitee = this.users.findByEmail(input.email.trim());
    if (!invitee) throw new HttpError(404, 'User not found');
    const role = input.role;
    this.decks.upsertMember(deckId, invitee.id, role);
    return {
      deckId,
      userId: invitee.id,
      email: invitee.email,
      displayName: invitee.display_name,
      role,
    };
  }

  listMembers(userId: number, deckId: number): DeckMember[] {
    this.requireMembership(deckId, userId);
    return this.decks.listMembers(deckId).map((m) => ({
      deckId: m.deck_id,
      userId: m.user_id,
      email: m.email,
      displayName: m.display_name,
      role: m.role,
    }));
  }

  listCards(userId: number, deckId: number): Card[] {
    this.requireMembership(deckId, userId);
    return this.decks.listCards(deckId).map(mapCard);
  }

  /** Create open or MCQ card (membership admin only). Edit/delete out of MVP. */
  createCard(userId: number, deckId: number, input: CreateCardInput): Card {
    this.requireMembership(deckId, userId);
    const role = this.decks.getMembership(deckId, userId);
    if (!canCreateCard(role)) throw new HttpError(403, 'Forbidden');

    const kindRaw = input.kind ?? 'open';
    if (!isCardKind(kindRaw)) throw new HttpError(400, 'Invalid kind');
    const kind: CardKind = kindRaw;

    const prompt = input.prompt.trim();
    if (!prompt) throw new HttpError(400, 'Prompt is required');
    const tags = input.tags ?? [];

    if (kind === 'open') {
      return mapCard(
        this.decks.createCard({
          deckId,
          kind: 'open',
          prompt,
          answerHint: input.answerHint?.trim() ?? '',
          tags,
        }),
      );
    }

    const options = parseMcqOptions(input.options);
    const correctIndex = parseCorrectIndex(input.correctIndex);
    return mapCard(
      this.decks.createCard({
        deckId,
        kind: 'mcq',
        prompt,
        answerHint: '',
        tags,
        options,
        correctIndex,
      }),
    );
  }

  /** Hide non-member access behind 404 to match contract privacy. */
  private requireMembership(deckId: number, userId: number): void {
    const deck = this.decks.getDeck(deckId);
    if (!deck) throw new HttpError(404, 'Deck not found');
    if (this.decks.getMembership(deckId, userId) === null) {
      throw new HttpError(404, 'Deck not found');
    }
  }
}

function parseMcqOptions(
  value: unknown,
): [string, string, string, string] {
  if (!Array.isArray(value) || value.length !== 4) {
    throw new HttpError(400, 'MCQ requires exactly four options');
  }
  const options = value.map((o) => {
    if (typeof o !== 'string' || !o.trim()) {
      throw new HttpError(400, 'Each option must be a non-empty string');
    }
    return o.trim();
  });
  return options as [string, string, string, string];
}

function parseCorrectIndex(value: unknown): number {
  if (
    typeof value !== 'number' ||
    !Number.isInteger(value) ||
    value < 0 ||
    value > 3
  ) {
    throw new HttpError(400, 'correctIndex must be 0–3');
  }
  return value;
}
