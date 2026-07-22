import { GameMeta } from './game-definition';
import { FIXTURE_META } from '../games/fixture/fixture.meta';

/** Eager list powering the game-select tile grid at `/`. Only ever imports each game's
 *  *.meta.ts — never its definition or components — so this stays cheap to load. Adding a
 *  second game is one entry here plus one new lazy route in app.routes.ts. */
export const GAME_MANIFEST: GameMeta[] = [FIXTURE_META];
