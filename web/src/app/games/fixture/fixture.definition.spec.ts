import { FIXTURE_DEFINITION } from './fixture.definition';
import { FixturePlayComponent } from './fixture-play.component';
import { GAME_MANIFEST } from '../../core/game-manifest';

describe('FIXTURE_DEFINITION', () => {
  it('is not listed in GAME_MANIFEST (dev-only, reachable directly at /games/fixture)', () => {
    expect(GAME_MANIFEST.find((g) => g.id === 'fixture')).toBeUndefined();
  });

  it('totalRounds scales with player count', () => {
    expect(FIXTURE_DEFINITION.totalRounds(3)).toBe(3);
    expect(FIXTURE_DEFINITION.totalRounds(6)).toBe(6);
  });

  it('computeRoundScores maps the fixture value to every player', () => {
    const scores = FIXTURE_DEFINITION.computeRoundScores(
      { value: 7 },
      { players: ['Alice', 'Bob', 'Cid'], roundNumber: 1 },
    );
    expect(scores).toEqual([7, 7, 7]);
  });

  it('validateRoundInput rejects a missing value', () => {
    expect(FIXTURE_DEFINITION.validateRoundInput?.({}, { players: [], roundNumber: 1 })).toBe(
      'value is required',
    );
    expect(
      FIXTURE_DEFINITION.validateRoundInput?.({ value: 1 }, { players: [], roundNumber: 1 }),
    ).toBeNull();
  });

  it('exposes its play component through ui.phaseComponents', () => {
    expect(FIXTURE_DEFINITION.ui.phaseComponents).toEqual([FixturePlayComponent]);
  });
});
