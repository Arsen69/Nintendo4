import { TestBed } from '@angular/core/testing';
import { PlayerSetupComponent } from './player-setup.component';
import { clearSetupDraft, loadSetupDraft, saveSetupDraft } from '../../core/setup-draft';

function installFakeLocalStorage(): void {
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
}

describe('PlayerSetupComponent', () => {
  beforeAll(() => installFakeLocalStorage());
  beforeEach(() => localStorage.clear());

  function createComponent(gameId = 'wizard', min = 3, max = 6) {
    const fixture = TestBed.createComponent(PlayerSetupComponent);
    fixture.componentRef.setInput('gameId', gameId);
    fixture.componentRef.setInput('minPlayers', min);
    fixture.componentRef.setInput('maxPlayers', max);
    fixture.detectChanges();
    return fixture;
  }

  it('defaults the player count to minPlayers with no draft', () => {
    const fixture = createComponent();
    expect(fixture.componentInstance['playerCount']()).toBe(3);
  });

  it('increment/decrement clamp to [minPlayers, maxPlayers]', () => {
    const fixture = createComponent('wizard', 3, 6);
    const component = fixture.componentInstance;
    for (let i = 0; i < 10; i++) {
      component['increment']();
    }
    expect(component['playerCount']()).toBe(6);
    for (let i = 0; i < 10; i++) {
      component['decrement']();
    }
    expect(component['playerCount']()).toBe(3);
  });

  it('flags a duplicate name and blocks confirm', () => {
    const fixture = createComponent();
    const component = fixture.componentInstance;
    component['updateName'](0, 'Alice');
    component['updateName'](1, 'alice');
    expect(component['duplicateName']()).toBe('alice');

    const emitted: string[][] = [];
    component.start.subscribe((names) => emitted.push(names));
    component['confirm']();
    expect(emitted.length).toBe(0);
  });

  it('emits resolved names (with positional defaults for blanks) on confirm', () => {
    const fixture = createComponent();
    const component = fixture.componentInstance;
    component['updateName'](0, 'Alice');
    // players 2 and 3 left blank

    let emitted: string[] | undefined;
    component.start.subscribe((names) => (emitted = names));
    component['confirm']();
    expect(emitted).toEqual(['Alice', 'Joueur 2', 'Joueur 3']);
  });

  it('persists a draft as names are typed, and reloading a new instance restores it', () => {
    const first = createComponent('wizard', 3, 6);
    first.componentInstance['updateName'](0, 'Alice');
    first.componentInstance['increment']();

    const draft = loadSetupDraft('wizard');
    expect(draft?.playerCount).toBe(4);
    expect(draft?.names[0]).toBe('Alice');

    const second = createComponent('wizard', 3, 6);
    expect(second.componentInstance['playerCount']()).toBe(4);
    expect(second.componentInstance['visibleNames']()[0]).toBe('Alice');
  });

  it('clears the draft once the setup is confirmed', () => {
    saveSetupDraft('wizard', { playerCount: 4, names: ['Alice', '', '', ''] });
    const fixture = createComponent('wizard', 3, 6);
    fixture.componentInstance['confirm']();
    expect(loadSetupDraft('wizard')).toBeNull();
  });

  afterEach(() => clearSetupDraft('wizard'));
});
