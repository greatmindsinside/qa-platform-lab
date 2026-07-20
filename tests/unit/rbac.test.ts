/**
 * @fileoverview Unit tests for membership RBAC predicates.
 *
 * **What:** Asserts deck-admin gates for delete/invite/create.
 * **Why:** Locks constitution rule — membership role, not global users.role.
 */

import { describe, expect, it } from 'vitest';
import {
  canDeleteDeck,
  canInvite,
  canCreateCard,
  isDeckAdmin,
} from '../../apps/api/src/domain/rbac.ts';

describe('rbac', () => {
  it('treats membership admin as the sole elevated role', () => {
    expect(isDeckAdmin('admin')).toBe(true);
    expect(isDeckAdmin('member')).toBe(false);
    expect(isDeckAdmin(null)).toBe(false);
  });

  it('allows deck delete only for membership admin', () => {
    expect(canDeleteDeck('admin')).toBe(true);
    expect(canDeleteDeck('member')).toBe(false);
    expect(canDeleteDeck(null)).toBe(false);
  });

  it('gates invite and card create on membership admin', () => {
    expect(canInvite('admin')).toBe(true);
    expect(canInvite('member')).toBe(false);
    expect(canCreateCard('admin')).toBe(true);
    expect(canCreateCard('member')).toBe(false);
  });
});
