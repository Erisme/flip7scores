import { useState } from 'react';
import { addPlayer, deletePlayer, getPlayers } from '../storage';
import { avatarColor, initials, formatDate } from '../utils';

export default function Players() {
  const [players, setPlayers] = useState(getPlayers);
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) { setError('Entrez un nom'); return; }
    if (players.some(p => p.name.toLowerCase() === trimmed.toLowerCase())) {
      setError('Ce joueur existe déjà');
      return;
    }
    addPlayer(trimmed);
    setPlayers(getPlayers());
    setName('');
    setError('');
  }

  function handleDelete(id: string) {
    if (!confirm('Supprimer ce joueur ?')) return;
    deletePlayer(id);
    setPlayers(getPlayers());
  }

  return (
    <div className="page">
      <div className="page-title">
        <h1>Joueurs</h1>
        <p>Gérez vos joueurs pour les parties</p>
      </div>

      <div className="card mb-16">
        <h2>Ajouter un joueur</h2>
        <form onSubmit={handleAdd}>
          <div className="input-row">
            <input
              type="text"
              placeholder="Nom du joueur"
              value={name}
              onChange={e => { setName(e.target.value); setError(''); }}
              maxLength={30}
              autoFocus
            />
            <button type="submit" className="btn btn-primary">Ajouter</button>
          </div>
          {error && <p className="text-sm mt-8" style={{ color: 'var(--red)' }}>{error}</p>}
        </form>
      </div>

      {players.length === 0 ? (
        <div className="empty-state">
          <div className="icon">👥</div>
          <p>Aucun joueur pour l'instant.<br />Ajoutez des joueurs pour commencer.</p>
        </div>
      ) : (
        <div className="player-list">
          {players.map(player => (
            <div key={player.id} className="player-item">
              <div className="flex-center gap-8">
                <div className="player-avatar" style={{ background: avatarColor(player.name) }}>
                  {initials(player.name)}
                </div>
                <div>
                  <div className="player-name">{player.name}</div>
                  <div className="player-info">Ajouté le {formatDate(player.createdAt)}</div>
                </div>
              </div>
              <button
                className="btn-icon danger"
                onClick={() => handleDelete(player.id)}
                title="Supprimer"
              >
                🗑️
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
