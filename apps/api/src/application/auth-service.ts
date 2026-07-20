/**
 * @fileoverview Authentication application service.
 *
 * **What:** Login (password verify + JWT) and `/me` profile projection.
 * **Why:** Orchestrates stores + crypto without HTTP concerns (DIP: injected
 * UserStore). Progression display fields come from domain via mapper.
 */

import type { PublicUser } from '@lab/shared';
import type { UserStore } from '../data/user-store.js';
import { toPublicUser } from '../data/mappers.js';
import { verifyPassword } from '../http/password.js';
import { signToken } from '../http/token.js';
import { HttpError } from '../http/http-error.js';

/**
 * Auth use-cases for Quest Deck.
 */
export class AuthService {
  constructor(private readonly users: UserStore) {}

  /**
   * Authenticate by email/password; returns bearer token + public user.
   * @throws {HttpError} 401 on bad credentials
   */
  async login(email: string, password: string): Promise<{
    token: string;
    user: PublicUser;
  }> {
    const user = this.users.findByEmail(email);
    if (!user || !(await verifyPassword(password, user.password_hash))) {
      throw new HttpError(401, 'Invalid email or password');
    }
    const token = await signToken({
      sub: String(user.id),
      email: user.email,
    });
    return { token, user: toPublicUser(user) };
  }

  /**
   * Load the authenticated user’s public profile.
   * @throws {HttpError} 401 if user id is missing
   */
  me(userId: number): PublicUser {
    const user = this.users.findById(userId);
    if (!user) throw new HttpError(401, 'Unauthorized');
    return toPublicUser(user);
  }
}
