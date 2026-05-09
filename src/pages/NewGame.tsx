import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPlayers, createGame } from '../storage';
import { avatarColor, initials } from '../utils';

const TARGET_PRESETS = [100, 150, 200, 250, 300];

export default function NewGame() {
  const navigate = useNavigate();
  const players = getPlayers();
  const [selected, setSelected] = useState<string[]>([]);
  const [target, setTarget] = useState(200);
  const [customTarget, setCustomTarget] = useState('');
  const [gameName, setGameName] = useState('');

  function togglePlayer(id: string) {
    setSelected(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]);
  }

  function handleStart() {
    if (selected.length < 2) return;
    const finalTarget = customTarget ? parseInt(customTarget) : target;
    if (!finalTarget || finalTarget < 10) return;
    const name = gameName.trim() || `Partie du ${new Date().toLocaleDateString('fr-FR')}`;
    const game = createGame(name, selected, finalTarget);
    navigate(`/game/${game.id}`);
  }

  const finalTarget = customTarget ? parseInt(customTarget) || 0 : target;

  return (
    <div className="page">
      <div className="page-title">
        <h1>Nouvelle partie</h1>
        <p>Choisissez les joueurs et le score à atteindre</p>
      </div>

      <div className="card mb-16">
        <div className="form-group">
          <label>Nom de la partie (optionnel)</label>
          <input
            type="text"
            placeholder={`Partie du ${new Date().toLocaleDateString('fr-FR')}`}
            value={gameName}
            onChange={e => setGameName(e.target.value)}
            maxLength={40}
          />
        </div>
      </div>

      <div className="card mb-16">
        <h2>Score à atteindre</h2>
        <div className="bonus-row mb-16">
          {TARGET_PRESETS.map(t => (
            <button
              key={t}
              className={`bonus-btn${!customTarget && target === t ? ' selected' : ''}`}
              onClick={() => { setTarget(t); setCustomTarget(''); }}
            >
              {t}
            </button>
          ))}
        </div>
        <div className="form-group">
          <label>Ou entrez un score personnalisé</label>
          <input
            type="number"
            placeholder="ex: 200"
            min={10}
            max={9999}
            value={customTarget}
            onChange={e => setCustomTarget(e.target.value)}
          />
        </div>
        <div className="target-indicator">
          🎯 Score à atteindre : <strong>{finalTarget} pts</strong>
        </div>
      </div>

      <div className="card mb-24">
        <h2>Joueurs ({selected.length} sélectionnés)</h2>
        {players.length === 0 ? (
          <p className="text-sm text-muted">
            Aucun joueur disponible.{' '}
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/players')}>
              Créer des joueurs →
            </button>
          </p>
        ) : (
          <div className="player-select-list">
            {players.map(p => (
              <div
                key={p.id}
                className={`player-select-item${selected.includes(p.id) ? ' selected' : ''}`}
                onClick={() => togglePlayer(p.id)}
              >
                <div className="player-avatar" style={{ background: avatarColor(p.name), width: 32, height: 32, fontSize: '0.8rem' }}>
                  {initials(p.name)}
                </div>
                <span className="player-name">{p.name}</span>
                <div className="checkmark">
                  {selected.includes(p.id) && '✓'}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <button
        className="btn btn-primary btn-lg"
        style={{ width: '100%' }}
        disabled={selected.length < 2 || !finalTarget}
        onClick={handleStart}
      >
        🎲 Démarrer la partie ({selected.length} joueurs)
      </button>
      {selected.length < 2 && (
        <p className="text-sm text-muted text-center mt-8">Sélectionnez au moins 2 joueurs</p>
      )}
    </div>
  );
}
