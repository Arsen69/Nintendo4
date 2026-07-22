import { Injectable, computed, inject, signal } from '@angular/core';
import { GameSession, RoundRecord } from '../../core/game-session';
import { GAME_STATE_STORE } from '../../core/game-state-store';
import { cumulativeTotals, rankPlayers } from '../../core/ranking';
import { WIZARD_META } from './wizard.meta';
import {
  WizardRoundData,
  wizardCardsDealt,
  wizardComputeRoundScores,
  wizardDealerIndex,
  wizardBiddingOrder,
  wizardTotalRounds,
  wizardValidateRoundInput,
} from './wizard-rules';

/** Owns the Wizard GameSession: creation, phase advancement, and persistence. Kept
 *  separate from the display components so the round-advance/validation logic is
 *  testable without TestBed or the DOM. */
@Injectable()
export class WizardStateService {
  private readonly store = inject(GAME_STATE_STORE);

  private readonly _session = signal<GameSession<WizardRoundData> | null>(
    this.store.load<WizardRoundData>(WIZARD_META.id),
  );

  readonly session = this._session.asReadonly();

  readonly players = computed(() => this._session()?.players ?? []);
  readonly currentRound = computed(() => this._session()?.currentRound ?? 1);
  readonly totalRounds = computed(() => this._session()?.totalRounds ?? 0);
  readonly rounds = computed(() => this._session()?.rounds ?? []);
  readonly isFinished = computed(() => {
    const s = this._session();
    return !!s && s.currentRound > s.totalRounds;
  });
  readonly phase = computed<'bidding' | 'results'>(() =>
    this._session()?.phaseIndex === 1 ? 'results' : 'bidding',
  );
  readonly cardsDealt = computed(() => wizardCardsDealt(this.currentRound()));
  readonly dealerIndex = computed(() => wizardDealerIndex(this.currentRound(), this.players().length));
  readonly biddingOrder = computed(() => wizardBiddingOrder(this.currentRound(), this.players().length));
  readonly pendingBids = computed(
    () => (this._session()?.pendingPhaseData as { bids: number[] } | null)?.bids ?? null,
  );
  readonly totals = computed(() => cumulativeTotals(this.rounds(), this.players().length));
  readonly ranking = computed(() => rankPlayers(this.totals()));

  startGame(players: string[]): void {
    const session: GameSession<WizardRoundData> = {
      gameId: WIZARD_META.id,
      players,
      totalRounds: wizardTotalRounds(players.length),
      currentRound: 1,
      phaseIndex: 0,
      pendingPhaseData: null,
      rounds: [],
    };
    this._session.set(session);
    this.store.save(WIZARD_META.id, session);
  }

  /** Returns an error message if the bids are rejected, otherwise advances to the
   *  results phase and returns null. */
  confirmBids(bids: number[]): string | null {
    const s = this._session();
    if (!s) {
      return null;
    }
    const error = wizardValidateRoundInput({ bids }, { players: s.players, roundNumber: s.currentRound });
    if (error) {
      return error;
    }
    const next: GameSession<WizardRoundData> = {
      ...s,
      phaseIndex: 1,
      pendingPhaseData: { bids },
    };
    this._session.set(next);
    this.store.save(WIZARD_META.id, next);
    return null;
  }

  /** Returns an error message if the tricks-won total is rejected, otherwise commits
   *  the round, advances to the next round's bidding phase, and returns null. */
  confirmResults(actual: number[]): string | null {
    const s = this._session();
    if (!s) {
      return null;
    }
    const ctx = { players: s.players, roundNumber: s.currentRound };
    const error = wizardValidateRoundInput({ actual }, ctx);
    if (error) {
      return error;
    }

    const bids = (s.pendingPhaseData as { bids: number[] }).bids;
    const scores = wizardComputeRoundScores({ bids, actual }, ctx);
    const record: RoundRecord<WizardRoundData> = {
      roundNumber: s.currentRound,
      dealerRoleIndex: wizardDealerIndex(s.currentRound, s.players.length),
      data: { bids, actual },
      scores,
    };

    const next: GameSession<WizardRoundData> = {
      ...s,
      rounds: [...s.rounds, record],
      currentRound: s.currentRound + 1,
      phaseIndex: 0,
      pendingPhaseData: null,
    };
    this._session.set(next);
    this.store.save(WIZARD_META.id, next);
    return null;
  }

  newGame(): void {
    this.store.clear(WIZARD_META.id);
    this._session.set(null);
  }
}
