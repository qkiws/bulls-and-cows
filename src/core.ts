const DIGITS = '0123456789abcdef';

export const createDigitValidator = (base: number) => {
  if (!Number.isInteger(base) || base < 2 || base > DIGITS.length) {
    throw new RangeError('Base must be an integer from 2 to 16.');
  }

  const allowedDigits = DIGITS.slice(0, base);

  return (char: string): boolean =>
    char.length === 1 && allowedDigits.includes(char.toLowerCase());
};

export const isValidGuess = (guess: string, length: number, base: number): boolean => {
  if (
    !Number.isInteger(length) ||
    length < 1 ||
    length > base ||
    guess.length !== length ||
    !Number.isInteger(base) ||
    base < 2 ||
    base > DIGITS.length
  ) {
    return false;
  }

  const isDigitValid = createDigitValidator(base);
  const digits = [...guess];
  const normalizedDigits = digits.map((digit) => digit.toLowerCase());

  return digits.every(isDigitValid) && new Set(normalizedDigits).size === length;
};
