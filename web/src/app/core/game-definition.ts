import { Type } from '@angular/core';

/** Cheap static metadata for one game. Eagerly imported into GAME_MANIFEST — must not
 *  pull in any game logic or components, so the game-select screen stays lightweight. */
export interface GameMeta {
  id: string;
  displayName: string;
  icon?: string;
  minPlayers: number;
  maxPlayers: number;
}

export interface RoundContext {
  players: string[];
  roundNumber: number;
}

export interface RoundConfig {
  dealerRoleIndex: number;
  [key: string]: unknown;
}

/** Full rules for one game. Only ever imported from within that game's own lazy-loaded
 *  route chunk — never from app.routes.ts or the manifest — so it stays code-split. */
export interface GameDefinition<TRoundData = unknown> {
  meta: GameMeta;
  totalRounds(playerCount: number): number;
  roundConfig(roundNumber: number, playerCount: number): RoundConfig;
  phases: string[];
  computeRoundScores(data: TRoundData, ctx: RoundContext): number[];
  validateRoundInput?(data: Partial<TRoundData>, ctx: RoundContext): string | null;
  ui: {
    setupExtra?: Type<unknown>;
    phaseComponents: Type<unknown>[];
  };
}
