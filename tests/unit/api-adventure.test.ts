/**
 * @fileoverview API inject tests for adventure list/scene/choose/restart/XP.
 */

import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { ADVENTURE_COMPLETION_XP, SEED_USERS } from '@lab/shared';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../../apps/api/src/app.ts';
import type { LabDb } from '../../apps/api/src/data/db.ts';

describe('api adventure', () => {
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

  async function login() {
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: {
        email: SEED_USERS.member.email,
        password: SEED_USERS.member.password,
      },
    });
    expect(res.statusCode).toBe(200);
    return res.json() as { token: string };
  }

  it('lists Flaky Friday and advances with resume', async () => {
    const { token } = await login();
    const list = await app.inject({
      method: 'GET',
      url: '/api/adventures',
      headers: { authorization: `Bearer ${token}` },
    });
    expect(list.statusCode).toBe(200);
    const adventures = list.json() as Array<{ id: number; slug: string }>;
    expect(adventures.some((a) => a.slug === 'flaky-friday')).toBe(true);
    const id = adventures.find((a) => a.slug === 'flaky-friday')!.id;

    await app.inject({
      method: 'POST',
      url: `/api/adventures/${id}/restart`,
      headers: { authorization: `Bearer ${token}` },
    });

    const scene1 = await app.inject({
      method: 'GET',
      url: `/api/adventures/${id}/scene`,
      headers: { authorization: `Bearer ${token}` },
    });
    expect(scene1.statusCode).toBe(200);
    const s1 = scene1.json() as {
      sceneId: number;
      choices: Array<{ id: number }>;
      isEnding: boolean;
    };
    expect(s1.isEnding).toBe(false);
    expect(s1.choices.length).toBeGreaterThan(0);

    const pick = await app.inject({
      method: 'POST',
      url: `/api/adventures/${id}/choices`,
      headers: { authorization: `Bearer ${token}` },
      payload: { choiceId: s1.choices[0]!.id },
    });
    expect(pick.statusCode).toBe(200);
    const mid = pick.json() as { sceneId: number };
    expect(mid.sceneId).not.toBe(s1.sceneId);

    const resume = await app.inject({
      method: 'GET',
      url: `/api/adventures/${id}/scene`,
      headers: { authorization: `Bearer ${token}` },
    });
    expect(resume.json()).toMatchObject({ sceneId: mid.sceneId });
  });

  it('awards XP on first completion and zero on replay', async () => {
    const built = await buildApp({ seed: true });
    await built.app.ready();
    const isolated = built.app;
    try {
      const loginRes = await isolated.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: {
          email: SEED_USERS.member.email,
          password: SEED_USERS.member.password,
        },
      });
      const { token } = loginRes.json() as { token: string };
      const headers = { authorization: `Bearer ${token}` };
      const list = await isolated.inject({
        method: 'GET',
        url: '/api/adventures',
        headers,
      });
      const id = (
        list.json() as Array<{ id: number; slug: string }>
      ).find((a) => a.slug === 'flaky-friday')!.id;

      const finish = async () => {
        await isolated.inject({
          method: 'POST',
          url: `/api/adventures/${id}/restart`,
          headers,
        });
        for (let i = 0; i < 12; i++) {
          const sceneRes = await isolated.inject({
            method: 'GET',
            url: `/api/adventures/${id}/scene`,
            headers,
          });
          const scene = sceneRes.json() as {
            isEnding: boolean;
            choices: Array<{ id: number; label: string }>;
          };
          expect(scene.isEnding).toBe(false);
          const prefer =
            scene.choices.find((c) =>
              /investigate|file a bug|ship after|stronger coverage|open the failing/i.test(
                c.label,
              ),
            ) ?? scene.choices[0];
          const next = await isolated.inject({
            method: 'POST',
            url: `/api/adventures/${id}/choices`,
            headers,
            payload: { choiceId: prefer!.id },
          });
          expect(next.statusCode).toBe(200);
          const body = next.json() as {
            isEnding: boolean;
            xpAwarded?: number;
            takeaways?: Array<{ id: string }>;
          };
          if (body.isEnding) return body;
        }
        throw new Error('Did not reach ending');
      };

      const ending = await finish();
      expect(ending.isEnding).toBe(true);
      expect(ending.takeaways?.length).toBeGreaterThanOrEqual(1);
      expect(ending.xpAwarded).toBe(ADVENTURE_COMPLETION_XP);

      const ending2 = await finish();
      expect(ending2.xpAwarded).toBe(0);
    } finally {
      await built.app.close();
      built.db.close();
    }
  });
});
