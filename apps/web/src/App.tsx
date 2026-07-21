/**
 * @fileoverview Thin React router shell for Quest Deck.
 *
 * **What:** Wires auth gate → Login / authenticated layout + page routes.
 * **Why:** Composition root for the SPA — shell chrome lives in one layout.
 */

import { Navigate, Route, Routes } from 'react-router-dom';
import { AuthenticatedLayout } from './components/AuthenticatedLayout';
import { useAuth } from './hooks/useAuth';
import { AdventurePage } from './pages/AdventurePage';
import { DeckDetailPage } from './pages/DeckDetailPage';
import { DeckPracticePage } from './pages/DeckPracticePage';
import { DecksPage } from './pages/DecksPage';
import { HomePage } from './pages/HomePage';
import { LeaderboardPage } from './pages/LeaderboardPage';
import { LoginPage } from './pages/LoginPage';
import { PracticePage } from './pages/PracticePage';
import { SettingsPage } from './pages/SettingsPage';
import { SupportPage } from './pages/SupportPage';

/**
 * Top-level route tree; unauthenticated users only see login.
 * While restoring a stored JWT, show a loading gate so deep links survive refresh.
 */
export function App() {
  const { token, user, status, setUser, signIn, signOut, retrySession } =
    useAuth();

  if (status === 'loading') {
    return (
      <div className="app-shell">
        <p className="muted" role="status">
          Loading session…
        </p>
      </div>
    );
  }

  if (status === 'unreachable') {
    return (
      <div className="app-shell stack" style={{ maxWidth: '28rem' }}>
        <p className="brand hero-brand">Quest Deck</p>
        <p role="alert" className="error">
          Can’t reach the server. Check that the API is running, then try again.
        </p>
        <button type="button" onClick={retrySession}>
          Retry
        </button>
        <button type="button" className="secondary" onClick={signOut}>
          Sign out
        </button>
      </div>
    );
  }

  if (status === 'anonymous' || !token || !user) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage onLogin={signIn} />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route
        element={
          <AuthenticatedLayout user={user} onSignOut={signOut} />
        }
      >
        <Route
          path="/"
          element={
            <HomePage token={token} user={user} onRefresh={setUser} />
          }
        />
        <Route path="/decks" element={<DecksPage token={token} />} />
        <Route
          path="/decks/:id"
          element={
            <DeckDetailPage
              token={token}
              user={user}
              onUser={setUser}
            />
          }
        />
        <Route
          path="/decks/:id/play"
          element={<DeckPracticePage token={token} onUser={setUser} />}
        />
        <Route
          path="/adventure"
          element={<AdventurePage token={token} onUser={setUser} />}
        />
        <Route
          path="/leaderboard"
          element={<LeaderboardPage token={token} user={user} />}
        />
        <Route
          path="/settings"
          element={
            <SettingsPage
              token={token}
              user={user}
              onUser={setUser}
              onSignOut={signOut}
            />
          }
        />
        <Route path="/support" element={<SupportPage token={token} />} />
        <Route
          path="/practice/:id"
          element={<PracticePage token={token} onUser={setUser} />}
        />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
