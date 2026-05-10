export interface Player {
  id: string;
  name: string;
  createdAt: number;
}

export type BonusCardValue = 2 | 4 | 6 | 8 | 10;

export interface PlayerRoundEntry {
  playerId: string;
  numberCards: number[];
  bonusCards: BonusCardValue[];
  hasDouble: boolean;
  hasFlip7: boolean;
  busted: boolean;
  roundScore: number;
}

export interface Round {
  id: string;
  roundNumber: number;
  entries: PlayerRoundEntry[];
}

export interface Game {
  id: string;
  name: string;
  playerIds: string[];
  targetScore: number;
  rounds: Round[];
  cumulativeScores: Record<string, number>;
  startedAt: number;
  finishedAt?: number;
  winnerIds?: string[];
  status: 'active' | 'finished';
}
