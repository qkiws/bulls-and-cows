import { describe, expect, it } from 'vitest';
import { countPossibleSecrets } from '../src/core';

describe('countPossibleSecrets', () => {
  it('counts permutations without excluding leading zeroes', () => {
    expect(countPossibleSecrets(4, 10)).toBe(5040);
    expect(countPossibleSecrets(2, 2)).toBe(2);
  });

  it('returns one arrangement for a zero-length secret', () => {
    expect(countPossibleSecrets(0, 10)).toBe(1);
  });

  it('returns zero when more unique digits are requested than the base provides', () => {
    expect(countPossibleSecrets(3, 2)).toBe(0);
  });

  it('returns zero for invalid negative or fractional inputs', () => {
    expect(countPossibleSecrets(-1, 10)).toBe(0);
    expect(countPossibleSecrets(2, -1)).toBe(0);
    expect(countPossibleSecrets(1.5, 10)).toBe(0);
  });
});
