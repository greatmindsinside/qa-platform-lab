/**
 * @fileoverview User persistence (SQLite).
 *
 * **What:** CRUD-ish access for user rows and XP/streak aggregates.
 * **Why:** Isolates SQL from auth/practice services (DIP / SRP).
 */

import type { Role } from '@lab/shared';
import type { LabDb } from './db.js';

export type UserRow = {
  id: number;
  email: string;
  password_hash: string;
  role: Role;
  display_name: string;
  total_xp: number;
  current_streak: number;
  last_practice_date: string | null;
};

export class UserStore {
  constructor(private readonly db: LabDb) {}

  create(input: {
    email: string;
    passwordHash: string;
    role: Role;
    displayName: string;
  }): UserRow {
    const result = this.db
      .prepare(
        `INSERT INTO users (email, password_hash, role, display_name)
         VALUES (@email, @passwordHash, @role, @displayName)`,
      )
      .run({
        email: input.email,
        passwordHash: input.passwordHash,
        role: input.role,
        displayName: input.displayName,
      });
    const user = this.findById(Number(result.lastInsertRowid));
    if (!user) throw new Error('Failed to create user');
    return user;
  }

  findById(id: number): UserRow | null {
    return (
      this.db
        .prepare(`SELECT * FROM users WHERE id = ?`)
        .get(id) as UserRow | undefined
    ) ?? null;
  }

  findByEmail(email: string): UserRow | null {
    return (
      this.db
        .prepare(`SELECT * FROM users WHERE email = ?`)
        .get(email) as UserRow | undefined
    ) ?? null;
  }

  updateProgress(
    userId: number,
    input: {
      totalXp: number;
      currentStreak: number;
      lastPracticeDate: string;
    },
  ): UserRow {
    this.db
      .prepare(
        `UPDATE users
         SET total_xp = @totalXp,
             current_streak = @currentStreak,
             last_practice_date = @lastPracticeDate
         WHERE id = @userId`,
      )
      .run({ userId, ...input });
    const user = this.findById(userId);
    if (!user) throw new Error('User missing after update');
    return user;
  }
}
