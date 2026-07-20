/**
 * @fileoverview Deck stage DTO defaults (003-learning-path).
 */

import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { CURRICULUM_DECKS, SEED_USERS } from '@lab/shared';
import { buildApp } from '../../apps/api/src/app.ts';
import type { FastifyInstance } from 'fastify';
import type { LabDb } from '../../apps/api/src/data/db.ts';

describe('deck stage fields', () => {
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

  it('create deck defaults stage null and recommendedStart false', async () => {
    const { token } = await login(
      SEED_USERS.admin.email,
      SEED_USERS.admin.password,
    );
    const created = await app.inject({
      method: 'POST',
      url: '/api/decks',
      headers: { authorization: `Bearer ${token}` },
      payload: { name: `Custom ${Date.now()}` },
    });
    expect(created.statusCode).toBe(201);
    expect(created.json()).toMatchObject({
      stage: null,
      recommendedStart: false,
    });
  });

  it('seeded curriculum decks expose stage and one Start here', async () => {
    const { token } = await login(
      SEED_USERS.member.email,
      SEED_USERS.member.password,
    );
    const res = await app.inject({
      method: 'GET',
      url: '/api/decks',
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(200);
    const decks = res.json() as Array<{
      name: string;
      stage: string | null;
      recommendedStart: boolean;
    }>;
    const foundations = decks.find(
      (d) => d.name === CURRICULUM_DECKS.foundations,
    );
    expect(foundations).toMatchObject({
      stage: 'beginner',
      recommendedStart: true,
    });
    expect(decks.filter((d) => d.recommendedStart)).toHaveLength(1);
  });
});
