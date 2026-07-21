/**
 * @fileoverview App chrome: top bar, left nav, footer.
 *
 * **What:** Persistent shell around page content with skip link + mobile menu.
 * **Why:** Consistent navigation and WCAG-friendly keyboard access.
 */

import { useEffect, useId, useState, type ReactNode } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import type { PublicUser } from '@lab/shared';

export type ShellNav =
  | 'home'
  | 'decks'
  | 'quests'
  | 'leaderboard'
  | 'settings'
  | 'support';

export type AppShellProps = {
  user: PublicUser;
  onSignOut: () => void;
  children: ReactNode;
  activeNav?: ShellNav;
};

function navClass(isActive: boolean): string {
  return isActive ? 'shell-nav-link is-active' : 'shell-nav-link';
}

export function AppShell({
  user,
  onSignOut,
  children,
  activeNav = 'home',
}: AppShellProps) {
  const initial = user.displayName.trim().charAt(0).toUpperCase() || 'Q';
  const [menuOpen, setMenuOpen] = useState(false);
  const menuId = useId();
  const location = useLocation();

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  return (
    <div className="quest-shell">
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>

      <header className="shell-topbar">
        <div className="shell-topbar-start">
          <button
            type="button"
            className="shell-menu-toggle"
            aria-expanded={menuOpen}
            aria-controls={menuId}
            onClick={() => setMenuOpen((v) => !v)}
          >
            Menu
          </button>
          <Link to="/" className="shell-brand">
            Quest Deck
          </Link>
        </div>
        <div className="shell-top-actions" aria-label="Progress summary">
          <span className="shell-stat">{user.totalXp} XP</span>
          <span className="shell-stat shell-stat-title">{user.title}</span>
          <span className="shell-stat">★ {user.currentStreak}</span>
          <button type="button" className="shell-signout" onClick={onSignOut}>
            Sign out
          </button>
        </div>
      </header>

      <div className="shell-body">
        <aside
          id={menuId}
          className={`shell-sidebar${menuOpen ? ' is-open' : ''}`}
        >
          <div className="shell-profile">
            <div className="shell-avatar" aria-hidden>
              {initial}
            </div>
            <div className="shell-profile-text">
              <p className="shell-level">Level {user.level}</p>
              <p className="shell-title">{user.title}</p>
            </div>
          </div>

          <nav className="shell-nav" aria-label="Main">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                navClass(activeNav === 'home' || isActive)
              }
            >
              Home
            </NavLink>
            <NavLink
              to="/decks"
              className={({ isActive }) =>
                navClass(activeNav === 'decks' || isActive)
              }
            >
              Decks
            </NavLink>
            <NavLink
              to="/adventure"
              className={({ isActive }) =>
                navClass(activeNav === 'quests' || isActive)
              }
            >
              Quests
            </NavLink>
            <NavLink
              to="/leaderboard"
              className={({ isActive }) =>
                navClass(activeNav === 'leaderboard' || isActive)
              }
            >
              Leaderboard
            </NavLink>
          </nav>

          <div className="shell-sidebar-foot">
            <NavLink
              to="/settings"
              className={({ isActive }) =>
                navClass(activeNav === 'settings' || isActive)
              }
            >
              Settings
            </NavLink>
            <NavLink
              to="/support"
              className={({ isActive }) =>
                navClass(activeNav === 'support' || isActive)
              }
            >
              Support
            </NavLink>
          </div>
        </aside>

        {menuOpen ? (
          <button
            type="button"
            className="shell-nav-backdrop"
            aria-label="Close menu"
            onClick={() => setMenuOpen(false)}
          />
        ) : null}

        <main id="main-content" className="shell-main" tabIndex={-1}>
          {children}
        </main>
      </div>

      <footer className="shell-footer">
        <p className="shell-footer-copy">
          © {new Date().getFullYear()} Quest Deck
        </p>
      </footer>
    </div>
  );
}
