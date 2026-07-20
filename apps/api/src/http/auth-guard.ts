/**
 * @fileoverview Auth preHandler + global error mapping.
 *
 * **What:** Bearer JWT guard and statusCode-aware error handler.
 * **Why:** Duck-types `statusCode` so HttpError works under tsx dual-loading
 * where `instanceof` can fail across module graphs.
 */

import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { verifyToken } from './token.js';
import { HttpError } from './http-error.js';

export type AuthUser = { id: number; email: string };

declare module 'fastify' {
  interface FastifyRequest {
    authUser?: AuthUser;
  }
}

export async function requireAuth(
  request: FastifyRequest,
  _reply: FastifyReply,
): Promise<void> {
  const header = request.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    throw new HttpError(401, 'Unauthorized');
  }
  const token = header.slice('Bearer '.length);
  try {
    const payload = await verifyToken(token);
    request.authUser = { id: Number(payload.sub), email: payload.email };
  } catch {
    throw new HttpError(401, 'Unauthorized');
  }
}

export function registerErrorHandler(app: FastifyInstance): void {
  app.setErrorHandler((err, _request, reply) => {
    const statusCode =
      err instanceof HttpError
        ? err.statusCode
        : typeof err === 'object' &&
            err !== null &&
            'statusCode' in err &&
            typeof (err as { statusCode: unknown }).statusCode === 'number'
          ? (err as { statusCode: number }).statusCode
          : undefined;

    if (statusCode !== undefined && statusCode >= 400 && statusCode < 600) {
      const message =
        err instanceof Error ? err.message : 'Request failed';
      void reply.status(statusCode).send({ error: message });
      return;
    }
    app.log.error(err);
    void reply.status(500).send({ error: 'Internal Server Error' });
  });
}
