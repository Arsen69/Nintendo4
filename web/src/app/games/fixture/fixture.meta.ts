import { GameMeta } from '../../core/game-definition';

/** Not a real game — proves the GameDefinition/manifest/routing wiring end to end.
 *  Listed in GAME_MANIFEST for now since no real game exists yet; will be removed once
 *  the first real game (Wizard, see issue #9) is registered. */
export const FIXTURE_META: GameMeta = {
  id: 'fixture',
  displayName: 'Fixture (dev only)',
  minPlayers: 1,
  maxPlayers: 8,
};
