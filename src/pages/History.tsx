import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getGames, getPlayers, deleteGame } from '../storage';
import { avatarColor, initials, formatDate, formatTime } from '../utils';

export default function History() {
  const navigate = useNavigate();
  const [games, setGames] = useState(() => getGames().filter(g => g.status === 'finished').reverse());
  const players = getPlayers();

  function handleDelete(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm('Supprimer cette partie ?')) return;
    deleteGame(id);
    setGames(getGames().filter(g => g.status === 'finished').reverse());
  }

  if (games.length === 0) {
    return (
      <div className="page">
        <div className="page-title">
          <h1>Historique</h1>
          <p>Toutes vos parties terminées</p>
        </div>
        <div className="empty-state">
          <div className="icon">📋</div>
          <p>Aucune partie terminée pour l'instant.</p>
          <button className="btn btn-primary" onClick={() => navigate('/new-game')}>
            🎲 Nouvelle partie
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-title">
        <h1>Historique</h1>
        <p>{games.length} partie{games.length > 1 ? 's' : ''} terminée{games.length > 1 ? 's' : ''}</p>
      </div>

      <div className="game-list">
        {games.map(game => {
          const maxScore = Math.max(...Object.values(game.cumulativeScores));
          const winners = game.winnerIds?.map(id => players.find(p => p.id === id)).filter(Boolean) || [];
          const gamePlayers = game.playerIds.map(id => players.find(p => p.id === id)).filter(Boolean);

          return (
            <div key={game.id} className="game-item" onClick={() => navigate(`/history/${game.id}`)}>
              <div style={{ display: 'flex', marginRight: 4 }}>
                {gamePlayers.slice(0, 4).map((p, i) => (
                  <div
                    key={p!.id}
                    className="player-avatar"
                    style={{ background: avatarColor(p!.name), width: 28, height: 28, fontSize: '0.7rem', marginLeft: i > 0 ? -8 : 0, border: '2px solid var(--bg)', zIndex: 4 - i }}
                    title={p!.name}
                  >
                    {initials(p!.name)}
                  </div>
                ))}
              </div>
              <div className="game-item-info">
                <div className="game-item-name">{game.name}</div>
                <div className="game-item-meta">
                  {formatDate(game.startedAt)} à {formatTime(game.startedAt)} · {game.rounds.length} tours · Objectif {game.targetScore} pts
                </div>
                {winners.length > 0 && (
                  <div className="text-sm mt-8" style={{ color: 'var(--accent2)' }}>
                    🏆 {winners.map(w => w!.name).join(' & ')}
                  </div>
                )}
              </div>
              <div style={{ textAlign: 'right' }}>
                <div className="game-item-score">{maxScore} pts</div>
                <button
                  className="btn btn-ghost btn-sm mt-8"
                  style={{ color: 'var(--red)', fontSize: '0.7rem' }}
                  onClick={e => handleDelete(game.id, e)}
                >
                  🗑️
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
