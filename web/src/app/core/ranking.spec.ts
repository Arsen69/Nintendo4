import { cumulativeTotals, rankPlayers } from './ranking';
import { RoundRecord } from './game-session';

describe('cumulativeTotals', () => {
  it('sums scores positionally across rounds', () => {
    const rounds: RoundRecord<unknown>[] = [
      { roundNumber: 1, dealerRoleIndex: 0, data: {}, scores: [20, -10, 5] },
      { roundNumber: 2, dealerRoleIndex: 1, data: {}, scores: [-10, 30, 5] },
    ];
    expect(cumulativeTotals(rounds, 3)).toEqual([10, 20, 10]);
  });

  it('returns all zeros when there are no rounds yet', () => {
    expect(cumulativeTotals([], 4)).toEqual([0, 0, 0, 0]);
  });
});

describe('rankPlayers', () => {
  it('returns players sorted by descending total, ranked 1, 2, 3...', () => {
    expect(rankPlayers([10, 30, 20])).toEqual([
      { index: 1, total: 30, rank: 1 },
      { index: 2, total: 20, rank: 2 },
      { index: 0, total: 10, rank: 3 },
    ]);
  });

  it('gives tied totals the same rank and skips the next one', () => {
    expect(rankPlayers([30, 30, 10])).toEqual([
      { index: 0, total: 30, rank: 1 },
      { index: 1, total: 30, rank: 1 },
      { index: 2, total: 10, rank: 3 },
    ]);
  });
});
