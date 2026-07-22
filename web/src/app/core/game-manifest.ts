import { GameMeta } from './game-definition';
import { WIZARD_META } from '../games/wizard/wizard.meta';

/** Eager list powering the game-select tile grid at `/`. Only ever imports each game's
 *  *.meta.ts — never its definition or components — so this stays cheap to load. Adding a
 *  second game is one entry here plus one new lazy route in app.routes.ts.
 *
 *  The fixture game (games/fixture/) is deliberately not listed here — it's a dev-only
 *  proof of the engine wiring, still reachable directly at /games/fixture, and still
 *  covered by fixture.definition.spec.ts. */
export const GAME_MANIFEST: GameMeta[] = [WIZARD_META];
