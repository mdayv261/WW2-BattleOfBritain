// Build settings. The game is published at https://mdayv261.github.io/WW2-BattleOfBritain/,
// so every built file is addressed from that folder rather than the site root.
import { defineConfig } from 'vite';

export const BASE_PATH = '/WW2-BattleOfBritain/';

export default defineConfig({
  base: BASE_PATH,
  test: {
    include: ['tests/**/*.test.js'],
  },
});
