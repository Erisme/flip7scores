import { useParams, useNavigate } from 'react-router-dom';
import { getGame, getPlayers, gameVariant } from '../storage';
import { avatarColor, initials, formatDate, formatTime, formatPts } from '../utils';
import { useVariantTheme } from '../useVariantTheme';
import { ArrowLeft, Bomb, Clover, DiceFive, Star, Trophy } from '@phosphor-icons/react';

export default function GameDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const game = getGame(id!);
  const allPlayers = getPlayers();
  useVariantTheme(game?.variant === 'vengeance');

  if (!game) {
    return (
      <div className="page">
        <p className="text-muted">Partie introuvable.</p>
        <button className="btn btn-secondary mt-16" onClick={() => navigate('/history')}><ArrowLeft /> Retour</button>
      </div>
    );
  }

  const players = game.playerIds.map(pid => allPlayers.find(p => p.id === pid)).filter(Boolean);
  const sorted = [...game.playerIds].sort((a, b) => (game.cumulativeScores[b] || 0) - (game.cumulativeScores[a] || 0));
  const maxScore = Math.max(...Object.values(game.cumulativeScores));
  const winnerIds = game.winnerIds || [];

  return (
    <div className="page">
      <button className="btn btn-ghost btn-sm mb-16" onClick={() => navigate('/history')}><ArrowLeft /> Historique</button>

      <div className="page-title">
        <h1>{game.name}</h1>
        {gameVariant(game) === 'vengeance' && (
          <div className="flex gap-8">
            <span className="badge badge-vengeance">Vengeance</span>
            {game.brutal && <span className="badge badge-brutal">Brutal</span>}
          </div>
        )}
        <p>{formatDate(game.startedAt)} à {formatTime(game.startedAt)} · {game.rounds.length} tours · Objectif {game.targetScore} pts</p>
      </div>

      {/* Winners */}
      {winnerIds.length > 0 && (
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ marginBottom: 8, color: 'var(--gold-dark)' }}><Trophy size={44} weight="fill" /></div>
          <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--accent2)' }}>
            {winnerIds.map(id => allPlayers.find(p => p.id === id)?.name).filter(Boolean).join(' & ')}
          </div>
          <div className="text-sm text-muted mt-8">{maxScore} points</div>
        </div>
      )}

      {/* Scoreboard */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
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
              const pct = Math.max(0, Math.min(100, (total / game.targetScore) * 100));
              return (
                <tr key={pid}>
                  <td className="player-col">
                    <div className="flex-center gap-8">
                      <div className="player-avatar" style={{ background: avatarColor(player!.name), width: 28, height: 28, fontSize: '0.75rem' }}>
                        {initials(player!.name)}
                      </div>
                      <div>
                        <div className={isWinner ? 'score-leader' : ''}>
                          {isWinner && <><Trophy weight="fill" /> </>}{player!.name}
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
                        {e?.busted && <Bomb />}{e?.busted && !e.roundScore ? '0' : formatPts(e?.roundScore ?? 0)}
                        {e?.hasFlip7 && <> <Star weight="fill" color="var(--purple)" /></>}
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
        <div key={round.id} className="card">
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
                        {(!entry.busted || (entry.minusCards?.length ?? 0) > 0) && (
                          <div className="text-sm text-muted">
                            {!entry.busted && <>Cartes: {entry.numberCards.join(', ') || '–'}</>}
                            {entry.hasLucky13 && <> · <Clover /> Lucky 13</>}
                            {entry.hasDouble ? ' · ×2' : ''}
                            {entry.bonusCards.length > 0 ? ` · Bonus: ${entry.bonusCards.map(v => '+' + v).join(' ')}` : ''}
                            {(entry.minusCards?.length || entry.hasHalve)
                              ? ` · Modifs: ${[...(entry.minusCards ?? []).map(v => '−' + v), ...(entry.hasHalve ? ['÷2'] : [])].join(' ')}`
                              : ''}
                            {entry.hasFlip7 && <> · FLIP 7 <Star weight="fill" color="var(--purple)" /></>}
                            {entry.hasFlip7 && entry.flip7TargetId
                              ? ` → −15 à ${allPlayers.find(p => p.id === entry.flip7TargetId)?.name ?? '?'}`
                              : ''}
                          </div>
                        )}
                      </div>
                    </div>
                    <div>
                      {entry.busted && <span className="badge badge-red">BUST <Bomb /></span>}
                      {(!entry.busted || entry.roundScore !== 0) && (
                        <span className="font-bold" style={{ color: entry.roundScore < 0 ? 'var(--danger)' : 'var(--accent2)', marginLeft: 8 }}>
                          {formatPts(entry.roundScore)}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      ))}

      <button className="btn btn-primary btn-lg mt-24" style={{ width: '100%' }} onClick={() => navigate('/new-game')}>
        <DiceFive /> Nouvelle partie
      </button>
    </div>
  );
}
