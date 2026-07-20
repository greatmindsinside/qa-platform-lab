/**
 * @fileoverview Vitest config for domain/API unit tests.
 */

import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  test: {
    include: ['tests/unit/**/*.test.ts'],
    environment: 'node',
  },
  resolve: {
    alias: {
      '@lab/shared': path.resolve(__dirname, 'packages/shared/src/index.ts'),
    },
  },
});
