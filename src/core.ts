const DIGITS = '0123456789abcdef';

export const generateSecret = (
  length: number,
  base: number,
  random: () => number = Math.random,
): string => {
  if (
    !Number.isInteger(length) ||
    length < 1 ||
    !Number.isInteger(base) ||
    base < 2 ||
    base > DIGITS.length ||
    length > base
  ) {
    throw new RangeError('Length must be positive and no greater than a base from 2 to 16.');
  }

  const digits = DIGITS.slice(0, base).split('');
  const selected: string[] = [];

  for (let index = 0; index < length; index += 1) {
    const value = random();
    if (!Number.isFinite(value) || value < 0 || value >= 1) {
      throw new RangeError('Random source must return a number from 0 (inclusive) to 1.');
    }

    const swapIndex = index + Math.floor(value * (base - index));
    const digit = digits[swapIndex];
    if (digit === undefined) {
      throw new RangeError('Random source selected an unavailable digit.');
    }

    digits[swapIndex] = digits[index]!;
    digits[index] = digit;
    selected.push(digit);
  }

  return selected.join('');
};

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

export type GuessResult = Readonly<{ bulls: number; cows: number }>;

export const evaluateGuess = (secret: string, guess: string): GuessResult => {
  const secretDigits = [...secret.toLowerCase()];
  const guessDigits = [...guess.toLowerCase()];
  const bulls = secretDigits.reduce(
    (count, digit, index) => count + Number(digit === guessDigits[index]),
    0,
  );
  const matchingDigits = secretDigits.filter((digit) => guessDigits.includes(digit)).length;

  return { bulls, cows: matchingDigits - bulls };
};
