import { describe, expect, it } from 'vitest';
import { createDigitValidator } from '../src/core';

describe('createDigitValidator', () => {
  it('accepts digits included in the selected base', () => {
    expect(createDigitValidator(2)('1')).toBe(true);
    expect(createDigitValidator(8)('7')).toBe(true);
    expect(createDigitValidator(10)('9')).toBe(true);
  });

  it('accepts hexadecimal letters without case sensitivity', () => {
    const isHexDigit = createDigitValidator(16);

    expect(isHexDigit('a')).toBe(true);
    expect(isHexDigit('F')).toBe(true);
  });

  it('rejects unsupported symbols and characters outside the base', () => {
    expect(createDigitValidator(2)('2')).toBe(false);
    expect(createDigitValidator(10)('a')).toBe(false);
    expect(createDigitValidator(16)('g')).toBe(false);
    expect(createDigitValidator(16)('')).toBe(false);
  });
});
