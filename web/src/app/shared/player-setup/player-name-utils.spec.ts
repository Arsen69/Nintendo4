import { findDuplicateName, resolvePlayerNames } from './player-name-utils';

describe('resolvePlayerNames', () => {
  it('defaults a blank name to a positional placeholder', () => {
    expect(resolvePlayerNames(['Alice', '  ', ''])).toEqual(['Alice', 'Joueur 2', 'Joueur 3']);
  });

  it('trims whitespace around typed names', () => {
    expect(resolvePlayerNames(['  Bob  '])).toEqual(['Bob']);
  });
});

describe('findDuplicateName', () => {
  it('returns null when all names are distinct', () => {
    expect(findDuplicateName(['Alice', 'Bob', 'Cid'])).toBeNull();
  });

  it('finds a case-insensitive, trim-insensitive duplicate', () => {
    expect(findDuplicateName(['Alice', '  alice '])).toBe('  alice ');
  });
});
