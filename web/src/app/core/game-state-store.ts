import { InjectionToken } from '@angular/core';
import { GameSession } from './game-session';

/** DI-token abstraction so persistence can move from localStorage to a future backend
 *  (an HttpGameStateStore) as a one-line provider change, with no calling-code changes. */
export interface GameStateStore {
  load<T>(gameId: string): GameSession<T> | null;
  save<T>(gameId: string, session: GameSession<T>): void;
  clear(gameId: string): void;
}

export const GAME_STATE_STORE = new InjectionToken<GameStateStore>('GAME_STATE_STORE');
