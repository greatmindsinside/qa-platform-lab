/**
 * @fileoverview HTTP route registration (thin adapters).
 *
 * **What:** Maps REST paths to application services.
 * **Why:** Keep Fastify concerns here; validation failures become HttpError;
 * no XP/RBAC math in routes (constitution IV).
 */

import type { FastifyInstance } from 'fastify';
import type { AdventureService } from '../application/adventure-service.js';
import type { AuthService } from '../application/auth-service.js';
import type { DeckService } from '../application/deck-service.js';
import type { PracticeService } from '../application/practice-service.js';
import { requireAuth } from './auth-guard.js';
import { HttpError } from './http-error.js';

export function registerRoutes(
  app: FastifyInstance,
  deps: {
    auth: AuthService;
    decks: DeckService;
    practice: PracticeService;
    adventures: AdventureService;
  },
): void {
  app.get('/api/health', async () => ({ ok: true }));

  app.post<{ Body: { email?: string; password?: string } }>(
    '/api/auth/login',
    async (request) => {
      const email = request.body?.email?.trim() ?? '';
      const password = request.body?.password ?? '';
      if (!email || !password) {
        throw new HttpError(400, 'Email and password required');
      }
      return deps.auth.login(email, password);
    },
  );

  app.get(
    '/api/me',
    { preHandler: requireAuth },
    async (request) => deps.auth.me(request.authUser!.id),
  );

  app.patch<{ Body: { displayName?: string } }>(
    '/api/me',
    { preHandler: requireAuth },
    async (request) => {
      const displayName = request.body?.displayName ?? '';
      return deps.auth.updateProfile(request.authUser!.id, displayName);
    },
  );

  app.get(
    '/api/leaderboard',
    { preHandler: requireAuth },
    async () => deps.auth.leaderboard(),
  );

  app.post<{ Body: { subject?: string; message?: string } }>(
    '/api/support',
    { preHandler: requireAuth },
    async (request) => {
      const subject = request.body?.subject?.trim() ?? '';
      const message = request.body?.message?.trim() ?? '';
      if (subject.length < 3) {
        throw new HttpError(400, 'Subject must be at least 3 characters');
      }
      if (message.length < 10) {
        throw new HttpError(400, 'Message must be at least 10 characters');
      }
      if (subject.length > 120 || message.length > 2000) {
        throw new HttpError(400, 'Subject or message is too long');
      }
      // Demo lab: accept the ticket without outbound email.
      return { ok: true as const, ticketId: `lab-${Date.now()}` };
    },
  );

  app.get(
    '/api/decks',
    { preHandler: requireAuth },
    async (request) => deps.decks.listDecks(request.authUser!.id),
  );

  app.post<{ Body: { name?: string; description?: string } }>(
    '/api/decks',
    { preHandler: requireAuth },
    async (request, reply) => {
      const input: { name: string; description?: string } = {
        name: request.body?.name ?? '',
      };
      if (request.body?.description !== undefined) {
        input.description = request.body.description;
      }
      const deck = deps.decks.createDeck(request.authUser!.id, input);
      return reply.status(201).send(deck);
    },
  );

  app.patch<{
    Params: { id: string };
    Body: { name?: string; description?: string };
  }>('/api/decks/:id', { preHandler: requireAuth }, async (request) => {
    const id = Number(request.params.id);
    return deps.decks.updateDeck(request.authUser!.id, id, request.body ?? {});
  });

  app.delete<{ Params: { id: string } }>(
    '/api/decks/:id',
    { preHandler: requireAuth },
    async (request, reply) => {
      deps.decks.deleteDeck(request.authUser!.id, Number(request.params.id));
      return reply.status(204).send();
    },
  );

  app.post<{
    Params: { id: string };
    Body: { email?: string; role?: string };
  }>(
    '/api/decks/:id/invites',
    { preHandler: requireAuth },
    async (request) => {
      return deps.decks.invite(request.authUser!.id, Number(request.params.id), {
        email: request.body?.email ?? '',
        role: request.body?.role ?? '',
      });
    },
  );

  app.get<{ Params: { id: string } }>(
    '/api/decks/:id/members',
    { preHandler: requireAuth },
    async (request) =>
      deps.decks.listMembers(request.authUser!.id, Number(request.params.id)),
  );

  app.get<{ Params: { id: string } }>(
    '/api/decks/:id/cards',
    { preHandler: requireAuth },
    async (request) =>
      deps.decks.listCards(request.authUser!.id, Number(request.params.id)),
  );

  app.post<{
    Params: { id: string };
    Body: {
      kind?: string;
      prompt?: string;
      answerHint?: string;
      tags?: string[];
      options?: string[];
      correctIndex?: number;
    };
  }>(
    '/api/decks/:id/cards',
    { preHandler: requireAuth },
    async (request, reply) => {
      const body = request.body ?? {};
      const cardInput: {
        kind?: string;
        prompt: string;
        answerHint?: string;
        tags?: string[];
        options?: string[];
        correctIndex?: number;
      } = { prompt: body.prompt ?? '' };
      if (body.kind !== undefined) cardInput.kind = body.kind;
      if (body.answerHint !== undefined) cardInput.answerHint = body.answerHint;
      if (body.tags !== undefined) cardInput.tags = body.tags;
      if (body.options !== undefined) cardInput.options = body.options;
      if (body.correctIndex !== undefined) {
        cardInput.correctIndex = body.correctIndex;
      }
      const card = deps.decks.createCard(
        request.authUser!.id,
        Number(request.params.id),
        cardInput,
      );
      return reply.status(201).send(card);
    },
  );

  app.post<{
    Params: { id: string };
    Body: { confidence?: string; selectedIndex?: number };
  }>(
    '/api/cards/:id/practice',
    { preHandler: requireAuth },
    async (request) => {
      const body = request.body ?? {};
      const practiceBody: {
        confidence?: unknown;
        selectedIndex?: unknown;
      } = {};
      if (body.confidence !== undefined) {
        practiceBody.confidence = body.confidence;
      }
      if (body.selectedIndex !== undefined) {
        practiceBody.selectedIndex = body.selectedIndex;
      }
      return deps.practice.practice(
        request.authUser!.id,
        Number(request.params.id),
        practiceBody,
      );
    },
  );

  app.get(
    '/api/adventures',
    { preHandler: requireAuth },
    async (request) => deps.adventures.list(request.authUser!.id),
  );

  app.get<{ Params: { id: string } }>(
    '/api/adventures/:id/scene',
    { preHandler: requireAuth },
    async (request) =>
      deps.adventures.getScene(
        request.authUser!.id,
        Number(request.params.id),
      ),
  );

  app.post<{ Params: { id: string }; Body: { choiceId?: number } }>(
    '/api/adventures/:id/choices',
    { preHandler: requireAuth },
    async (request) => {
      const choiceId = request.body?.choiceId;
      if (choiceId === undefined || !Number.isInteger(choiceId)) {
        throw new HttpError(400, 'choiceId required');
      }
      return deps.adventures.choose(
        request.authUser!.id,
        Number(request.params.id),
        choiceId,
      );
    },
  );

  app.post<{ Params: { id: string } }>(
    '/api/adventures/:id/restart',
    { preHandler: requireAuth },
    async (request) =>
      deps.adventures.restart(
        request.authUser!.id,
        Number(request.params.id),
      ),
  );
}
