# Design notes

## Data structures and algorithms

- The secret is a string in `src/core.ts`. Keeping it as characters preserves leading zeroes, and a string is never exposed to the UI.
- `GameState` in `src/main.ts` contains immutable round settings, the secret, start time, status, and a readonly attempt history. Each accepted guess creates an attempt and replaces the state with a new object whose history is `[...history, attempt]`; previous entries are not edited.
- A score records attempts, elapsed milliseconds, the length, base, and completion time. `src/main.ts` sorts the shared `localStorage` list by attempts and then elapsed time, and stores the best ten results.
- `evaluateGuess` normalizes digits to lowercase, counts same-position matches with `reduce`, and counts shared digits with `filter` and `includes`. Cows are the shared digits minus bulls. This also handles repeated digits in an invalid guess without counting one secret digit multiple times.
- `countPossibleSecrets` uses the recurrence `P(length, base) = base * P(length - 1, base - 1)`, with `P(0, base) = 1`. Impossible or invalid inputs return zero. A module-level `Map` memoizes each `(length, base)` pair.

## Complexity

Let `n` be the requested secret length and `b` the base.

| Function               | Time                                         | Additional space      | Reason                                                                                                                        |
| ---------------------- | -------------------------------------------- | --------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `generateSecret`       | `O(b + n)`                                   | `O(b + n)`            | It creates a `b`-digit working copy and performs one partial Fisher–Yates shuffle step for each of the `n` selected digits.   |
| `evaluateGuess`        | `O(n²)`                                      | `O(n)`                | The array operations are linear except for `includes` inside `filter`, which can scan up to `n` digits for each secret digit. |
| `isValidGuess`         | `O(n)` expected                              | `O(n)`                | It validates every character and builds a `Set` of normalized digits; set membership/insertion is expected constant time.     |
| `countPossibleSecrets` | `O(n)` on a cold call; `O(1)` on a cache hit | `O(n)` on a cold call | A cold call visits at most `n + 1` recurrence states and memoizes them, using recursion depth at most `n`.                    |

For this game, `b` is at most 16 and `n` is at most 6, so these operations remain small.

## Clean-code and functional-programming choices

- `src/core.ts` contains only game-logic functions; it does not read the DOM, browser storage, or global random state other than the default source passed to `generateSecret`. Tests inject deterministic random functions.
- `createDigitValidator` captures the selected base and returns a one-character predicate. It is reused by `isValidGuess` and the input filtering in `src/main.ts`.
- `evaluateGuess` uses named intermediate values and array methods rather than mutable counter loops. `countPossibleSecrets` keeps the recurrence visible and caches by an explicit key.
- `src/main.ts` keeps browser effects at the UI boundary. Round state and attempt objects are replaced instead of edited, and DOM nodes are built with `createElement` and `textContent` rather than HTML string injection.
- Functions have focused responsibilities: score parsing/validation, score persistence, duration formatting, length-option updates, and rendering are separate helpers in `src/main.ts`.
