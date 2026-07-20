/**
 * @fileoverview Thin React router shell for Quest Deck.
 *
 * **What:** Wires auth gate → Login / Home / Deck / Practice routes.
 * **Why:** Composition root for the SPA — no domain math, no fetch details
 * beyond what pages already own (SOLID SRP / DIP via injected callbacks).
 */

import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { DeckDetailPage } from './pages/DeckDetailPage';
import { DeckPracticePage } from './pages/DeckPracticePage';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { PracticePage } from './pages/PracticePage';

/**
 * Top-level route tree; unauthenticated users only see login.
 * While restoring a stored JWT, show a loading gate so deep links survive refresh.
 */
export function App() {
  const { token, user, status, setUser, signIn, signOut } = useAuth();

  if (status === 'loading') {
    return (
      <div className="app-shell">
        <p className="muted">Loading session…</p>
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
        path="/"
        element={
          <HomePage
            token={token}
            user={user}
            onRefresh={setUser}
            onSignOut={signOut}
          />
        }
      />
      <Route
        path="/decks/:id"
        element={
          <DeckDetailPage token={token} user={user} onUser={setUser} />
        }
      />
      <Route
        path="/decks/:id/play"
        element={<DeckPracticePage token={token} onUser={setUser} />}
      />
      <Route
        path="/practice/:id"
        element={<PracticePage token={token} onUser={setUser} />}
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
