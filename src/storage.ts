import type { Player, Game, PlayerRoundEntry, BonusCardValue } from './types';

const PLAYERS_KEY = 'flip7_players';
const GAMES_KEY = 'flip7_games';

export function getPlayers(): Player[] {
  try {
    return JSON.parse(localStorage.getItem(PLAYERS_KEY) || '[]');
  } catch {
    return [];
  }
}

export function savePlayers(players: Player[]): void {
  localStorage.setItem(PLAYERS_KEY, JSON.stringify(players));
}

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

export function getGames(): Game[] {
  try {
    return JSON.parse(localStorage.getItem(GAMES_KEY) || '[]');
  } catch {
    return [];
  }
}

export function saveGames(games: Game[]): void {
  localStorage.setItem(GAMES_KEY, JSON.stringify(games));
}

export function getGame(id: string): Game | undefined {
  return getGames().find(g => g.id === id);
}

export function createGame(name: string, playerIds: string[], targetScore: number): Game {
  const games = getGames();
  const game: Game = {
    id: crypto.randomUUID(),
    name,
    playerIds,
    targetScore,
    rounds: [],
    cumulativeScores: Object.fromEntries(playerIds.map(id => [id, 0])),
    startedAt: Date.now(),
    status: 'active',
  };
  games.push(game);
  saveGames(games);
  return game;
}

export function updateGame(game: Game): void {
  const games = getGames();
  const idx = games.findIndex(g => g.id === game.id);
  if (idx !== -1) games[idx] = game;
  else games.push(game);
  saveGames(games);
}

export function deleteGame(id: string): void {
  saveGames(getGames().filter(g => g.id !== id));
}

export function calculateRoundScore(entry: Omit<PlayerRoundEntry, 'roundScore'>): number {
  if (entry.busted) return 0;
  let score = entry.numberCards.reduce((sum, v) => sum + v, 0);
  if (entry.hasDouble) score *= 2;
  score += entry.bonusCards.reduce((sum, v) => sum + v, 0);
  if (entry.hasFlip7) score += 15;
  return score;
}

export function getActiveGame(): Game | undefined {
  return getGames().find(g => g.status === 'active');
}

export const BONUS_CARD_VALUES: BonusCardValue[] = [2, 4, 6, 8, 10];
