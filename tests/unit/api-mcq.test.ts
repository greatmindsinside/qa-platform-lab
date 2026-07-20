/**
 * @fileoverview Fastify inject tests for MCQ create + practice (002).
 */

import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { CURRICULUM_DECKS, SEED_USERS } from '@lab/shared';
import { buildApp } from '../../apps/api/src/app.ts';
import type { FastifyInstance } from 'fastify';
import type { LabDb } from '../../apps/api/src/data/db.ts';

describe('api mcq cards', () => {
  let app: FastifyInstance;
  let db: LabDb;

  beforeAll(async () => {
    const built = await buildApp({ seed: true });
    app = built.app;
    db = built.db;
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
    db.close();
  });

  async function login(email: string, password: string) {
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { email, password },
    });
    expect(res.statusCode).toBe(200);
    return res.json() as { token: string };
  }

  it('admin creates MCQ; GET omits correctIndex; member create 403', async () => {
    const admin = await login(SEED_USERS.admin.email, SEED_USERS.admin.password);
    const member = await login(
      SEED_USERS.member.email,
      SEED_USERS.member.password,
    );

    const decksRes = await app.inject({
      method: 'GET',
      url: '/api/decks',
      headers: { authorization: `Bearer ${admin.token}` },
    });
    const decks = decksRes.json() as Array<{ id: number; name: string }>;
    const deckId = decks.find((d) => d.name === CURRICULUM_DECKS.foundations)!.id;

    const created = await app.inject({
      method: 'POST',
      url: `/api/decks/${deckId}/cards`,
      headers: { authorization: `Bearer ${admin.token}` },
      payload: {
        kind: 'mcq',
        prompt: 'Inject test: which index is correct?',
        options: ['zero', 'one', 'two', 'three'],
        correctIndex: 2,
      },
    });
    expect(created.statusCode).toBe(201);
    const card = created.json() as Record<string, unknown>;
    expect(card).toMatchObject({
      kind: 'mcq',
      prompt: 'Inject test: which index is correct?',
      options: ['zero', 'one', 'two', 'three'],
    });
    expect(card).not.toHaveProperty('correctIndex');

    const badShape = await app.inject({
      method: 'POST',
      url: `/api/decks/${deckId}/cards`,
      headers: { authorization: `Bearer ${admin.token}` },
      payload: {
        kind: 'mcq',
        prompt: 'bad',
        options: ['only', 'two'],
        correctIndex: 0,
      },
    });
    expect(badShape.statusCode).toBe(400);

    const memberCreate = await app.inject({
      method: 'POST',
      url: `/api/decks/${deckId}/cards`,
      headers: { authorization: `Bearer ${member.token}` },
      payload: {
        kind: 'mcq',
        prompt: 'nope',
        options: ['a', 'b', 'c', 'd'],
        correctIndex: 0,
      },
    });
    expect(memberCreate.statusCode).toBe(403);

    const listed = await app.inject({
      method: 'GET',
      url: `/api/decks/${deckId}/cards`,
      headers: { authorization: `Bearer ${member.token}` },
    });
    const cards = listed.json() as Array<Record<string, unknown>>;
    const found = cards.find((c) => c.id === card.id)!;
    expect(found.kind).toBe('mcq');
    expect(found).not.toHaveProperty('correctIndex');
  });

  it('MCQ practice awards 15/5; open path still uses confidence', async () => {
    const { token } = await login(
      SEED_USERS.member.email,
      SEED_USERS.member.password,
    );

    const decksRes = await app.inject({
      method: 'GET',
      url: '/api/decks',
      headers: { authorization: `Bearer ${token}` },
    });
    const decks = decksRes.json() as Array<{ id: number; name: string }>;
    expect(decks).toHaveLength(3);

    const foundations = decks.find(
      (d) => d.name === CURRICULUM_DECKS.foundations,
    )!;
    const cardsRes = await app.inject({
      method: 'GET',
      url: `/api/decks/${foundations.id}/cards`,
      headers: { authorization: `Bearer ${token}` },
    });
    const cards = cardsRes.json() as Array<{ id: number; kind: string }>;
    const mcqCard = cards.find((c) => c.kind === 'mcq')!;
    const openCard = cards.find((c) => c.kind === 'open')!;

    // Foundations first MCQ correctIndex is 1 (B)
    const wrong = await app.inject({
      method: 'POST',
      url: `/api/cards/${mcqCard.id}/practice`,
      headers: { authorization: `Bearer ${token}` },
      payload: { selectedIndex: 0 },
    });
    expect(wrong.statusCode).toBe(200);
    expect(wrong.json()).toMatchObject({
      correct: false,
      correctIndex: 1,
      xpAwarded: 5,
    });

    const right = await app.inject({
      method: 'POST',
      url: `/api/cards/${mcqCard.id}/practice`,
      headers: { authorization: `Bearer ${token}` },
      payload: { selectedIndex: 1 },
    });
    expect(right.statusCode).toBe(200);
    expect(right.json()).toMatchObject({
      correct: true,
      correctIndex: 1,
      xpAwarded: 15,
    });

    const openPractice = await app.inject({
      method: 'POST',
      url: `/api/cards/${openCard.id}/practice`,
      headers: { authorization: `Bearer ${token}` },
      payload: { confidence: 'learning' },
    });
    expect(openPractice.statusCode).toBe(200);
    expect(openPractice.json()).toMatchObject({ xpAwarded: 10 });
  });
});
