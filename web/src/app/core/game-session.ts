/** One completed round's opaque per-game data plus its game-agnostic score deltas. */
export interface RoundRecord<T> {
  roundNumber: number;
  dealerRoleIndex: number;
  data: T;
  scores: number[];
}

/** The generic, game-agnostic session shape every GameStateStore persists. `pendingPhaseData`
 *  generalizes what Wizard today calls `pendingBids` — whatever the in-progress phase is
 *  collecting before the round is committed into `rounds`. */
export interface GameSession<TRoundData = unknown> {
  gameId: string;
  players: string[];
  totalRounds: number;
  currentRound: number;
  phaseIndex: number;
  pendingPhaseData: unknown;
  rounds: RoundRecord<TRoundData>[];
}
