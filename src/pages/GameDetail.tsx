import { useParams, useNavigate } from 'react-router-dom';
import { getGame, getPlayers } from '../storage';
import { avatarColor, initials, formatDate, formatTime } from '../utils';

export default function GameDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const game = getGame(id!);
  const allPlayers = getPlayers();

  if (!game) {
    return (
      <div className="page">
        <p className="text-muted">Partie introuvable.</p>
        <button className="btn btn-secondary mt-16" onClick={() => navigate('/history')}>← Retour</button>
      </div>
    );
  }

  const players = game.playerIds.map(pid => allPlayers.find(p => p.id === pid)).filter(Boolean);
  const sorted = [...game.playerIds].sort((a, b) => (game.cumulativeScores[b] || 0) - (game.cumulativeScores[a] || 0));
  const maxScore = Math.max(...Object.values(game.cumulativeScores));
  const winnerIds = game.winnerIds || [];

  return (
    <div className="page">
      <button className="btn btn-ghost btn-sm mb-16" onClick={() => navigate('/history')}>← Historique</button>

      <div className="page-title">
        <h1>{game.name}</h1>
        <p>{formatDate(game.startedAt)} à {formatTime(game.startedAt)} · {game.rounds.length} tours · Objectif {game.targetScore} pts</p>
      </div>

      {/* Winners */}
      {winnerIds.length > 0 && (
        <div className="card mb-16" style={{ borderColor: 'rgba(245,166,35,0.4)', background: 'rgba(245,166,35,0.08)', textAlign: 'center', padding: '24px 16px' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 8 }}>🏆</div>
          <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--accent2)' }}>
            {winnerIds.map(id => allPlayers.find(p => p.id === id)?.name).filter(Boolean).join(' & ')}
          </div>
          <div className="text-sm text-muted mt-8">{maxScore} points</div>
        </div>
      )}

      {/* Scoreboard */}
      <div className="card mb-16" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="scoreboard">
          <thead>
            <tr>
              <th style={{ textAlign: 'left' }}>Joueur</th>
              {game.rounds.map((_, i) => <th key={i}>T{i + 1}</th>)}
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map(pid => {
              const player = players.find(p => p!.id === pid);
              if (!player) return null;
              const total = game.cumulativeScores[pid] || 0;
              const isWinner = winnerIds.includes(pid);
              const pct = Math.min(100, (total / game.targetScore) * 100);
              return (
                <tr key={pid}>
                  <td className="player-col">
                    <div className="flex-center gap-8">
                      <div className="player-avatar" style={{ background: avatarColor(player!.name), width: 28, height: 28, fontSize: '0.75rem' }}>
                        {initials(player!.name)}
                      </div>
                      <div>
                        <div className={isWinner ? 'score-leader' : ''}>
                          {isWinner ? '🏆 ' : ''}{player!.name}
                        </div>
                        <div className="progress-bar-wrap mt-8" style={{ width: 80 }}>
                          <div className="progress-bar-fill" style={{ width: `${pct}%`, background: avatarColor(player!.name) }} />
                        </div>
                      </div>
                    </div>
                  </td>
                  {game.rounds.map(round => {
                    const e = round.entries.find(e => e.playerId === pid);
                    return (
                      <td key={round.id} style={{ color: e?.busted ? 'var(--red)' : 'inherit' }}>
                        {e?.busted ? '💥0' : `+${e?.roundScore ?? 0}`}
                        {e?.hasFlip7 ? ' ⭐' : ''}
                      </td>
                    );
                  })}
                  <td className={isWinner ? 'score-leader' : 'font-bold'}>{total}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Round details */}
      <h2>Détail des tours</h2>
      {game.rounds.map(round => (
        <div key={round.id} className="card mb-8">
          <h3 className="mb-8">Tour {round.roundNumber}</h3>
          <div className="player-list">
            {round.entries
              .slice()
              .sort((a, b) => b.roundScore - a.roundScore)
              .map(entry => {
                const player = players.find(p => p!.id === entry.playerId);
                if (!player) return null;
                return (
                  <div key={entry.playerId} className="player-item" style={{ padding: '8px 12px' }}>
                    <div className="flex-center gap-8">
                      <div className="player-avatar" style={{ background: avatarColor(player!.name), width: 28, height: 28, fontSize: '0.75rem' }}>
                        {initials(player!.name)}
                      </div>
                      <div>
                        <div className="player-name">{player!.name}</div>
                        {!entry.busted && (
                          <div className="text-sm text-muted">
                            Cartes: {entry.numberCards.join(', ') || '–'}
                            {entry.hasDouble ? ' · ×2' : ''}
                            {entry.bonusCards.length > 0 ? ` · Bonus: ${entry.bonusCards.map(v => '+' + v).join(' ')}` : ''}
                            {entry.hasFlip7 ? ' · FLIP 7 ⭐' : ''}
                          </div>
                        )}
                      </div>
                    </div>
                    <div>
                      {entry.busted
                        ? <span className="badge badge-red">BUST 💥</span>
                        : <span className="font-bold" style={{ color: 'var(--accent2)' }}>+{entry.roundScore}</span>
                      }
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      ))}

      <button className="btn btn-primary btn-lg mt-16" style={{ width: '100%' }} onClick={() => navigate('/new-game')}>
        🎲 Nouvelle partie
      </button>
    </div>
  );
}
