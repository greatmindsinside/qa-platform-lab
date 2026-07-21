/**
 * @fileoverview Authentication application service.
 *
 * **What:** Login (password verify + JWT) and `/me` profile projection.
 * **Why:** Orchestrates stores + crypto without HTTP concerns (DIP: injected
 * UserStore). Progression display fields come from domain via mapper.
 */

import type { LeaderboardEntry, PublicUser } from '@lab/shared';
import type { UserStore } from '../data/user-store.js';
import { toPublicUser } from '../data/mappers.js';
import { levelFromXp, titleForLevel } from '../domain/progression.js';
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

  /** Ranked XP board for the lab (no emails). */
  leaderboard(): LeaderboardEntry[] {
    return this.users.listByXpDesc().map((row, index) => {
      const level = levelFromXp(row.total_xp);
      return {
        rank: index + 1,
        userId: row.id,
        displayName: row.display_name,
        title: titleForLevel(level),
        level,
        totalXp: row.total_xp,
        currentStreak: row.current_streak,
      };
    });
  }

  /**
   * Update display name for the signed-in user.
   * @throws {HttpError} 400 on empty/too long name; 401 if missing
   */
  updateProfile(userId: number, displayName: string): PublicUser {
    const trimmed = displayName.trim();
    if (trimmed.length < 2) {
      throw new HttpError(400, 'Display name must be at least 2 characters');
    }
    if (trimmed.length > 40) {
      throw new HttpError(400, 'Display name must be 40 characters or fewer');
    }
    const user = this.users.findById(userId);
    if (!user) throw new HttpError(401, 'Unauthorized');
    return toPublicUser(this.users.updateDisplayName(userId, trimmed));
  }
}
