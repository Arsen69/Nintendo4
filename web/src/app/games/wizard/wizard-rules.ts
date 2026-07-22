import { RoundConfig, RoundContext } from '../../core/game-definition';

const TOTAL_CARDS = 60;

export interface WizardRoundData {
  bids: number[];
  actual: number[];
}

export const WIZARD_PHASES = ['bidding', 'results'] as const;

export function wizardTotalRounds(playerCount: number): number {
  return Math.floor(TOTAL_CARDS / playerCount);
}

export function wizardCardsDealt(roundNumber: number): number {
  return roundNumber;
}

export function wizardDealerIndex(roundNumber: number, playerCount: number): number {
  return (roundNumber - 1) % playerCount;
}

/** Bidding order starts left of the dealer and wraps back around, ending on the dealer —
 *  i.e. the dealer always bids last. That's what makes the dealer's-bid restriction rule
 *  (see wizardValidateRoundInput) meaningful: the dealer is the one player who bids
 *  knowing every other bid already made. */
export function wizardBiddingOrder(roundNumber: number, playerCount: number): number[] {
  const dealer = wizardDealerIndex(roundNumber, playerCount);
  const order: number[] = [];
  for (let i = 1; i <= playerCount; i++) {
    order.push((dealer + i) % playerCount);
  }
  return order;
}

export function wizardRoundConfig(roundNumber: number, playerCount: number): RoundConfig {
  return {
    dealerRoleIndex: wizardDealerIndex(roundNumber, playerCount),
    cardsDealt: wizardCardsDealt(roundNumber),
  };
}

export function computeWizardScore(bid: number, actual: number): number {
  return bid === actual ? 20 + 10 * actual : -10 * Math.abs(bid - actual);
}

export function wizardComputeRoundScores(data: WizardRoundData, ctx: RoundContext): number[] {
  return ctx.players.map((_, i) => computeWizardScore(data.bids[i], data.actual[i]));
}

/** Validates whichever phase's data is fully present:
 *  - `actual` fully entered: the sum of tricks won must equal cards dealt (existing rule,
 *    ported from js/app.js).
 *  - `bids` fully entered, no `actual` yet: New — enforces the real Wizard rule that the
 *    dealer's bid cannot make the total of all bids equal to the cards dealt. Previously
 *    entirely unimplemented.
 *  Returns null (no error) while a phase's data is still partially entered. */
export function wizardValidateRoundInput(
  data: Partial<WizardRoundData>,
  ctx: RoundContext,
): string | null {
  const playerCount = ctx.players.length;
  const cardsDealt = wizardCardsDealt(ctx.roundNumber);

  if (data.actual && data.actual.length === playerCount) {
    const sum = data.actual.reduce((a, b) => a + b, 0);
    if (sum !== cardsDealt) {
      return `Le total des plis remportés (${sum}) doit être égal au nombre de cartes distribuées (${cardsDealt}).`;
    }
    return null;
  }

  if (data.bids && data.bids.length === playerCount) {
    const sum = data.bids.reduce((a, b) => a + b, 0);
    if (sum === cardsDealt) {
      const dealer = wizardDealerIndex(ctx.roundNumber, playerCount);
      return `Le pli annoncé par ${ctx.players[dealer]} (le donneur) ne peut pas rendre le total des annonces (${cardsDealt}) égal au nombre de cartes distribuées.`;
    }
    return null;
  }

  return null;
}
