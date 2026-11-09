import { describe, expect, it } from 'vitest';
import { evaluateGuess } from '../src/core';

describe('evaluateGuess', () => {
  it('counts correctly placed digits as bulls and misplaced digits as cows', () => {
    expect(evaluateGuess('4271', '1234')).toEqual({ bulls: 1, cows: 2 });
  });

  it('compares hexadecimal digits without case sensitivity', () => {
    expect(evaluateGuess('aF09', 'AF90')).toEqual({ bulls: 2, cows: 2 });
  });

  it('returns zero counts when no digits match', () => {
    expect(evaluateGuess('1234', '5678')).toEqual({ bulls: 0, cows: 0 });
  });

  it('does not count a repeated guess digit more than once', () => {
    expect(evaluateGuess('1234', '1111')).toEqual({ bulls: 1, cows: 0 });
  });
});
