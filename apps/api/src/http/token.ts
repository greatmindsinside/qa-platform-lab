/**
 * @fileoverview JWT issue/verify (jose).
 *
 * **What:** Signs HS256 tokens for authenticated routes.
 * **Why:** HTTP auth adapter — domain never sees tokens.
 */

import { SignJWT, jwtVerify } from 'jose';

export type TokenPayload = {
  sub: string;
  email: string;
};

export function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET ?? 'lab-dev-secret-change-me';
  return new TextEncoder().encode(secret);
}

export async function signToken(payload: TokenPayload): Promise<string> {
  return new SignJWT({ email: payload.email })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(getJwtSecret());
}

export async function verifyToken(token: string): Promise<TokenPayload> {
  const { payload } = await jwtVerify(token, getJwtSecret());
  const sub = payload.sub;
  const email = payload.email;
  if (typeof sub !== 'string' || typeof email !== 'string') {
    throw new Error('Invalid token payload');
  }
  return { sub, email };
}
