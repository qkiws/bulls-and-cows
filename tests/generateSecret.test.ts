import { describe, expect, it, vi } from 'vitest';
import { generateSecret } from '../src/core';

describe('generateSecret', () => {
  it('uses the injected random source to create a predictable secret', () => {
    const random = vi
      .fn<() => number>()
      .mockReturnValueOnce(0.99)
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(0);

    expect(generateSecret(4, 10, random)).toBe('9123');
    expect(random).toHaveBeenCalledTimes(4);
  });

  it('generates unique digits and preserves a leading zero', () => {
    const random = vi.fn<() => number>().mockReturnValue(0);

    expect(generateSecret(2, 2, random)).toBe('01');
  });

  it('rejects lengths that cannot be represented with unique digits', () => {
    expect(() => generateSecret(3, 2, () => 0)).toThrow(RangeError);
  });

  it('rejects random values outside the interval from zero to one', () => {
    expect(() => generateSecret(2, 10, () => 1)).toThrow(RangeError);
  });
});
