export interface Player {
  id: string;
  name: string;
  createdAt: number;
}

export type BonusCardValue = 2 | 4 | 6 | 8 | 10;

/** Version du jeu : classique ou « With a Vengeance » (Soif de vengeance) */
export type GameVariant = 'classic' | 'vengeance';

export interface PlayerRoundEntry {
  playerId: string;
  numberCards: number[];
  bonusCards: BonusCardValue[];
  hasDouble: boolean;
  hasFlip7: boolean;
  busted: boolean;
  roundScore: number;
  // ── Vengeance uniquement (absents/ignorés en classique) ──
  /** Modificateurs négatifs reçus (valeurs absolues : 2, 4, 6, 8, 10) */
  minusCards?: number[];
  /** Modificateur ÷2 */
  hasHalve?: boolean;
  /** Lucky 13 : autorise un second 13 (présent deux fois dans numberCards) */
  hasLucky13?: boolean;
  /** Mode Brutal : sur Flip 7, retire 15 pts à ce joueur au lieu de gagner +15 */
  flip7TargetId?: string;
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
  /** Absent sur les anciennes parties ⇒ 'classic' */
  variant?: GameVariant;
  /** Mode Brutal (Vengeance uniquement) */
  brutal?: boolean;
}
