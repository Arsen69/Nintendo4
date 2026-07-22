import {
  computeWizardScore,
  wizardBiddingOrder,
  wizardCardsDealt,
  wizardComputeRoundScores,
  wizardDealerIndex,
  wizardRoundConfig,
  wizardTotalRounds,
  wizardValidateRoundInput,
} from './wizard-rules';

describe('wizardTotalRounds', () => {
  it('is floor(60 / playerCount) for the supported 3-6 player range', () => {
    expect(wizardTotalRounds(3)).toBe(20);
    expect(wizardTotalRounds(4)).toBe(15);
    expect(wizardTotalRounds(5)).toBe(12);
    expect(wizardTotalRounds(6)).toBe(10);
  });
});

describe('wizardCardsDealt', () => {
  it('equals the round number', () => {
    expect(wizardCardsDealt(1)).toBe(1);
    expect(wizardCardsDealt(15)).toBe(15);
  });
});

describe('wizardDealerIndex', () => {
  it('rotates by one seat each round and wraps around', () => {
    const playerCount = 4;
    expect(wizardDealerIndex(1, playerCount)).toBe(0);
    expect(wizardDealerIndex(2, playerCount)).toBe(1);
    expect(wizardDealerIndex(4, playerCount)).toBe(3);
    expect(wizardDealerIndex(5, playerCount)).toBe(0);
  });
});

describe('wizardBiddingOrder', () => {
  it('starts left of the dealer and ends on the dealer', () => {
    const playerCount = 4;
    // round 1: dealer is seat 0, so order is 1, 2, 3, 0
    expect(wizardBiddingOrder(1, playerCount)).toEqual([1, 2, 3, 0]);
    // round 2: dealer is seat 1, so order is 2, 3, 0, 1
    expect(wizardBiddingOrder(2, playerCount)).toEqual([2, 3, 0, 1]);
  });

  it('always ends with the dealer as the last bidder', () => {
    const playerCount = 5;
    for (let round = 1; round <= 5; round++) {
      const order = wizardBiddingOrder(round, playerCount);
      expect(order[order.length - 1]).toBe(wizardDealerIndex(round, playerCount));
    }
  });
});

describe('wizardRoundConfig', () => {
  it('bundles dealerRoleIndex and cardsDealt', () => {
    expect(wizardRoundConfig(3, 4)).toEqual({ dealerRoleIndex: 2, cardsDealt: 3 });
  });
});

describe('computeWizardScore', () => {
  it('rewards an exact bid with 20 + 10*actual', () => {
    expect(computeWizardScore(3, 3)).toBe(50);
    expect(computeWizardScore(0, 0)).toBe(20);
  });

  it('penalizes a missed bid with -10*|bid-actual|', () => {
    expect(computeWizardScore(2, 5)).toBe(-30);
    expect(computeWizardScore(5, 2)).toBe(-30);
  });
});

describe('wizardComputeRoundScores', () => {
  it('maps each player\'s bid/actual pair through computeWizardScore', () => {
    const scores = wizardComputeRoundScores(
      { bids: [2, 0, 1], actual: [2, 1, 1] },
      { players: ['Alice', 'Bob', 'Cid'], roundNumber: 3 },
    );
    expect(scores).toEqual([40, -10, 30]);
  });
});

describe('wizardValidateRoundInput', () => {
  const ctx = { players: ['Alice', 'Bob', 'Cid', 'Dan'], roundNumber: 3 };

  it('returns null while bids are still partially entered', () => {
    expect(wizardValidateRoundInput({ bids: [1, 2] }, ctx)).toBeNull();
  });

  it('rejects a completed bid set where the dealer\'s bid equals cards dealt in total', () => {
    // roundNumber 3, 4 players -> dealer index 2 -> "Cid" is the dealer for this round
    const error = wizardValidateRoundInput({ bids: [1, 1, 1, 0] }, ctx);
    expect(error).toContain('Cid');
    expect(error).toContain('donneur');
  });

  it('accepts a completed bid set that does not sum to cards dealt', () => {
    expect(wizardValidateRoundInput({ bids: [1, 1, 0, 0] }, ctx)).toBeNull();
  });

  it('rejects a completed actual-tricks set that does not sum to cards dealt', () => {
    const error = wizardValidateRoundInput({ actual: [1, 1, 1, 2] }, ctx);
    expect(error).toContain('doit être égal');
  });

  it('accepts a completed actual-tricks set that sums to cards dealt', () => {
    expect(wizardValidateRoundInput({ actual: [1, 1, 1, 0] }, ctx)).toBeNull();
  });

  it('validates actual over bids when both happen to be present', () => {
    // bids would trigger the dealer restriction, but actual is what's being confirmed
    expect(
      wizardValidateRoundInput({ bids: [1, 1, 1, 0], actual: [1, 1, 1, 0] }, ctx),
    ).toBeNull();
  });
});
