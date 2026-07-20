/**
 * @fileoverview Password hashing helpers (bcrypt).
 *
 * **What:** Hash/verify secrets for seed and login.
 * **Why:** Crypto stays out of domain and stores (SRP).
 */

import bcrypt from 'bcryptjs';

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(
  password: string,
  passwordHash: string,
): Promise<boolean> {
  return bcrypt.compare(password, passwordHash);
}
