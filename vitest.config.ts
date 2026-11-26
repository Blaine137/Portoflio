import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    include: ['tests/unit/**/*.test.tsx'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{js,jsx,ts,tsx}'],
      exclude: ['**/*.d.ts'],
      reporter: ['text', 'json-summary', 'html'],
      thresholds: {
        perFile: true,
        lines: 100,
        branches: 100,
        functions: 100,
        statements: 100,
      },
    },
  },
});
