import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import Home from './pages/Home';
import Players from './pages/Players';
import NewGame from './pages/NewGame';
import ActiveGame from './pages/ActiveGame';
import History from './pages/History';
import GameDetail from './pages/GameDetail';

function Header() {
  return (
    <header className="app-header">
      <NavLink to="/" className="logo">🃏 Flip 7</NavLink>
      <nav>
        <NavLink to="/" end>🏠 <span>Accueil</span></NavLink>
        <NavLink to="/players">👥 <span>Joueurs</span></NavLink>
        <NavLink to="/history">📋 <span>Historique</span></NavLink>
      </nav>
    </header>
  );
}

export default function App() {
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
