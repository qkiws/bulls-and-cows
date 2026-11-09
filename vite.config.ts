import { defineConfig } from 'vitest/config';

export default defineConfig({
  base: '/bulls-and-cows/',
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
});
