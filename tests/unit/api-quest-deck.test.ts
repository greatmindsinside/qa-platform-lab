/**
 * @fileoverview Fastify inject tests for health, auth, practice, membership delete.
 */

import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { SEED_USERS } from '@lab/shared';
import { buildApp } from '../../apps/api/src/app.ts';
import type { FastifyInstance } from 'fastify';
import type { LabDb } from '../../apps/api/src/data/db.ts';

describe('api quest deck', () => {
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
    return res.json() as { token: string; user: { id: number } };
  }

  it('health', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/health' });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ ok: true });
  });

  it('login and me with xp fields', async () => {
    const { token } = await login(
      SEED_USERS.admin.email,
      SEED_USERS.admin.password,
    );
    const me = await app.inject({
      method: 'GET',
      url: '/api/me',
      headers: { authorization: `Bearer ${token}` },
    });
    expect(me.statusCode).toBe(200);
    const body = me.json();
    expect(body).toMatchObject({
      email: SEED_USERS.admin.email,
      totalXp: 0,
      level: 1,
      title: 'Apprentice',
      currentStreak: 0,
      xpIntoLevel: 0,
      xpToNextLevel: 100,
    });
  });

  it('practice awards XP and member sees seeded decks', async () => {
    const { token } = await login(
      SEED_USERS.member.email,
      SEED_USERS.member.password,
    );
    const decksRes = await app.inject({
      method: 'GET',
      url: '/api/decks',
      headers: { authorization: `Bearer ${token}` },
    });
    expect(decksRes.statusCode).toBe(200);
    const decks = decksRes.json() as Array<{
      id: number;
      masteryPercent: number;
    }>;
    expect(decks).toHaveLength(3);
    expect(decks[0]?.masteryPercent).toBe(0);
    expect(decks[0]).toMatchObject({
      stage: expect.anything(),
      recommendedStart: expect.any(Boolean),
    });

    const cardsRes = await app.inject({
      method: 'GET',
      url: `/api/decks/${decks[0]!.id}/cards`,
      headers: { authorization: `Bearer ${token}` },
    });
    const cards = cardsRes.json() as Array<{
      id: number;
      confidence: string | null;
    }>;
    expect(cards[0]?.confidence).toBeNull();

    const practice = await app.inject({
      method: 'POST',
      url: `/api/cards/${cards[0]!.id}/practice`,
      headers: { authorization: `Bearer ${token}` },
      payload: { confidence: 'learning' },
    });
    expect(practice.statusCode).toBe(200);
    expect(practice.json()).toMatchObject({
      xpAwarded: 10,
      totalXp: 10,
      currentStreak: 1,
      xpIntoLevel: 10,
      xpToNextLevel: 90,
    });

    const cardsAfter = await app.inject({
      method: 'GET',
      url: `/api/decks/${decks[0]!.id}/cards`,
      headers: { authorization: `Bearer ${token}` },
    });
    const practiced = cardsAfter.json() as Array<{
      id: number;
      confidence: string | null;
    }>;
    expect(practiced.find((c) => c.id === cards[0]!.id)?.confidence).toBe(
      'learning',
    );

    const decksAfter = await app.inject({
      method: 'GET',
      url: '/api/decks',
      headers: { authorization: `Bearer ${token}` },
    });
    const deckAfter = (
      decksAfter.json() as Array<{ id: number; completedCount: number }>
    ).find((d) => d.id === decks[0]!.id);
    expect(deckAfter?.completedCount).toBeGreaterThanOrEqual(1);

    const improve = await app.inject({
      method: 'POST',
      url: `/api/cards/${cards[0]!.id}/practice`,
      headers: { authorization: `Bearer ${token}` },
      payload: { confidence: 'solid' },
    });
    expect(improve.statusCode).toBe(200);
    expect(improve.json()).toMatchObject({
      xpAwarded: 15,
      totalXp: 25,
      currentStreak: 1,
    });
  });

  it('member 403 delete; membership-admin delete 204', async () => {
    const admin = await login(
      SEED_USERS.admin.email,
      SEED_USERS.admin.password,
    );
    const member = await login(
      SEED_USERS.member.email,
      SEED_USERS.member.password,
    );

    const created = await app.inject({
      method: 'POST',
      url: '/api/decks',
      headers: { authorization: `Bearer ${admin.token}` },
      payload: { name: 'Temp RBAC Deck', description: 'x' },
    });
    const deckId = (created.json() as { id: number }).id;

    await app.inject({
      method: 'POST',
      url: `/api/decks/${deckId}/invites`,
      headers: { authorization: `Bearer ${admin.token}` },
      payload: { email: SEED_USERS.member.email, role: 'member' },
    });

    const memberDelete = await app.inject({
      method: 'DELETE',
      url: `/api/decks/${deckId}`,
      headers: { authorization: `Bearer ${member.token}` },
    });
    expect(memberDelete.statusCode).toBe(403);

    // membership-admin: promote member to deck admin (global role still member)
    await app.inject({
      method: 'POST',
      url: `/api/decks/${deckId}/invites`,
      headers: { authorization: `Bearer ${admin.token}` },
      payload: { email: SEED_USERS.member.email, role: 'admin' },
    });
    const membershipAdminDelete = await app.inject({
      method: 'DELETE',
      url: `/api/decks/${deckId}`,
      headers: { authorization: `Bearer ${member.token}` },
    });
    expect(membershipAdminDelete.statusCode).toBe(204);
  });
});
