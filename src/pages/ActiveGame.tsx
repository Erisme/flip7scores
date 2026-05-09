import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getGame, updateGame, calculateRoundScore, getPlayers, BONUS_CARD_VALUES } from '../storage';
import type { Game, Player, PlayerRoundEntry, BonusCardValue } from '../types';
import { avatarColor, initials } from '../utils';

const NUMBER_CARDS = Array.from({ length: 13 }, (_, i) => i); // 0..12

type EntryDraft = Omit<PlayerRoundEntry, 'roundScore'>;

function initDraft(playerId: string): EntryDraft {
  return { playerId, numberCards: [], bonusCards: [], hasDouble: false, hasFlip7: false, busted: false };
}

function PlayerEntry({
  player, draft, onChange, cumulative, target,
}: {
  player: Player;
  draft: EntryDraft;
  onChange: (d: EntryDraft) => void;
  cumulative: number;
  target: number;
}) {
  const preview = calculateRoundScore({ ...draft, roundScore: 0 });

  function toggleNumber(n: number) {
    if (draft.busted) return;
    const has = draft.numberCards.includes(n);
    const next = has ? draft.numberCards.filter(x => x !== n) : [...draft.numberCards, n];
    const hasFlip7 = next.length === 7;
    onChange({ ...draft, numberCards: next, hasFlip7, busted: false });
  }

  function toggleBonus(v: BonusCardValue) {
    if (draft.busted) return;
    const has = draft.bonusCards.includes(v);
    onChange({ ...draft, bonusCards: has ? draft.bonusCards.filter(x => x !== v) : [...draft.bonusCards, v] });
  }

  function toggleDouble() {
    if (draft.busted) return;
    onChange({ ...draft, hasDouble: !draft.hasDouble });
  }

  function toggleBusted() {
    if (draft.busted) {
      onChange(initDraft(player.id));
    } else {
      onChange({ ...initDraft(player.id), busted: true });
    }
  }

  const statusClass = draft.busted ? 'busted' : draft.hasFlip7 ? 'flip7' : '';
  const totalIfRound = cumulative + preview;

  return (
    <div className={`entry-card ${statusClass}`}>
      <div className="entry-header">
        <div className="player-avatar" style={{ background: avatarColor(player.name), width: 32, height: 32, fontSize: '0.8rem' }}>
          {initials(player.name)}
        </div>
        <span className="font-bold">{player.name}</span>
        {draft.hasFlip7 && <span className="badge badge-gold">FLIP 7 🎉</span>}
        {draft.busted && <span className="badge badge-red">BUST 💥</span>}
        <span className="cumulative">{cumulative} pts</span>
      </div>

      <div className="entry-body">
        {/* Status toggles */}
        <div className="toggle-row">
          <button
            className={`toggle-btn${draft.busted ? ' on-busted' : ''}`}
            onClick={toggleBusted}
          >
            💥 {draft.busted ? 'Annuler bust' : 'Bust (doublon)'}
          </button>
        </div>

        {!draft.busted && (
          <>
            {/* Number cards */}
            <div>
              <div className="section-label">Cartes Numéro ({draft.numberCards.length}/7)</div>
              <div className="number-grid">
                {NUMBER_CARDS.map(n => (
                  <button
                    key={n}
                    className={`num-btn${draft.numberCards.includes(n) ? ' selected' : ''}`}
                    onClick={() => toggleNumber(n)}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            {/* Bonus cards */}
            <div>
              <div className="section-label">Cartes Bonus</div>
              <div className="bonus-row">
                {BONUS_CARD_VALUES.map(v => (
                  <button
                    key={v}
                    className={`bonus-btn${draft.bonusCards.includes(v) ? ' selected' : ''}`}
                    onClick={() => toggleBonus(v)}
                  >
                    +{v}
                  </button>
                ))}
                <button
                  className={`bonus-btn double-btn${draft.hasDouble ? ' selected' : ''}`}
                  onClick={toggleDouble}
                >
                  ×2
                </button>
              </div>
            </div>

            {/* Score preview */}
            <div className="score-preview">
              <span className="text-muted text-sm">Score ce tour :</span>
              <span className="score-val">{preview} pts</span>
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--muted)', textAlign: 'right' }}>
              Total si validé : {totalIfRound} / {target} pts
              {totalIfRound >= target && ' 🏆'}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function RoundSummaryModal({
  game, players, drafts, onClose, onNext,
}: {
  game: Game;
  players: Player[];
  drafts: EntryDraft[];
  onClose: () => void;
  onNext: () => void;
}) {
  const entries = drafts.map(d => ({ ...d, roundScore: calculateRoundScore(d) }));
  const newTotals = Object.fromEntries(
    game.playerIds.map(id => {
      const e = entries.find(x => x.playerId === id);
      return [id, (game.cumulativeScores[id] || 0) + (e?.roundScore || 0)];
    })
  );
  const maxScore = Math.max(...Object.values(newTotals));
  const winners = game.playerIds.filter(id => newTotals[id] >= game.targetScore);
  const isGameOver = winners.length > 0;

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2>{isGameOver ? '🏆 Fin de partie !' : `✅ Tour ${game.rounds.length + 1} terminé`}</h2>
        <div className="modal-score-list">
          {game.playerIds
            .slice()
            .sort((a, b) => newTotals[b] - newTotals[a])
            .map(id => {
              const player = players.find(p => p.id === id);
              const entry = entries.find(e => e.playerId === id);
              const prev = game.cumulativeScores[id] || 0;
              const roundPts = entry?.roundScore || 0;
              const isLeader = newTotals[id] === maxScore;
              return (
                <div key={id} className="modal-score-row">
                  <div className="player-avatar" style={{ background: avatarColor(player!.name), width: 28, height: 28, fontSize: '0.75rem' }}>
                    {initials(player!.name)}
                  </div>
                  <span className={isLeader ? 'score-leader' : ''}>{player!.name}</span>
                  {entry?.busted && <span className="badge badge-red">BUST</span>}
                  {entry?.hasFlip7 && <span className="badge badge-gold">FLIP 7</span>}
                  <span className="round-pts ml-auto">+{roundPts}</span>
                  <span className="total-pts">= {newTotals[id]} pts</span>
                </div>
              );
            })}
        </div>
        {isGameOver ? (
          <button className="btn btn-success btn-lg" style={{ width: '100%' }} onClick={onNext}>
            Voir les résultats 🏆
          </button>
        ) : (
          <div className="flex gap-8">
            <button className="btn btn-secondary" onClick={onClose}>← Modifier</button>
            <button className="btn btn-primary" style={{ flex: 1 }} onClick={onNext}>
              Tour suivant →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ActiveGame() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [game, setGame] = useState<Game | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [drafts, setDrafts] = useState<EntryDraft[]>([]);
  const [showSummary, setShowSummary] = useState(false);

  useEffect(() => {
    const g = getGame(id!);
    if (!g) { navigate('/'); return; }
    if (g.status === 'finished') { navigate(`/history/${g.id}`); return; }
    const allPlayers = getPlayers();
    setGame(g);
    setPlayers(allPlayers.filter(p => g.playerIds.includes(p.id)));
    setDrafts(g.playerIds.map(initDraft));
  }, [id, navigate]);

  if (!game) return null;

  const maxScore = Math.max(...game.playerIds.map(id => game.cumulativeScores[id] || 0));

  function handleValidateRound() {
    setShowSummary(true);
  }

  function handleNextRound() {
    if (!game) return;
    const entries = drafts.map(d => ({ ...d, roundScore: calculateRoundScore(d) }));
    const newCumulative = { ...game.cumulativeScores };
    entries.forEach(e => { newCumulative[e.playerId] = (newCumulative[e.playerId] || 0) + e.roundScore; });

    const round = { id: crypto.randomUUID(), roundNumber: game.rounds.length + 1, entries };
    const winners = game.playerIds.filter(id => newCumulative[id] >= game.targetScore);

    const updatedGame: Game = {
      ...game,
      rounds: [...game.rounds, round],
      cumulativeScores: newCumulative,
      status: winners.length > 0 ? 'finished' : 'active',
      winnerIds: winners.length > 0
        ? game.playerIds.filter(id => newCumulative[id] === Math.max(...Object.values(newCumulative)))
        : undefined,
      finishedAt: winners.length > 0 ? Date.now() : undefined,
    };

    updateGame(updatedGame);
    setGame(updatedGame);
    setDrafts(game.playerIds.map(initDraft));
    setShowSummary(false);

    if (updatedGame.status === 'finished') {
      navigate(`/history/${updatedGame.id}`);
    }
  }

  function handleAbandon() {
    if (!confirm('Abandonner cette partie ? Elle sera marquée comme terminée.')) return;
    const entries = drafts.map(d => ({ ...d, roundScore: 0 }));
    const round = { id: crypto.randomUUID(), roundNumber: game!.rounds.length + 1, entries };
    const maxCumul = Math.max(...Object.values(game!.cumulativeScores));
    const winnerIds = game!.playerIds.filter(id => (game!.cumulativeScores[id] || 0) === maxCumul);
    const updated: Game = {
      ...game!,
      rounds: game!.rounds.length === 0 ? [] : [...game!.rounds, round],
      status: 'finished',
      winnerIds,
      finishedAt: Date.now(),
    };
    updateGame(updated);
    navigate(`/history/${updated.id}`);
  }

  return (
    <div className="page">
      <div className="flex-center gap-8 mb-16">
        <div>
          <h1 style={{ marginBottom: 2 }}>{game.name}</h1>
          <div className="text-sm text-muted">Tour {game.rounds.length + 1} · Objectif : {game.targetScore} pts</div>
        </div>
        <button className="btn btn-ghost btn-sm ml-auto" onClick={handleAbandon} style={{ color: 'var(--red)' }}>
          Abandonner
        </button>
      </div>

      {/* Scoreboard */}
      <div className="card mb-16" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="scoreboard">
          <thead>
            <tr>
              <th style={{ textAlign: 'left' }}>Joueur</th>
              {game.rounds.map((_, i) => <th key={i}>T{i + 1}</th>)}
              <th>Total</th>
              <th>Restant</th>
            </tr>
          </thead>
          <tbody>
            {game.playerIds
              .slice()
              .sort((a, b) => (game.cumulativeScores[b] || 0) - (game.cumulativeScores[a] || 0))
              .map(pid => {
                const player = players.find(p => p.id === pid);
                if (!player) return null;
                const total = game.cumulativeScores[pid] || 0;
                const isLeader = total === maxScore && maxScore > 0;
                const remaining = Math.max(0, game.targetScore - total);
                const pct = Math.min(100, (total / game.targetScore) * 100);
                return (
                  <tr key={pid}>
                    <td className="player-col">
                      <div className="flex-center gap-8">
                        <div className="player-avatar" style={{ background: avatarColor(player.name), width: 28, height: 28, fontSize: '0.75rem' }}>
                          {initials(player.name)}
                        </div>
                        <div>
                          <div className={isLeader ? 'score-leader' : ''}>{player.name}</div>
                          <div className="progress-bar-wrap mt-8" style={{ width: 80 }}>
                            <div className="progress-bar-fill" style={{ width: `${pct}%`, background: avatarColor(player.name) }} />
                          </div>
                        </div>
                      </div>
                    </td>
                    {game.rounds.map((round) => {
                      const e = round.entries.find(e => e.playerId === pid);
                      return (
                        <td key={round.id} style={{ color: e?.busted ? 'var(--red)' : 'inherit' }}>
                          {e?.busted ? '💥' : `+${e?.roundScore ?? 0}`}
                        </td>
                      );
                    })}
                    <td className={isLeader ? 'score-leader' : ''}>{total}</td>
                    <td className="text-muted">{remaining}</td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>

      {/* Round input */}
      <h2>Tour {game.rounds.length + 1}</h2>
      <div className="round-entries">
        {game.playerIds.map((pid, i) => {
          const player = players.find(p => p.id === pid);
          if (!player) return null;
          return (
            <PlayerEntry
              key={pid}
              player={player}
              draft={drafts[i] || initDraft(pid)}
              onChange={d => setDrafts(prev => prev.map((x, j) => j === i ? d : x))}
              cumulative={game.cumulativeScores[pid] || 0}
              target={game.targetScore}
            />
          );
        })}
      </div>

      <button
        className="btn btn-success btn-lg mt-24"
        style={{ width: '100%' }}
        onClick={handleValidateRound}
      >
        ✅ Valider le tour {game.rounds.length + 1}
      </button>

      {showSummary && (
        <RoundSummaryModal
          game={game}
          players={players}
          drafts={drafts}
          onClose={() => setShowSummary(false)}
          onNext={handleNextRound}
        />
      )}
    </div>
  );
}
