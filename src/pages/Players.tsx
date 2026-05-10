import { useState, useRef } from 'react';
import { addPlayer, deletePlayer, getPlayers, getGames, updatePlayerName } from '../storage';
import { avatarColor, initials, formatDate } from '../utils';
import type { Player } from '../types';

interface PlayerStats {
  played: number;
  wins: number;
  totalPoints: number;
  bestScore: number;
}

function computeStats(playerId: string): PlayerStats {
  const games = getGames().filter(g => g.status === 'finished' && g.playerIds.includes(playerId));
  let totalPoints = 0;
  let bestScore = 0;
  for (const g of games) {
    const pts = g.cumulativeScores[playerId] || 0;
    totalPoints += pts;
    if (pts > bestScore) bestScore = pts;
  }
  return {
    played: games.length,
    wins: games.filter(g => g.winnerIds?.includes(playerId)).length,
    totalPoints,
    bestScore,
  };
}

function PlayerItem({
  player, onDelete, onRename,
}: {
  player: Player;
  onDelete: () => void;
  onRename: (name: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(player.name);
  const inputRef = useRef<HTMLInputElement>(null);
  const stats = computeStats(player.id);

  function startEdit() {
    setDraft(player.name);
    setEditing(true);
    setTimeout(() => inputRef.current?.select(), 0);
  }

  function commit() {
    const trimmed = draft.trim();
    if (trimmed && trimmed !== player.name) onRename(trimmed);
    setEditing(false);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') commit();
    if (e.key === 'Escape') { setDraft(player.name); setEditing(false); }
  }

  const winRate = stats.played > 0 ? Math.round((stats.wins / stats.played) * 100) : 0;

  return (
    <div className="player-card">
      {/* Header */}
      <div className="player-card-header" style={{ background: avatarColor(editing ? draft || player.name : player.name) }}>
        <div className="player-card-avatar">
          {initials(editing ? draft || player.name : player.name)}
        </div>
        <div className="player-card-actions">
          {editing ? (
            <button className="btn-icon confirm" onClick={commit} title="Valider">✓</button>
          ) : (
            <button className="btn-icon" onClick={startEdit} title="Renommer" style={{ background: 'rgba(255,255,255,0.2)', border: '1.5px solid rgba(255,255,255,0.4)', color: 'white' }}>✏️</button>
          )}
          <button className="btn-icon danger" onClick={onDelete} title="Supprimer" style={{ background: 'rgba(255,255,255,0.2)', border: '1.5px solid rgba(255,255,255,0.4)' }}>🗑️</button>
        </div>
      </div>

      {/* Nom */}
      <div className="player-card-body">
        {editing ? (
          <input
            ref={inputRef}
            type="text"
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={onKeyDown}
            maxLength={30}
            autoFocus
            style={{ padding: '6px 10px', fontSize: '1rem', width: '100%', marginBottom: 8 }}
          />
        ) : (
          <div className="player-card-name">{player.name}</div>
        )}
        <div className="player-card-since">Depuis le {formatDate(player.createdAt)}</div>

        {/* Stats */}
        {stats.played > 0 ? (
          <div className="player-stats-grid">
            <div className="player-stat">
              <span className="player-stat-val">{stats.played}</span>
              <span className="player-stat-label">parties</span>
            </div>
            <div className="player-stat highlight">
              <span className="player-stat-val">🏆 {stats.wins}</span>
              <span className="player-stat-label">victoires</span>
            </div>
            <div className="player-stat">
              <span className="player-stat-val">{winRate}%</span>
              <span className="player-stat-label">win rate</span>
            </div>
            <div className="player-stat">
              <span className="player-stat-val">{stats.bestScore}</span>
              <span className="player-stat-label">record pts</span>
            </div>
          </div>
        ) : (
          <div className="player-card-no-stats">Aucune partie jouée</div>
        )}
      </div>
    </div>
  );
}

export default function Players() {
  const [players, setPlayers] = useState(getPlayers);
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) { setError('Entrez un nom'); return; }
    if (players.some(p => p.name.toLowerCase() === trimmed.toLowerCase())) {
      setError('Ce joueur existe déjà'); return;
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

  function handleRename(id: string, newName: string) {
    updatePlayerName(id, newName);
    setPlayers(getPlayers());
  }

  return (
    <div className="page">
      <div className="page-title">
        <h1>Joueurs</h1>
        <p>Stats et gestion des joueurs</p>
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
          {error && <p className="text-sm mt-8" style={{ color: 'var(--danger)' }}>{error}</p>}
        </form>
      </div>

      {players.length === 0 ? (
        <div className="empty-state">
          <div style={{ fontSize: '3rem' }}>👥</div>
          <p>Aucun joueur pour l'instant.<br />Ajoutez des joueurs pour commencer.</p>
        </div>
      ) : (
        <div className="players-grid">
          {players
            .map(p => ({ p, stats: computeStats(p.id) }))
            .sort((a, b) => b.stats.wins - a.stats.wins)
            .map(({ p }) => (
              <PlayerItem
                key={p.id}
                player={p}
                onDelete={() => handleDelete(p.id)}
                onRename={n => handleRename(p.id, n)}
              />
            ))}
        </div>
      )}
    </div>
  );
}
