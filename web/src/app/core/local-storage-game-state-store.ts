import { Injectable } from '@angular/core';
import { GameSession, RoundRecord } from './game-session';
import { GameStateStore } from './game-state-store';

function isRoundRecord(value: unknown): value is RoundRecord<unknown> {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const v = value as Record<string, unknown>;
  return (
    typeof v['roundNumber'] === 'number' &&
    typeof v['dealerRoleIndex'] === 'number' &&
    'data' in v &&
    Array.isArray(v['scores']) &&
    v['scores'].every((s) => typeof s === 'number')
  );
}

function isGameSession(value: unknown): value is GameSession<unknown> {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const v = value as Record<string, unknown>;
  return (
    typeof v['gameId'] === 'string' &&
    Array.isArray(v['players']) &&
    v['players'].every((p) => typeof p === 'string') &&
    typeof v['totalRounds'] === 'number' &&
    typeof v['currentRound'] === 'number' &&
    typeof v['phaseIndex'] === 'number' &&
    'pendingPhaseData' in v &&
    Array.isArray(v['rounds']) &&
    v['rounds'].every(isRoundRecord)
  );
}

/** Namespaces one localStorage key per game (`scoreboard:<gameId>:session`) and treats any
 *  corrupt, partial, or wrong-shape blob as "no session" rather than crashing renders on
 *  load — fixes the weak validation in today's vanilla-JS `init()`. */
@Injectable()
export class LocalStorageGameStateStore implements GameStateStore {
  load<T>(gameId: string): GameSession<T> | null {
    const raw = localStorage.getItem(this.key(gameId));
    if (raw === null) {
      return null;
    }
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return null;
    }
    if (!isGameSession(parsed) || parsed.gameId !== gameId) {
      return null;
    }
    return parsed as GameSession<T>;
  }

  save<T>(gameId: string, session: GameSession<T>): void {
    localStorage.setItem(this.key(gameId), JSON.stringify(session));
  }

  clear(gameId: string): void {
    localStorage.removeItem(this.key(gameId));
  }

  private key(gameId: string): string {
    return `scoreboard:${gameId}:session`;
  }
}
