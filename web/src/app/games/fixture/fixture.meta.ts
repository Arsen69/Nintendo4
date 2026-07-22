import { GameMeta } from '../../core/game-definition';

/** Not a real game — proves the GameDefinition/manifest/routing wiring end to end.
 *  Not listed in GAME_MANIFEST (Wizard is the first real game now); still reachable
 *  directly at /games/fixture and still covered by fixture.definition.spec.ts. */
export const FIXTURE_META: GameMeta = {
  id: 'fixture',
  displayName: 'Fixture (dev only)',
  minPlayers: 1,
  maxPlayers: 8,
};
