import type { Player, Game, GameVariant, PlayerRoundEntry, BonusCardValue } from './types';

const PLAYERS_KEY = 'flip7_players';
const GAMES_KEY   = 'flip7_games';
const API         = '/api';

// ── localStorage ─────────────────────────────────────────────────────────────
export function getPlayers(): Player[] {
  try   { return JSON.parse(localStorage.getItem(PLAYERS_KEY) || '[]'); }
  catch { return []; }
}
export function savePlayers(players: Player[]): void {
  localStorage.setItem(PLAYERS_KEY, JSON.stringify(players));
  pushToServer();
}

export function getGames(): Game[] {
  try   { return JSON.parse(localStorage.getItem(GAMES_KEY) || '[]'); }
  catch { return []; }
}
export function saveGames(games: Game[]): void {
  localStorage.setItem(GAMES_KEY, JSON.stringify(games));
  pushToServer();
}

// ── Sync NAS ──────────────────────────────────────────────────────────────────

/** Appelé au démarrage : récupère les données du NAS et écrase le localStorage */
export async function syncFromServer(): Promise<void> {
  try {
    const res = await fetch(`${API}/data`);
    if (!res.ok) return;
    const data = await res.json();
    if (Array.isArray(data.players)) localStorage.setItem(PLAYERS_KEY, JSON.stringify(data.players));
    if (Array.isArray(data.games))   localStorage.setItem(GAMES_KEY,   JSON.stringify(data.games));
  } catch {
    // API inaccessible (hors ligne) → on garde le localStorage existant
  }
}

/** Appelé après chaque écriture : pousse vers le NAS en arrière-plan */
function pushToServer(): void {
  fetch(`${API}/data`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ players: getPlayers(), games: getGames() }),
  }).catch(() => { /* silencieux si hors ligne */ });
}

// ── Joueurs ───────────────────────────────────────────────────────────────────
export function addPlayer(name: string): Player {
  const players = getPlayers();
  const player: Player = { id: crypto.randomUUID(), name: name.trim(), createdAt: Date.now() };
  players.push(player);
  savePlayers(players);
  return player;
}

export function deletePlayer(id: string): void {
  savePlayers(getPlayers().filter(p => p.id !== id));
}

export function updatePlayerName(id: string, name: string): void {
  savePlayers(getPlayers().map(p => p.id === id ? { ...p, name: name.trim() } : p));
}

// ── Parties ───────────────────────────────────────────────────────────────────
export function getGame(id: string): Game | undefined {
  return getGames().find(g => g.id === id);
}

export function getActiveGame(): Game | undefined {
  return getGames().find(g => g.status === 'active');
}

export function createGame(
  name: string,
  playerIds: string[],
  targetScore: number,
  variant: GameVariant = 'classic',
  brutal = false,
): Game {
  const game: Game = {
    id: crypto.randomUUID(),
    name,
    playerIds,
    targetScore,
    variant,
    brutal: variant === 'vengeance' ? brutal : false,
    rounds: [],
    cumulativeScores: Object.fromEntries(playerIds.map(id => [id, 0])),
    status: 'active',
    startedAt: Date.now(),
  };
  saveGames([...getGames(), game]);
  return game;
}

export function updateGame(game: Game): void {
  saveGames(getGames().map(g => g.id === game.id ? game : g));
}

export function deleteGame(id: string): void {
  saveGames(getGames().filter(g => g.id !== id));
}

// ── Score ─────────────────────────────────────────────────────────────────────
export const BONUS_CARD_VALUES: BonusCardValue[] = [2, 4, 6, 8, 10];

export const MINUS_CARD_VALUES = [2, 4, 6, 8, 10];

export function gameVariant(game: Pick<Game, 'variant'>): GameVariant {
  return game.variant ?? 'classic';
}

export function calculateRoundScore(entry: Omit<PlayerRoundEntry, 'roundScore'>): number {
  if (entry.busted) return 0;
  const numTotal   = entry.numberCards.reduce((s, n) => s + n, 0);
  const bonusTotal = entry.bonusCards.reduce((s, v) => s + v, 0);
  // ×2 ne double que les cartes Numéro ; bonus et +15 (Flip 7) s'ajoutent après
  return numTotal * (entry.hasDouble ? 2 : 1) + bonusTotal + (entry.hasFlip7 ? 15 : 0);
}

/**
 * Score Vengeance (règles officielles) :
 * 1. somme des Numéros (The Zero ⇒ 0 sauf Flip 7)
 * 2. ÷2 arrondi à l'inférieur
 * 3. soustraction des modificateurs (plancher 0, sauf mode Brutal)
 * 4. +15 si Flip 7 (sauf si Brutal et −15 donné à un autre joueur)
 * N'inclut pas les −15 reçus d'un autre joueur : voir scoreRound.
 */
export function calculateVengeanceScore(entry: Omit<PlayerRoundEntry, 'roundScore'>, brutal: boolean): number {
  const minusTotal = (entry.minusCards ?? []).reduce((s, v) => s + v, 0);
  if (entry.busted) return brutal ? -minusTotal : 0;
  let score = entry.numberCards.reduce((s, n) => s + n, 0);
  if (entry.numberCards.includes(0) && !entry.hasFlip7) score = 0;
  if (entry.hasHalve) score = Math.floor(score / 2);
  score -= minusTotal;
  if (!brutal) score = Math.max(0, score);
  if (entry.hasFlip7 && !(brutal && entry.flip7TargetId)) score += 15;
  return score;
}

/** Score d'un joueur hors effets reçus des autres joueurs (aperçu de saisie) */
export function entryScore(game: Pick<Game, 'variant' | 'brutal'>, entry: Omit<PlayerRoundEntry, 'roundScore'>): number {
  return gameVariant(game) === 'vengeance'
    ? calculateVengeanceScore(entry, !!game.brutal)
    : calculateRoundScore(entry);
}

/** Calcule les scores finaux d'un tour, y compris les −15 « Flip 7 Brutal » */
export function scoreRound(game: Pick<Game, 'variant' | 'brutal'>, drafts: Omit<PlayerRoundEntry, 'roundScore'>[]): PlayerRoundEntry[] {
  const entries = drafts.map(d => ({ ...d, roundScore: entryScore(game, d) }));
  if (gameVariant(game) === 'vengeance' && game.brutal) {
    for (const e of entries) {
      if (!e.hasFlip7 || e.busted || !e.flip7TargetId) continue;
      const target = entries.find(t => t.playerId === e.flip7TargetId);
      if (target) target.roundScore -= 15;
    }
  }
  return entries;
}
