import { RoundRecord } from './game-session';

/** Sums each player's `scores[i]` across every completed round. Purely positional —
 *  works for any game, since RoundRecord.scores is always number[]. */
export function cumulativeTotals(rounds: RoundRecord<unknown>[], playerCount: number): number[] {
  const totals = new Array<number>(playerCount).fill(0);
  for (const round of rounds) {
    round.scores.forEach((score, i) => {
      totals[i] += score;
    });
  }
  return totals;
}

export interface RankedPlayer {
  index: number;
  total: number;
  /** 1-based; tied totals share the same rank (standard competition ranking). */
  rank: number;
}

/** Ranks player indices by total score, descending. Ties share a rank (e.g. two players
 *  tied for 1st both get rank 1, the next distinct total gets rank 3, not 2). */
export function rankPlayers(totals: number[]): RankedPlayer[] {
  const sorted = totals
    .map((total, index) => ({ index, total }))
    .sort((a, b) => b.total - a.total);

  const ranked: RankedPlayer[] = [];
  let rank = 0;
  let previousTotal: number | null = null;
  sorted.forEach((entry, i) => {
    if (previousTotal === null || entry.total !== previousTotal) {
      rank = i + 1;
    }
    previousTotal = entry.total;
    ranked.push({ index: entry.index, total: entry.total, rank });
  });
  return ranked;
}
