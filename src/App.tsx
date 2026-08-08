import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import { syncFromServer } from './storage';
import Home from './pages/Home';
import Players from './pages/Players';
import NewGame from './pages/NewGame';
import ActiveGame from './pages/ActiveGame';
import History from './pages/History';
import GameDetail from './pages/GameDetail';

function Header() {
  return (
    <header className="app-header">
      <NavLink to="/" className="logo">
        <img src="/favicon.svg" alt="" style={{ width: 26, height: 26, verticalAlign: 'text-bottom', marginRight: 6 }} />
        Flip 7
      </NavLink>
      <nav>
        <NavLink to="/" end>🏠 <span>Accueil</span></NavLink>
        <NavLink to="/players">👥 <span>Joueurs</span></NavLink>
        <NavLink to="/history">📋 <span>Historique</span></NavLink>
      </nav>
    </header>
  );
}

export default function App() {
  const [synced, setSynced] = useState(false);

  useEffect(() => {
    syncFromServer().finally(() => setSynced(true));
  }, []);

  if (!synced) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', flexDirection: 'column', gap: 16 }}>
        <img src="/favicon.svg" alt="Flip 7" style={{ width: 56, height: 56 }} />
        <div style={{ fontWeight: 800, color: 'var(--teal)', fontSize: '1.1rem' }}>Synchronisation…</div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <div className="app-shell">
        <Header />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/players" element={<Players />} />
          <Route path="/new-game" element={<NewGame />} />
          <Route path="/game/:id" element={<ActiveGame />} />
          <Route path="/history" element={<History />} />
          <Route path="/history/:id" element={<GameDetail />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
