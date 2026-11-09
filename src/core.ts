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
