import { LocalStorageGameStateStore } from './local-storage-game-state-store';
import { GameSession } from './game-session';

/** This test environment's jsdom `window` doesn't populate `localStorage` (it's
 *  `undefined`, and Node's own experimental global `localStorage` needs a
 *  `--localstorage-file` flag), so install a minimal in-memory stand-in for the suite. */
function installFakeLocalStorage(): Storage {
  const data = new Map<string, string>();
  const fake = {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => {
      data.set(key, value);
    },
    removeItem: (key: string) => {
      data.delete(key);
    },
    clear: () => data.clear(),
    key: (index: number) => Array.from(data.keys())[index] ?? null,
    get length() {
      return data.size;
    },
  } as Storage;
  Object.defineProperty(globalThis, 'localStorage', { value: fake, configurable: true });
  return fake;
}

describe('LocalStorageGameStateStore', () => {
  let store: LocalStorageGameStateStore;

  beforeAll(() => {
    installFakeLocalStorage();
  });

  const session: GameSession<{ bid: number }> = {
    gameId: 'wizard',
    players: ['Alice', 'Bob'],
    totalRounds: 20,
    currentRound: 2,
    phaseIndex: 0,
    pendingPhaseData: null,
    rounds: [
      { roundNumber: 1, dealerRoleIndex: 0, data: { bid: 1 }, scores: [20, -10] },
    ],
  };

  beforeEach(() => {
    localStorage.clear();
    store = new LocalStorageGameStateStore();
  });

  it('returns null when nothing is stored', () => {
    expect(store.load('wizard')).toBeNull();
  });

  it('round-trips a saved session', () => {
    store.save('wizard', session);
    expect(store.load('wizard')).toEqual(session);
  });

  it('namespaces keys per game id', () => {
    store.save('wizard', session);
    expect(store.load('other-game')).toBeNull();
    expect(localStorage.getItem('scoreboard:wizard:session')).not.toBeNull();
  });

  it('clear removes only that game session', () => {
    store.save('wizard', session);
    store.clear('wizard');
    expect(store.load('wizard')).toBeNull();
  });

  it('treats invalid JSON as no session instead of throwing', () => {
    localStorage.setItem('scoreboard:wizard:session', '{not json');
    expect(() => store.load('wizard')).not.toThrow();
    expect(store.load('wizard')).toBeNull();
  });

  it('treats a structurally wrong blob as no session', () => {
    localStorage.setItem('scoreboard:wizard:session', JSON.stringify({ foo: 'bar' }));
    expect(store.load('wizard')).toBeNull();
  });

  it('treats a session with a non-number score as no session', () => {
    const corrupt = { ...session, rounds: [{ ...session.rounds[0], scores: [20, 'oops'] }] };
    localStorage.setItem('scoreboard:wizard:session', JSON.stringify(corrupt));
    expect(store.load('wizard')).toBeNull();
  });

  it('rejects a session stored under a mismatched gameId key', () => {
    localStorage.setItem('scoreboard:wizard:session', JSON.stringify({ ...session, gameId: 'other' }));
    expect(store.load('wizard')).toBeNull();
  });
});
