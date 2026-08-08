import { getGames, getPlayers } from './storage';
import type { Game } from './types';

function download(filename: string, content: string, mime: string): void {
  const blob = new Blob([content], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function finishedGames(): Game[] {
  return getGames().filter(g => g.status === 'finished');
}

function playerNameResolver(): (id: string) => string {
  const players = getPlayers();
  return (id: string) => players.find(p => p.id === id)?.name ?? id;
}

function stamp(): string {
  return new Date().toISOString().slice(0, 10);
}

export function exportHistoryJson(): void {
  const nameOf = playerNameResolver();
  const data = finishedGames().map(g => ({
    name: g.name,
    startedAt: new Date(g.startedAt).toISOString(),
    finishedAt: g.finishedAt ? new Date(g.finishedAt).toISOString() : null,
    targetScore: g.targetScore,
    players: g.playerIds.map(nameOf),
    winners: (g.winnerIds ?? []).map(nameOf),
    finalScores: Object.fromEntries(g.playerIds.map(id => [nameOf(id), g.cumulativeScores[id] ?? 0])),
    rounds: g.rounds.map(r => ({
      round: r.roundNumber,
      entries: r.entries.map(e => ({
        player: nameOf(e.playerId),
        numberCards: e.numberCards,
        bonusCards: e.bonusCards,
        hasDouble: e.hasDouble,
        hasFlip7: e.hasFlip7,
        busted: e.busted,
        roundScore: e.roundScore,
      })),
    })),
  }));
  download(`flip7-historique-${stamp()}.json`, JSON.stringify(data, null, 2), 'application/json');
}

/** CSV « ; » (Excel FR) : une ligne par joueur et par tour */
export function exportHistoryCsv(): void {
  const nameOf = playerNameResolver();
  const esc = (v: string | number) => {
    const s = String(v);
    return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const rows: string[] = [
    ['partie', 'date', 'objectif', 'tour', 'joueur', 'cartes_numero', 'cartes_bonus', 'x2', 'flip7', 'bust', 'score_tour', 'score_final', 'vainqueur'].join(';'),
  ];
  for (const g of finishedGames()) {
    const date = new Date(g.startedAt).toISOString().slice(0, 10);
    for (const r of g.rounds) {
      for (const e of r.entries) {
        rows.push([
          esc(g.name),
          date,
          g.targetScore,
          r.roundNumber,
          esc(nameOf(e.playerId)),
          esc(e.numberCards.join('+')),
          esc(e.bonusCards.map(v => `+${v}`).join(' ')),
          e.hasDouble ? 'oui' : 'non',
          e.hasFlip7 ? 'oui' : 'non',
          e.busted ? 'oui' : 'non',
          e.roundScore,
          g.cumulativeScores[e.playerId] ?? 0,
          (g.winnerIds ?? []).includes(e.playerId) ? 'oui' : 'non',
        ].join(';'));
      }
    }
  }
  // BOM UTF-8 pour qu'Excel affiche correctement les accents
  download(`flip7-historique-${stamp()}.csv`, '\uFEFF' + rows.join('\n'), 'text/csv');
}
