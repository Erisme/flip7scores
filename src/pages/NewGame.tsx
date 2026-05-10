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
    setSelected(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
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

      {/* Nom de la partie */}
      <div className="card mb-16">
        <label className="field-label">Nom de la partie (optionnel)</label>
        <input
          type="text"
          placeholder={`Partie du ${new Date().toLocaleDateString('fr-FR')}`}
          value={gameName}
          onChange={e => setGameName(e.target.value)}
          maxLength={40}
        />
      </div>

      {/* Score cible */}
      <div className="card mb-16">
        <h2>Score à atteindre</h2>
        <div className="target-presets">
          {TARGET_PRESETS.map(t => (
            <button
              key={t}
              className={`target-preset-btn${!customTarget && target === t ? ' selected' : ''}`}
              onClick={() => { setTarget(t); setCustomTarget(''); }}
            >
              {t}
            </button>
          ))}
        </div>
        <input
          type="number"
          placeholder="Score personnalisé…"
          min={10} max={9999}
          value={customTarget}
          onChange={e => setCustomTarget(e.target.value)}
          style={{ marginTop: 10 }}
        />
        <div className="target-indicator" style={{ marginTop: 12 }}>
          🎯 Score à atteindre : <strong>{finalTarget} pts</strong>
        </div>
      </div>

      {/* Sélection joueurs */}
      <div className="card mb-24">
        <h2>
          Joueurs
          {selected.length >= 2
            ? ` — ${selected.length} sélectionnés ✓`
            : ` — sélectionnez au moins 2`}
        </h2>

        {players.length === 0 ? (
          <p className="text-sm text-muted">
            Aucun joueur disponible.{' '}
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/players')}>
              Créer des joueurs →
            </button>
          </p>
        ) : (
          <div className="player-pick-grid">
            {players.map(p => {
              const isSelected = selected.includes(p.id);
              const order = selected.indexOf(p.id) + 1;
              return (
                <button
                  key={p.id}
                  className={`player-pick-card${isSelected ? ' selected' : ''}`}
                  onClick={() => togglePlayer(p.id)}
                >
                  <div className="player-pick-avatar" style={{ background: avatarColor(p.name) }}>
                    {initials(p.name)}
                    {isSelected && (
                      <span className="player-pick-order">{order}</span>
                    )}
                  </div>
                  <span className="player-pick-name">{p.name}</span>
                  {isSelected && <span className="player-pick-check">✓</span>}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <button
        className="btn btn-primary btn-lg"
        disabled={selected.length < 2 || !finalTarget}
        onClick={handleStart}
      >
        🎲 Démarrer ({selected.length} joueur{selected.length > 1 ? 's' : ''})
      </button>
    </div>
  );
}
