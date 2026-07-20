/**
 * @fileoverview Pure deck membership authorization predicates.
 *
 * **What:** Answers “may this membership role delete/invite/create/manage?”
 * **Why:** Authz must use **deck membership** role only — never global
 * `users.role` (constitution / FR-004). Kept pure for easy unit tests.
 */

import type { Role } from '@lab/shared';

/**
 * True when the caller’s membership on the deck is `admin`.
 * Single source for all deck-admin gates (DRY / OCP-friendly aliases below).
 */
export function isDeckAdmin(membershipRole: Role | null | undefined): boolean {
  return membershipRole === 'admin';
}

/** @see isDeckAdmin */
export function canDeleteDeck(membershipRole: Role | null | undefined): boolean {
  return isDeckAdmin(membershipRole);
}

/** @see isDeckAdmin */
export function canInvite(membershipRole: Role | null | undefined): boolean {
  return isDeckAdmin(membershipRole);
}

/** @see isDeckAdmin */
export function canCreateCard(membershipRole: Role | null | undefined): boolean {
  return isDeckAdmin(membershipRole);
}

/** @see isDeckAdmin */
export function canManageDeck(membershipRole: Role | null | undefined): boolean {
  return isDeckAdmin(membershipRole);
}
