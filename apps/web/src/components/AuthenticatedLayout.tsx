/**
 * @fileoverview Authenticated app chrome wrapper for nested routes.
 *
 * **What:** Renders AppShell around `<Outlet />` with nav highlight from the URL.
 * **Why:** One shell for every signed-in page so chrome stays consistent.
 */

import { Outlet, useLocation } from 'react-router-dom';
import type { PublicUser } from '@lab/shared';
import { AppShell, type ShellNav } from './AppShell';

export type AuthenticatedLayoutProps = {
  user: PublicUser;
  onSignOut: () => void;
};

function activeNavFromPath(pathname: string): ShellNav {
  if (pathname.startsWith('/adventure')) return 'quests';
  if (pathname.startsWith('/leaderboard')) return 'leaderboard';
  if (pathname.startsWith('/settings')) return 'settings';
  if (pathname.startsWith('/support')) return 'support';
  if (
    pathname === '/decks' ||
    pathname.startsWith('/decks/') ||
    pathname.startsWith('/practice')
  ) {
    return 'decks';
  }
  return 'home';
}

export function AuthenticatedLayout({
  user,
  onSignOut,
}: AuthenticatedLayoutProps) {
  const { pathname } = useLocation();

  return (
    <AppShell
      user={user}
      onSignOut={onSignOut}
      activeNav={activeNavFromPath(pathname)}
    >
      <Outlet />
    </AppShell>
  );
}
