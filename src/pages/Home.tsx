import { useNavigate } from 'react-router-dom';
import { getActiveGame, getGames, getPlayers } from '../storage';
import { formatDate, formatTime } from '../utils';

export default function Home() {
  const navigate = useNavigate();
  const activeGame = getActiveGame();
  const players = getPlayers();
  const finishedGames = getGames().filter(g => g.status === 'finished').length;

  return (
    <div className="page">
      <div className="page-title">
        <h1>Flip 7 Scores</h1>
        <p>Suivez vos parties de Flip 7</p>
      </div>

      {activeGame && (
        <div className="card mb-16" style={{ borderColor: 'rgba(245,166,35,0.4)' }}>
          <div className="flex-center gap-8 mb-8">
            <span>🎮</span>
            <h3>Partie en cours</h3>
            <span className="badge badge-gold ml-auto">Ronde {activeGame.rounds.length}</span>
          </div>
          <p className="text-sm text-muted mb-16">
            {activeGame.name} · Démarrée le {formatDate(activeGame.startedAt)} à {formatTime(activeGame.startedAt)}
          </p>
          <button className="btn btn-warning btn-lg" style={{ width: '100%' }} onClick={() => navigate(`/game/${activeGame.id}`)}>
            Reprendre la partie →
          </button>
        </div>
      )}

      <div className="card mb-16">
        <h2>Nouvelle partie</h2>
        <p className="text-sm text-muted mb-16">
          {players.length < 2
            ? 'Il faut au moins 2 joueurs. Commencez par en créer.'
            : 'Sélectionnez vos joueurs et c\'est parti !'}
        </p>
        <button
          className="btn btn-primary btn-lg"
          style={{ width: '100%' }}
          disabled={players.length < 2}
          onClick={() => navigate('/new-game')}
        >
          🎲 Nouvelle partie
        </button>
        {players.length < 2 && (
          <button className="btn btn-secondary mt-8" style={{ width: '100%' }} onClick={() => navigate('/players')}>
            👥 Gérer les joueurs
          </button>
        )}
      </div>

      <div className="flex gap-8">
        <div className="card" style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', fontWeight: 800 }}>{players.length}</div>
          <div className="text-sm text-muted mt-8">Joueurs</div>
        </div>
        <div className="card" style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', fontWeight: 800 }}>{finishedGames}</div>
          <div className="text-sm text-muted mt-8">Parties jouées</div>
        </div>
      </div>

      <hr className="divider" />

      <div className="card" style={{ background: 'rgba(233,69,96,0.08)', borderColor: 'rgba(233,69,96,0.2)' }}>
        <h3 className="mb-8">📖 Rappel des règles</h3>
        <ul className="text-sm text-muted" style={{ paddingLeft: 16, lineHeight: 1.8 }}>
          <li><strong>Flip 7</strong> : Collectez 7 cartes Numéro différentes → <strong>+15 pts bonus</strong></li>
          <li><strong>Bust</strong> : Doublon sur une carte Numéro → score 0 pour ce tour</li>
          <li><strong>Carte ×2</strong> : Double la somme de vos cartes Numéro</li>
          <li><strong>Cartes bonus</strong> : +2, +4, +6, +8, +10 ajoutés après le doublement</li>
          <li><strong>Objectif</strong> : Atteindre le score cible en premier</li>
        </ul>
      </div>
    </div>
  );
}
