import {
  countPossibleSecrets,
  createDigitValidator,
  evaluateGuess,
  generateSecret,
  isValidGuess,
} from './core';
import './styles.css';

type Settings = Readonly<{ length: number; base: number }>;
type Attempt = Readonly<{ guess: string; bulls: number; cows: number }>;
type GameState = Readonly<{
  settings: Settings;
  secret: string;
  history: readonly Attempt[];
  startedAt: number;
  status: 'playing' | 'won';
}>;
type Score = Readonly<{
  attempts: number;
  elapsedMs: number;
  length: number;
  base: number;
  completedAt: number;
}>;
type StoredScores = Readonly<{ scores: readonly Score[]; error: string | null }>;

const SCORE_STORAGE_KEY = 'bulls-and-cows:scores';
const SCORE_LIMIT = 10;
const bases = [
  { value: 2, label: 'Binary', shortLabel: 'bin' },
  { value: 8, label: 'Octal', shortLabel: 'oct' },
  { value: 10, label: 'Decimal', shortLabel: 'dec' },
  { value: 16, label: 'Hexadecimal', shortLabel: 'hex' },
] as const;

const createElement = <Tag extends keyof HTMLElementTagNameMap>(
  tag: Tag,
  className = '',
  text = '',
): HTMLElementTagNameMap[Tag] => {
  const element = document.createElement(tag);
  element.className = className;
  element.textContent = text;
  return element;
};

const formatDuration = (milliseconds: number): string => {
  const totalSeconds = Math.floor(Math.max(0, milliseconds) / 1000);
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, '0');
  const seconds = (totalSeconds % 60).toString().padStart(2, '0');

  return `${minutes}:${seconds}`;
};

const getBaseName = (base: number): string =>
  bases.find((option) => option.value === base)?.shortLabel ?? `base ${base}`;

const isScore = (value: unknown): value is Score => {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  return (
    'attempts' in value &&
    typeof value.attempts === 'number' &&
    Number.isInteger(value.attempts) &&
    value.attempts > 0 &&
    'elapsedMs' in value &&
    typeof value.elapsedMs === 'number' &&
    Number.isFinite(value.elapsedMs) &&
    value.elapsedMs >= 0 &&
    'length' in value &&
    typeof value.length === 'number' &&
    Number.isInteger(value.length) &&
    'base' in value &&
    typeof value.base === 'number' &&
    Number.isInteger(value.base) &&
    'completedAt' in value &&
    typeof value.completedAt === 'number' &&
    Number.isFinite(value.completedAt)
  );
};

const readScores = (): StoredScores => {
  let serialized: string | null;
  try {
    serialized = localStorage.getItem(SCORE_STORAGE_KEY);
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'Storage access was denied.';
    return { scores: [], error: `Saved records could not be loaded: ${detail}` };
  }

  if (serialized === null) {
    return { scores: [], error: null };
  }

  try {
    const parsed: unknown = JSON.parse(serialized);
    if (!Array.isArray(parsed) || !parsed.every(isScore)) {
      return { scores: [], error: 'Saved records have an invalid format.' };
    }

    return { scores: parsed, error: null };
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'The saved data could not be parsed.';
    return { scores: [], error: `Saved records could not be read: ${detail}` };
  }
};

const saveScore = (score: Score): string | null => {
  const stored = readScores();
  if (stored.error !== null) {
    return stored.error;
  }

  const scores = [...stored.scores, score]
    .sort((left, right) => left.attempts - right.attempts || left.elapsedMs - right.elapsedMs)
    .slice(0, SCORE_LIMIT);

  try {
    localStorage.setItem(SCORE_STORAGE_KEY, JSON.stringify(scores));
    return null;
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'Storage access was denied.';
    return `Your win was recorded for this round, but could not be saved: ${detail}`;
  }
};

let activeGame: GameState | null = null;
let gameMessage = '';
let timerInterval: number | undefined;

const root = createElement('main', 'app-shell');
root.id = 'app';
document.body.append(root);

const updateLengthOptions = (
  select: HTMLSelectElement,
  base: number,
  selectedLength: number,
): void => {
  [...select.options].forEach((option) => {
    const length = Number(option.value);
    option.disabled = length > base;
  });

  select.value = String(Math.min(selectedLength, base));
};

const renderScorePanel = (): HTMLElement => {
  const section = createElement('section', 'panel scores-panel');
  section.setAttribute('aria-labelledby', 'scores-title');

  const heading = createElement('div', 'section-heading');
  const scoreTitle = createElement('h2', '', 'Hall of fame');
  scoreTitle.id = 'scores-title';
  heading.append(createElement('div', 'eyebrow', 'PERSONAL BESTS'), scoreTitle);
  section.append(heading);

  const stored = readScores();
  if (stored.error !== null) {
    const error = createElement('p', 'storage-error', stored.error);
    error.setAttribute('role', 'status');
    section.append(error);
  } else if (stored.scores.length === 0) {
    section.append(createElement('p', 'empty-state', 'Your first win is waiting here.'));
  } else {
    const list = createElement('ol', 'score-list');
    stored.scores.forEach((score, index) => {
      const item = createElement('li', 'score-row');
      const rank = createElement('span', 'score-rank', String(index + 1).padStart(2, '0'));
      const details = createElement('span', 'score-details');
      details.append(
        createElement(
          'span',
          'score-settings',
          `${score.length} digits · ${getBaseName(score.base)}`,
        ),
        createElement(
          'span',
          'score-meta',
          `${score.attempts} ${score.attempts === 1 ? 'guess' : 'guesses'} · ${formatDuration(score.elapsedMs)}`,
        ),
      );
      item.append(rank, details);
      list.append(item);
    });
    section.append(list);
  }

  return section;
};

const renderSetup = (): void => {
  const layout = createElement('div', 'page-layout');
  const content = createElement('div', 'main-column');
  const intro = createElement('section', 'intro');
  const introTitle = createElement('h1', '');
  introTitle.append(
    document.createTextNode('Bulls '),
    createElement('span', 'title-amp', '&'),
    document.createTextNode(' Cows'),
  );
  intro.append(
    createElement('p', 'eyebrow', 'A GAME OF LOGIC'),
    introTitle,
    createElement(
      'p',
      'intro-copy',
      'A secret sequence is hiding in plain sight. Find the right digits in the right order.',
    ),
  );

  const card = createElement('section', 'panel setup-panel');
  card.setAttribute('aria-labelledby', 'setup-title');
  const setupTitle = createElement('h2', '', 'Choose your challenge');
  setupTitle.id = 'setup-title';
  card.append(createElement('div', 'step-label', '01 / SET UP YOUR ROUND'), setupTitle);

  const form = createElement('form', 'settings-form');
  const baseField = createElement('label', 'field');
  baseField.append(createElement('span', 'field-label', 'Number system'));
  const baseSelect = createElement('select', 'select-control');
  baseSelect.name = 'base';
  baseSelect.setAttribute('aria-label', 'Number system');
  bases.forEach(({ value, label }) => {
    const option = createElement('option', '', label);
    option.value = String(value);
    baseSelect.append(option);
  });
  baseSelect.value = '10';
  baseField.append(baseSelect);

  const lengthField = createElement('label', 'field');
  lengthField.append(createElement('span', 'field-label', 'Secret length'));
  const lengthSelect = createElement('select', 'select-control');
  lengthSelect.name = 'length';
  lengthSelect.setAttribute('aria-label', 'Secret length');
  for (let length = 2; length <= 6; length += 1) {
    const option = createElement('option', '', `${length} digits`);
    option.value = String(length);
    lengthSelect.append(option);
  }
  lengthSelect.value = '4';
  lengthField.append(lengthSelect);

  const countHint = createElement('p', 'count-hint');
  const updateCountHint = (): void => {
    const count = countPossibleSecrets(Number(lengthSelect.value), Number(baseSelect.value));
    countHint.textContent = `${count.toLocaleString()} possible secrets`;
  };
  baseSelect.addEventListener('change', () => {
    updateLengthOptions(lengthSelect, Number(baseSelect.value), Number(lengthSelect.value));
    updateCountHint();
  });
  lengthSelect.addEventListener('change', updateCountHint);
  updateCountHint();

  const startButton = createElement('button', 'button button-primary', 'Start a new round');
  startButton.type = 'submit';
  form.append(baseField, lengthField, countHint, startButton);
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const settings = {
      length: Number(lengthSelect.value),
      base: Number(baseSelect.value),
    };
    activeGame = {
      settings,
      secret: generateSecret(settings.length, settings.base),
      history: [],
      startedAt: Date.now(),
      status: 'playing',
    };
    gameMessage = '';
    renderApp();
  });

  card.append(form);
  const howTo = createElement('div', 'how-to');
  howTo.append(
    createElement('span', 'how-to-marker', 'i'),
    createElement(
      'p',
      '',
      'A bull is a correct digit in the correct place. A cow is a correct digit in the wrong place.',
    ),
  );
  content.append(intro, card, howTo);
  layout.append(content, renderScorePanel());
  root.replaceChildren(layout);
};

const renderGame = (): void => {
  if (activeGame === null) {
    renderSetup();
    return;
  }

  const game = activeGame;
  const layout = createElement('div', 'page-layout');
  const content = createElement('div', 'main-column');
  const header = createElement('header', 'game-header');
  const titleGroup = createElement('div', '');
  titleGroup.append(
    createElement('p', 'eyebrow', 'YOUR ROUND'),
    createElement('h1', '', 'Crack the code'),
  );
  const newGameButton = createElement('button', 'button button-quiet', 'New game');
  newGameButton.type = 'button';
  newGameButton.addEventListener('click', () => {
    activeGame = null;
    gameMessage = '';
    renderApp();
  });
  header.append(titleGroup, newGameButton);

  const statusBar = createElement('div', 'round-status');
  const statusItem = (label: string, value: string): HTMLElement => {
    const item = createElement('div', 'status-item');
    item.append(createElement('span', 'status-label', label), createElement('strong', '', value));
    return item;
  };
  const timer = createElement('strong', 'timer-value', formatDuration(Date.now() - game.startedAt));
  const timerItem = createElement('div', 'status-item');
  timerItem.append(createElement('span', 'status-label', 'TIME'), timer);
  statusBar.append(
    statusItem('SYSTEM', `${game.settings.length} digits · ${getBaseName(game.settings.base)}`),
    statusItem('GUESSES', String(game.history.length)),
    timerItem,
  );

  const playPanel = createElement('section', 'panel play-panel');
  const heading = createElement('div', 'play-heading');
  heading.append(
    createElement('div', 'step-label', '02 / MAKE YOUR GUESS'),
    createElement('h2', '', game.status === 'won' ? 'A perfect deduction.' : 'What is your guess?'),
  );
  playPanel.append(heading);

  if (game.status === 'playing') {
    const form = createElement('form', 'guess-form');
    const guessInput = createElement('input', 'guess-input');
    guessInput.type = 'text';
    guessInput.name = 'guess';
    guessInput.inputMode = 'text';
    guessInput.autocomplete = 'off';
    guessInput.autocapitalize = 'characters';
    guessInput.spellcheck = false;
    guessInput.maxLength = game.settings.length;
    guessInput.placeholder = 'e.g. 2048';
    guessInput.setAttribute('aria-label', 'Your guess');
    guessInput.setAttribute('aria-describedby', 'guess-help guess-message');
    const isDigitValid = createDigitValidator(game.settings.base);
    const message = createElement('p', 'form-message');
    message.id = 'guess-message';
    message.setAttribute('role', 'status');
    message.textContent = gameMessage;

    const submitButton = createElement('button', 'button button-primary', 'Check my guess');
    submitButton.type = 'submit';
    submitButton.disabled = true;
    guessInput.addEventListener('input', () => {
      const sanitized = [...guessInput.value].filter(isDigitValid).slice(0, game.settings.length);
      const value = sanitized.join('');
      if (value !== guessInput.value) {
        guessInput.value = value;
      }
      submitButton.disabled = value.length !== game.settings.length;
      message.textContent = '';
      gameMessage = '';
    });
    form.append(guessInput, submitButton);
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const currentGame = activeGame;
      if (currentGame === null || currentGame.status !== 'playing') {
        return;
      }

      const guess = guessInput.value;
      if (!isValidGuess(guess, currentGame.settings.length, currentGame.settings.base)) {
        gameMessage = `Enter ${currentGame.settings.length} unique valid digits.`;
        renderApp();
        return;
      }

      const normalizedGuess = guess.toLowerCase();
      if (currentGame.history.some((attempt) => attempt.guess.toLowerCase() === normalizedGuess)) {
        gameMessage = 'You already tried that sequence. Choose a different guess.';
        renderApp();
        return;
      }

      const result = evaluateGuess(currentGame.secret, guess);
      const attempt: Attempt = Object.freeze({ guess, ...result });
      const history = [...currentGame.history, attempt];
      const won = result.bulls === currentGame.settings.length;
      activeGame = {
        ...currentGame,
        history,
        status: won ? 'won' : 'playing',
      };

      if (won) {
        const saveError = saveScore({
          attempts: history.length,
          elapsedMs: Date.now() - currentGame.startedAt,
          length: currentGame.settings.length,
          base: currentGame.settings.base,
          completedAt: Date.now(),
        });
        gameMessage = saveError ?? 'You found the secret. Nicely played!';
      } else {
        gameMessage = 'Not quite. Use the clues below to narrow it down.';
      }

      renderApp();
    });

    playPanel.append(
      form,
      createElement(
        'p',
        'input-help',
        `${game.settings.length} unique digits · valid for ${getBaseName(game.settings.base)}`,
      ),
    );
    const help = createElement('span', 'visually-hidden', 'Enter a sequence of valid digits.');
    help.id = 'guess-help';
    form.append(help, message);
  } else {
    const outcome = createElement('div', 'win-message');
    outcome.append(
      createElement(
        'p',
        'win-copy',
        `Solved in ${game.history.length} ${game.history.length === 1 ? 'guess' : 'guesses'} and ${formatDuration(Date.now() - game.startedAt)}.`,
      ),
      createElement('p', 'storage-note', gameMessage),
    );
    playPanel.append(outcome);
  }

  const historyPanel = createElement('section', 'panel history-panel');
  historyPanel.setAttribute('aria-labelledby', 'history-title');
  const historyHeading = createElement('div', 'section-heading');
  const historyTitle = createElement('h2', '', `Guess history (${game.history.length})`);
  historyTitle.id = 'history-title';
  historyHeading.append(createElement('div', 'eyebrow', 'THE PAPER TRAIL'), historyTitle);
  historyPanel.append(historyHeading);

  if (game.history.length === 0) {
    historyPanel.append(
      createElement('p', 'empty-state', 'Your guesses and clues will appear here.'),
    );
  } else {
    const list = createElement('ol', 'history-list');
    game.history.forEach((attempt, index) => {
      const item = createElement('li', 'history-row');
      const number = createElement('span', 'history-number', String(index + 1).padStart(2, '0'));
      const guess = createElement('span', 'history-guess', attempt.guess);
      const result = createElement('span', 'history-result');
      result.append(
        createElement('span', 'result-bulls', `${attempt.bulls} bulls`),
        createElement('span', 'result-divider', '·'),
        createElement('span', 'result-cows', `${attempt.cows} cows`),
      );
      item.append(number, guess, result);
      list.append(item);
    });
    historyPanel.append(list);
  }

  content.append(header, statusBar, playPanel, historyPanel);
  layout.append(content, renderScorePanel());
  root.replaceChildren(layout);

  if (timerInterval !== undefined) {
    window.clearInterval(timerInterval);
    timerInterval = undefined;
  }
  if (game.status === 'playing') {
    timerInterval = window.setInterval(() => {
      timer.textContent = formatDuration(Date.now() - game.startedAt);
    }, 1000);
    root.querySelector<HTMLInputElement>('.guess-input')?.focus();
  }
};

const renderApp = (): void => {
  if (timerInterval !== undefined) {
    window.clearInterval(timerInterval);
    timerInterval = undefined;
  }

  if (activeGame === null) {
    renderSetup();
  } else {
    renderGame();
  }
};

renderApp();
