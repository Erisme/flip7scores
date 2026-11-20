import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import {
  getGame, updateGame, getPlayers, addPlayer, BONUS_CARD_VALUES, MINUS_CARD_VALUES,
  entryScore, scoreRound, gameVariant,
} from '../storage';
import type { Game, Player, PlayerRoundEntry, BonusCardValue } from '../types';
import { avatarColor, initials, formatPts } from '../utils';
import { useVariantTheme } from '../useVariantTheme';
import Flip7Celebration from '../components/Flip7Celebration';
import { ArrowLeft, ArrowRight, Bomb, Check, CheckCircle, Clover, Confetti, PencilSimple, Target, Trophy, UserPlus, X } from '@phosphor-icons/react';

const CLASSIC_NUMBER_CARDS   = Array.from({ length: 13 }, (_, i) => i); // 0..12
const VENGEANCE_NUMBER_CARDS = Array.from({ length: 14 }, (_, i) => i); // 0..13

type EntryDraft = Omit<PlayerRoundEntry, 'roundScore'>;

function initDraft(playerId: string): EntryDraft {
  return {
    playerId, numberCards: [], bonusCards: [], hasDouble: false, hasFlip7: false, busted: false,
    minusCards: [], hasHalve: false, hasLucky13: false,
  };
}

function PlayerEntry({
  player, draft, onChange, cumulative, target, game, opponents,
}: {
  player: Player;
  draft: EntryDraft;
  onChange: (d: EntryDraft) => void;
  cumulative: number;
  target: number;
  game: Game;
  opponents: Player[];
}) {
  const isVengeance = gameVariant(game) === 'vengeance';
  const brutal = isVengeance && !!game.brutal;
  const preview = entryScore(game, draft);
  const numberCards = isVengeance ? VENGEANCE_NUMBER_CARDS : CLASSIC_NUMBER_CARDS;
  const minusCards = draft.minusCards ?? [];

  function withCards(next: number[], extra: Partial<EntryDraft> = {}): EntryDraft {
    const hasFlip7 = next.length === 7;
    return { ...draft, ...extra, numberCards: next, hasFlip7, busted: false, flip7TargetId: hasFlip7 ? draft.flip7TargetId : undefined };
  }

  function toggleNumber(n: number) {
    if (draft.busted) return;
    const has = draft.numberCards.includes(n);
    if (has) {
      // Retirer un 13 retire aussi le Lucky 13 (les deux 13)
      const lucky = n === 13 ? { hasLucky13: false } : {};
      onChange(withCards(draft.numberCards.filter(x => x !== n), lucky));
    } else {
      onChange(withCards([...draft.numberCards, n]));
    }
  }

  function toggleLucky13() {
    if (draft.busted) return;
    const others = draft.numberCards.filter(x => x !== 13);
    onChange(draft.hasLucky13
      ? withCards([...others, 13], { hasLucky13: false })
      : withCards([...others, 13, 13], { hasLucky13: true }));
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

  function toggleMinus(v: number) {
    if (draft.busted && !brutal) return;
    const has = minusCards.includes(v);
    onChange({ ...draft, minusCards: has ? minusCards.filter(x => x !== v) : [...minusCards, v] });
  }

  function toggleHalve() {
    if (draft.busted) return;
    onChange({ ...draft, hasHalve: !draft.hasHalve });
  }

  function toggleBusted() {
    if (draft.busted) {
      onChange(initDraft(player.id));
    } else {
      // Mode Brutal : un joueur sauté peut encore recevoir des modificateurs
      onChange({ ...initDraft(player.id), busted: true, minusCards: brutal ? minusCards : [] });
    }
  }

  const statusClass = draft.busted ? 'busted' : draft.hasFlip7 ? 'flip7' : '';
  const totalIfRound = cumulative + preview;
  const thirteens = draft.numberCards.filter(n => n === 13).length;

  const minusRow = (
    <div>
      <div className="section-label">Modificateurs</div>
      <div className="bonus-row">
        {MINUS_CARD_VALUES.map(v => (
          <button
            key={v}
            className={`bonus-btn minus-btn${minusCards.includes(v) ? ' selected' : ''}`}
            onClick={() => toggleMinus(v)}
          >
            −{v}
          </button>
        ))}
        {!draft.busted && (
          <button
            className={`bonus-btn minus-btn${draft.hasHalve ? ' selected' : ''}`}
            onClick={toggleHalve}
          >
            ÷2
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className={`entry-card ${statusClass}`}>
      <div className="entry-header">
        <div className="player-avatar" style={{ background: avatarColor(player.name), width: 40, height: 40, fontSize: '0.95rem', border: '2.5px solid rgba(255,255,255,0.6)' }}>
          {initials(player.name)}
        </div>
        <span className="entry-player-name">{player.name}</span>
        {draft.hasFlip7 && <span className="badge badge-gold">FLIP 7 <Confetti /></span>}
        {draft.busted && <span className="badge badge-red">BUST <Bomb /></span>}
        <span className="cumulative">{cumulative} pts</span>
      </div>

      <div className="entry-body">
        {/* Status toggles */}
        <div className="toggle-row">
          <button
            className={`toggle-btn${draft.busted ? ' on-busted' : ''}`}
            onClick={toggleBusted}
          >
            <Bomb /> {draft.busted ? 'Annuler bust' : 'Bust (doublon)'}
          </button>
        </div>

        {draft.busted && brutal && (
          <>
            {minusRow}
            <div className="score-preview">
              <span className="text-muted text-sm">Score ce tour :</span>
              <span className={`score-val${preview < 0 ? ' score-negative' : ''}`}>{formatPts(preview)} pts</span>
            </div>
          </>
        )}

        {!draft.busted && (
          <>
            {/* Number cards */}
            <div>
              <div className="section-label">Cartes Numéro ({draft.numberCards.length}/7)</div>
              <div className="number-grid">
                {numberCards.map(n => (
                  <button
                    key={n}
                    className={`num-btn${draft.numberCards.includes(n) ? ' selected' : ''}`}
                    onClick={() => toggleNumber(n)}
                    title={isVengeance && n === 0 ? 'The Zero : score du tour à 0 sauf Flip 7' : undefined}
                  >
                    {n}
                    {isVengeance && n === 0 && <span className="num-tag">Zero</span>}
                    {n === 13 && thirteens === 2 && <span className="num-tag">×2</span>}
                  </button>
                ))}
              </div>
            </div>

            {isVengeance ? (
              <>
                {/* Cartes spéciales */}
                <div>
                  <div className="section-label">Carte spéciale</div>
                  <div className="bonus-row">
                    <button
                      className={`bonus-btn lucky-btn${draft.hasLucky13 ? ' selected' : ''}`}
                      onClick={toggleLucky13}
                      title="Lucky 13 : autorise un second 13 sans sauter"
                    >
                      <Clover /> Lucky 13 (deux 13)
                    </button>
                  </div>
                  {draft.numberCards.includes(0) && !draft.hasFlip7 && (
                    <p className="text-sm text-muted">The Zero : score du tour à 0 sauf Flip 7.</p>
                  )}
                </div>

                {minusRow}

                {/* Brutal : Flip 7 → +15 ou −15 à un adversaire */}
                {brutal && draft.hasFlip7 && (
                  <div>
                    <div className="section-label">Bonus Flip 7</div>
                    <select
                      value={draft.flip7TargetId ?? ''}
                      onChange={e => onChange({ ...draft, flip7TargetId: e.target.value || undefined })}
                    >
                      <option value="">+15 pour moi</option>
                      {opponents.map(o => (
                        <option key={o.id} value={o.id}>−15 à {o.name}</option>
                      ))}
                    </select>
                  </div>
                )}
              </>
            ) : (
              /* Bonus cards */
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
            )}

            {/* Score preview */}
            <div className="score-preview">
              <span className="text-muted text-sm">Score ce tour :</span>
              <span className={`score-val${preview < 0 ? ' score-negative' : ''}`}>{formatPts(preview)} pts</span>
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--muted)', textAlign: 'right' }}>
              Total si validé : {totalIfRound} / {target} pts
              {totalIfRound >= target && <> <Trophy weight="fill" color="var(--gold-dark)" /></>}
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
  const entries = scoreRound(game, drafts);
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
        <h2>{isGameOver ? <><Trophy weight="fill" /> Fin de partie !</> : <><CheckCircle /> Tour {game.rounds.length + 1} terminé</>}</h2>
        <div className="modal-score-list">
          {game.playerIds
            .slice()
            .sort((a, b) => newTotals[b] - newTotals[a])
            .map(id => {
              const player = players.find(p => p.id === id);
              const entry = entries.find(e => e.playerId === id);
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
                  {entry?.hasFlip7 && entry.flip7TargetId && (
                    <span className="text-sm text-muted">→ −15 à {players.find(p => p.id === entry.flip7TargetId)?.name}</span>
                  )}
                  <span className={`round-pts ml-auto${roundPts < 0 ? ' score-negative' : ''}`}>{formatPts(roundPts)}</span>
                  <span className="total-pts">= {newTotals[id]} pts</span>
                </div>
              );
            })}
        </div>
        {isGameOver ? (
          <button className="btn btn-success btn-lg" style={{ width: '100%' }} onClick={onNext}>
            Voir les résultats <Trophy weight="fill" />
          </button>
        ) : (
          <div className="flex gap-8">
            <button className="btn btn-secondary" onClick={onClose}><ArrowLeft /> Modifier</button>
            <button className="btn btn-primary" style={{ flex: 1 }} onClick={onNext}>
              Tour suivant <ArrowRight />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function AddPlayerModal({
  existingIds, onClose, onAdd,
}: {
  existingIds: string[];
  onClose: () => void;
  onAdd: (player: Player, initialScore: number) => void;
}) {
  const [available, setAvailable] = useState<Player[]>(() =>
    getPlayers().filter(p => !existingIds.includes(p.id))
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [scoreDraft, setScoreDraft] = useState('0');
  const [error, setError] = useState('');

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = newName.trim();
    if (!trimmed) { setError('Entrez un nom'); return; }
    if (getPlayers().some(p => p.name.toLowerCase() === trimmed.toLowerCase())) {
      setError('Ce joueur existe déjà'); return;
    }
    const player = addPlayer(trimmed);
    setAvailable(prev => [...prev, player]);
    setSelectedId(player.id);
    setNewName('');
    setError('');
  }

  function handleConfirm() {
    const player = available.find(p => p.id === selectedId);
    if (!player) return;
    const initialScore = Math.max(0, parseInt(scoreDraft) || 0);
    onAdd(player, initialScore);
  }

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2><UserPlus /> Ajouter un joueur</h2>

        {available.length > 0 ? (
          <div className="player-pick-grid mb-16">
            {available.map(p => {
              const isSelected = p.id === selectedId;
              return (
                <button
                  key={p.id}
                  className={`player-pick-card${isSelected ? ' selected' : ''}`}
                  onClick={() => setSelectedId(isSelected ? null : p.id)}
                >
                  <div className="player-pick-avatar" style={{ background: avatarColor(p.name) }}>
                    {initials(p.name)}
                  </div>
                  <span className="player-pick-name">{p.name}</span>
                  {isSelected && <span className="player-pick-check"><Check /></span>}
                </button>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-muted mb-16">Tous les joueurs existants sont déjà dans la partie.</p>
        )}

        <div className="field-label">Ou créer un nouveau joueur</div>
        <form onSubmit={handleCreate} className="mb-16">
          <div className="flex gap-8">
            <input
              type="text"
              placeholder="Nom du joueur"
              value={newName}
              onChange={e => { setNewName(e.target.value); setError(''); }}
              maxLength={30}
              style={{ flex: 1 }}
            />
            <button type="submit" className="btn btn-secondary">Créer</button>
          </div>
          {error && <p className="text-sm mt-8" style={{ color: 'var(--danger)' }}>{error}</p>}
        </form>

        <div className="field-label">Score initial</div>
        <input
          type="number"
          value={scoreDraft}
          onChange={e => setScoreDraft(e.target.value)}
          min={0} max={9999}
          className="mb-16"
          style={{ width: 100 }}
        />

        <div className="flex gap-8">
          <button className="btn btn-secondary" onClick={onClose}><ArrowLeft /> Annuler</button>
          <button
            className="btn btn-primary"
            style={{ flex: 1 }}
            disabled={!selectedId}
            onClick={handleConfirm}
          >
            Ajouter à la partie
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ActiveGame() {
  const { id } = useParams<{ id: string }>();
  const game = getGame(id!);
  if (!game) return <Navigate to="/" replace />;
  if (game.status === 'finished') return <Navigate to={`/history/${game.id}`} replace />;
  // key : repart d'un état neuf si on passe d'une partie à une autre
  return <GameScreen key={game.id} initialGame={game} />;
}

function GameScreen({ initialGame }: { initialGame: Game }) {
  const navigate = useNavigate();
  const [game, setGame] = useState<Game>(initialGame);
  const [players, setPlayers] = useState<Player[]>(
    () => getPlayers().filter(p => initialGame.playerIds.includes(p.id))
  );
  const [drafts, setDrafts] = useState<EntryDraft[]>(() => initialGame.playerIds.map(initDraft));
  const [showSummary, setShowSummary] = useState(false);
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [showRounds, setShowRounds] = useState(false);
  const [editingTarget, setEditingTarget] = useState(false);
  const [targetDraft, setTargetDraft] = useState('');
  const [celebration, setCelebration] = useState<string | null>(null);
  const closeCelebration = useCallback(() => setCelebration(null), []);

  // Précharge la vidéo du Flip 7 pour qu'elle s'affiche sans délai
  useEffect(() => { fetch('/flip7.mp4').catch(() => { /* hors ligne */ }); }, []);
  useVariantTheme(game.variant === 'vengeance');

  const maxScore = Math.max(...game.playerIds.map(id => game.cumulativeScores[id] || 0));

  function handleValidateRound() {
    setShowSummary(true);
  }

  function handleNextRound() {
    if (!game) return;
    const entries = scoreRound(game, drafts);
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
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  function handleAddPlayer(player: Player, initialScore: number) {
    if (!game) return;
    const updated: Game = {
      ...game,
      playerIds: [...game.playerIds, player.id],
      cumulativeScores: { ...game.cumulativeScores, [player.id]: initialScore },
    };
    updateGame(updated);
    setGame(updated);
    setPlayers(prev => [...prev, player]);
    // push explicite : drafts est couplé à playerIds par index
    setDrafts(prev => [...prev, initDraft(player.id)]);
    setShowAddPlayer(false);
  }

  function handleTargetSave() {
    const val = parseInt(targetDraft);
    if (game && val >= 10 && val <= 9999) {
      const updated = { ...game, targetScore: val };
      updateGame(updated);
      setGame(updated);
    }
    setEditingTarget(false);
    setTargetDraft('');
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
          <div className="flex-center gap-8" style={{ flexWrap: 'wrap' }}>
            {gameVariant(game) === 'vengeance' && <span className="badge badge-vengeance">Vengeance</span>}
            {game.brutal && <span className="badge badge-brutal">Brutal</span>}
            <span className="text-sm text-muted">Tour {game.rounds.length + 1}</span>
            <span className="text-sm text-muted">·</span>
            {editingTarget ? (
              <div className="flex-center gap-8">
                <input
                  type="number"
                  value={targetDraft}
                  onChange={e => setTargetDraft(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleTargetSave(); if (e.key === 'Escape') setEditingTarget(false); }}
                  min={10} max={9999}
                  autoFocus
                  style={{ width: 80, padding: '4px 8px', fontSize: '0.9rem' }}
                  placeholder={String(game.targetScore)}
                />
                <button className="btn-icon confirm" onClick={handleTargetSave} title="Valider"><Check /></button>
                <button className="btn-icon" onClick={() => setEditingTarget(false)} title="Annuler"><X /></button>
              </div>
            ) : (
              <button
                className="target-edit-btn"
                onClick={() => { setTargetDraft(String(game.targetScore)); setEditingTarget(true); }}
                title="Modifier l'objectif"
              >
                <Target /> {game.targetScore} pts <PencilSimple />
              </button>
            )}
          </div>
        </div>
        <button className="btn btn-ghost btn-sm ml-auto" onClick={handleAbandon} style={{ color: 'var(--red)' }}>
          Abandonner
        </button>
      </div>

      {/* Scoreboard */}
      <div className="scoreboard-container mb-16">
        <div className="scoreboard-toggle-bar">
          <span className="scoreboard-toggle-label">Détail des manches</span>
          <button
            className={`scoreboard-toggle-btn${showRounds ? ' active' : ''}`}
            onClick={() => setShowRounds(v => !v)}
          >
            {showRounds ? 'Masquer' : 'Afficher'}
          </button>
        </div>
        <table className="scoreboard">
          <thead>
            <tr>
              <th>Joueur</th>
              {showRounds && game.rounds.map((_, i) => <th key={i}>T{i + 1}</th>)}
              <th className="th-total">Score</th>
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
                const pct = Math.max(0, Math.min(100, (total / game.targetScore) * 100));
                return (
                  <tr key={pid} className={isLeader ? 'leader-row' : ''}>
                    <td className="player-col">
                      <div className="flex-center gap-8">
                        <div className="player-avatar" style={{ background: avatarColor(player.name), width: 32, height: 32, fontSize: '0.8rem', border: '2px solid var(--gold)' }}>
                          {initials(player.name)}
                        </div>
                        <div>
                          <div className={isLeader ? 'score-leader' : 'font-bold'}>{player.name}</div>
                          <div className="progress-bar-wrap" style={{ width: 72, margin: '4px 0 0' }}>
                            <div className="progress-bar-fill" style={{ width: `${pct}%`, background: avatarColor(player.name) }} />
                          </div>
                        </div>
                      </div>
                    </td>
                    {showRounds && game.rounds.map((round) => {
                      const e = round.entries.find(e => e.playerId === pid);
                      return (
                        <td key={round.id} className={e?.busted ? 'score-bust' : 'round-score-cell'}>
                          {e?.busted && <Bomb />}{e?.busted && !e.roundScore ? '' : formatPts(e?.roundScore ?? 0)}
                        </td>
                      );
                    })}
                    <td className={`score-total-cell${isLeader ? ' score-leader' : ''}`}>{total}</td>
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
              onChange={d => {
                if (d.hasFlip7 && !drafts[i]?.hasFlip7) setCelebration(player.name);
                setDrafts(prev => prev.map((x, j) => j === i ? d : x));
              }}
              cumulative={game.cumulativeScores[pid] || 0}
              target={game.targetScore}
              game={game}
              opponents={players.filter(p => p.id !== pid)}
            />
          );
        })}
      </div>

      <button
        className="btn btn-ghost mt-16"
        style={{ width: '100%' }}
        onClick={() => setShowAddPlayer(true)}
      >
        <UserPlus /> Ajouter un joueur
      </button>

      <button
        className="btn btn-success btn-lg mt-24"
        style={{ width: '100%' }}
        onClick={handleValidateRound}
      >
        <CheckCircle /> Valider le tour {game.rounds.length + 1}
      </button>

      {showAddPlayer && (
        <AddPlayerModal
          existingIds={game.playerIds}
          onClose={() => setShowAddPlayer(false)}
          onAdd={handleAddPlayer}
        />
      )}

      {celebration && (
        <Flip7Celebration
          playerName={celebration}
          bonusLabel={game.brutal ? '+15 ou −15 à un adversaire' : '+15 points'}
          onDone={closeCelebration}
        />
      )}

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
