const DIGITS = '0123456789abcdef';

export const createDigitValidator = (base: number) => {
  if (!Number.isInteger(base) || base < 2 || base > DIGITS.length) {
    throw new RangeError('Base must be an integer from 2 to 16.');
  }

  const allowedDigits = DIGITS.slice(0, base);

  return (char: string): boolean =>
    char.length === 1 && allowedDigits.includes(char.toLowerCase());
};
