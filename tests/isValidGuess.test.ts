import { describe, expect, it } from 'vitest';
import { isValidGuess } from '../src/core';

describe('isValidGuess', () => {
  it('accepts a guess with the required length and unique digits', () => {
    expect(isValidGuess('0123', 4, 10)).toBe(true);
    expect(isValidGuess('aF09', 4, 16)).toBe(true);
    expect(isValidGuess('10', 2, 2)).toBe(true);
  });

  it('rejects guesses with the wrong length or repeated digits', () => {
    expect(isValidGuess('123', 4, 10)).toBe(false);
    expect(isValidGuess('1123', 4, 10)).toBe(false);
    expect(isValidGuess('aA', 2, 16)).toBe(false);
  });

  it('rejects symbols outside the selected base and impossible lengths', () => {
    expect(isValidGuess('128', 3, 8)).toBe(false);
    expect(isValidGuess('12', 3, 10)).toBe(false);
    expect(isValidGuess('123', 3, 2)).toBe(false);
  });
});
