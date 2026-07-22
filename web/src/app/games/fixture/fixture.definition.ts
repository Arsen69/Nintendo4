import { GameDefinition } from '../../core/game-definition';
import { FIXTURE_META } from './fixture.meta';
import { FixturePlayComponent } from './fixture-play.component';

export interface FixtureRoundData {
  value: number;
}

/** Trivial rules — just enough to exercise every member of GameDefinition. */
export const FIXTURE_DEFINITION: GameDefinition<FixtureRoundData> = {
  meta: FIXTURE_META,
  totalRounds: (playerCount) => playerCount,
  roundConfig: (roundNumber) => ({ dealerRoleIndex: roundNumber - 1 }),
  phases: ['play'],
  computeRoundScores: (data, ctx) => ctx.players.map(() => data.value),
  validateRoundInput: (data) =>
    typeof data.value === 'number' ? null : 'value is required',
  ui: {
    phaseComponents: [FixturePlayComponent],
  },
};
