import { TestBed } from '@angular/core/testing';
import { GameSession } from '../../core/game-session';
import { GAME_STATE_STORE, GameStateStore } from '../../core/game-state-store';
import { WizardStateService } from './wizard-state.service';
import { WizardRoundData } from './wizard-rules';

class FakeGameStateStore implements GameStateStore {
  private readonly data = new Map<string, GameSession<unknown>>();

  load<T>(gameId: string): GameSession<T> | null {
    return (this.data.get(gameId) as GameSession<T> | undefined) ?? null;
  }

  save<T>(gameId: string, session: GameSession<T>): void {
    this.data.set(gameId, session as GameSession<unknown>);
  }

  clear(gameId: string): void {
    this.data.delete(gameId);
  }
}

describe('WizardStateService', () => {
  let store: FakeGameStateStore;
  let service: WizardStateService;

  beforeEach(() => {
    store = new FakeGameStateStore();
    TestBed.configureTestingModule({
      providers: [WizardStateService, { provide: GAME_STATE_STORE, useValue: store }],
    });
    service = TestBed.inject(WizardStateService);
  });

  it('has no session initially', () => {
    expect(service.session()).toBeNull();
  });

  it('startGame creates a session sized for the player count', () => {
    service.startGame(['Alice', 'Bob', 'Cid', 'Dan']);
    expect(service.totalRounds()).toBe(15); // floor(60/4)
    expect(service.currentRound()).toBe(1);
    expect(service.phase()).toBe('bidding');
    expect(service.isFinished()).toBe(false);
    expect(store.load('wizard')).not.toBeNull();
  });

  it('confirmBids rejects a bid set that triggers the dealer restriction and stays in bidding', () => {
    service.startGame(['Alice', 'Bob', 'Cid', 'Dan']);
    // round 1, dealer is seat 0 (Alice); total bids of 1 == cardsDealt(1)
    const error = service.confirmBids([1, 0, 0, 0]);
    expect(error).toContain('Alice');
    expect(service.phase()).toBe('bidding');
  });

  it('confirmBids accepts a valid bid set and advances to results', () => {
    service.startGame(['Alice', 'Bob', 'Cid', 'Dan']);
    const error = service.confirmBids([0, 0, 0, 0]);
    expect(error).toBeNull();
    expect(service.phase()).toBe('results');
    expect(service.pendingBids()).toEqual([0, 0, 0, 0]);
  });

  it('confirmResults rejects a tricks total that does not match cards dealt', () => {
    service.startGame(['Alice', 'Bob', 'Cid', 'Dan']);
    service.confirmBids([0, 0, 0, 0]);
    // cardsDealt for round 1 is 1, but these sum to 2
    const error = service.confirmResults([1, 1, 0, 0]);
    expect(error).toContain('doit être égal');
    expect(service.phase()).toBe('results');
    expect(service.rounds().length).toBe(0);
  });

  it('confirmResults commits the round, computes scores, and advances the round/phase', () => {
    service.startGame(['Alice', 'Bob', 'Cid', 'Dan']);
    // round 1, cardsDealt = 1: bids all 0 (sum 0, doesn't trigger the dealer restriction)
    service.confirmBids([0, 0, 0, 0]);
    // Dan wins the only trick, everyone else's bid of 0 is correct
    const error = service.confirmResults([0, 0, 0, 1]);
    expect(error).toBeNull();
    expect(service.currentRound()).toBe(2);
    expect(service.phase()).toBe('bidding');
    expect(service.rounds().length).toBe(1);
    expect(service.rounds()[0].scores).toEqual([20, 20, 20, -10]);
    expect(service.totals()).toEqual([20, 20, 20, -10]);
  });

  it('isFinished becomes true once currentRound exceeds totalRounds', () => {
    service.startGame(['Alice', 'Bob', 'Cid']); // totalRounds = floor(60/3) = 20
    for (let round = 1; round <= 20; round++) {
      // bids sum to 0 (never triggers the dealer restriction); Alice wins every trick
      // dealt that round, so actual sums to cardsDealt (= round number) each time.
      service.confirmBids([0, 0, 0]);
      service.confirmResults([round, 0, 0]);
    }
    expect(service.currentRound()).toBe(21);
    expect(service.isFinished()).toBe(true);
  });

  it('ranking reflects cumulative totals across rounds, sorted descending', () => {
    service.startGame(['Alice', 'Bob']);
    // round 1 (cardsDealt 1): Alice bids 0 but wins the trick (miss); Bob bids 0 and wins none (match)
    service.confirmBids([0, 0]);
    service.confirmResults([1, 0]);
    // round 2 (cardsDealt 2): same pattern, Alice keeps missing, Bob keeps matching
    service.confirmBids([0, 0]);
    service.confirmResults([2, 0]);

    expect(service.totals()).toEqual([-30, 40]); // Alice: -10 + -20; Bob: 20 + 20
    expect(service.ranking()).toEqual([
      { index: 1, total: 40, rank: 1 },
      { index: 0, total: -30, rank: 2 },
    ]);
  });

  it('newGame clears both the in-memory session and the store', () => {
    service.startGame(['Alice', 'Bob', 'Cid']);
    service.newGame();
    expect(service.session()).toBeNull();
    expect(store.load('wizard')).toBeNull();
  });

  it('undoLastRound returns null and does nothing when there are no completed rounds', () => {
    service.startGame(['Alice', 'Bob', 'Cid']);
    expect(service.undoLastRound()).toBeNull();
    expect(service.currentRound()).toBe(1);
  });

  it('undoLastRound pops the last round back into bidding, returning its original data', () => {
    service.startGame(['Alice', 'Bob', 'Cid', 'Dan']);
    service.confirmBids([0, 0, 0, 0]);
    service.confirmResults([0, 0, 0, 1]); // round 1 committed, scores [20,20,20,-10]
    expect(service.currentRound()).toBe(2);
    expect(service.rounds().length).toBe(1);

    const undone = service.undoLastRound();
    expect(undone?.roundNumber).toBe(1);
    expect(undone?.data).toEqual({ bids: [0, 0, 0, 0], actual: [0, 0, 0, 1] });
    expect(undone?.scores).toEqual([20, 20, 20, -10]);

    expect(service.currentRound()).toBe(1);
    expect(service.phase()).toBe('bidding');
    expect(service.rounds().length).toBe(0);
    expect(service.totals()).toEqual([0, 0, 0, 0]);
  });

  it('the round can be re-played identically after an undo', () => {
    service.startGame(['Alice', 'Bob', 'Cid', 'Dan']);
    service.confirmBids([0, 0, 0, 0]);
    service.confirmResults([0, 0, 0, 1]);
    service.undoLastRound();

    service.confirmBids([0, 0, 0, 0]);
    const error = service.confirmResults([0, 0, 0, 1]);
    expect(error).toBeNull();
    expect(service.rounds().length).toBe(1);
    expect(service.currentRound()).toBe(2);
  });
});
