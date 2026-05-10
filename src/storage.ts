import type { Player, Game, PlayerRoundEntry, BonusCardValue } from './types';

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

export function createGame(name: string, playerIds: string[], targetScore: number): Game {
  const game: Game = {
    id: crypto.randomUUID(),
    name,
    playerIds,
    targetScore,
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

export function calculateRoundScore(entry: Omit<PlayerRoundEntry, 'roundScore'>): number {
  if (entry.busted) return 0;
  const numTotal   = entry.numberCards.reduce((s, n) => s + n, 0);
  const bonusTotal = entry.bonusCards.reduce((s, v) => s + v, 0);
  const base = numTotal + bonusTotal;
  return entry.hasDouble ? base * 2 : base;
}
