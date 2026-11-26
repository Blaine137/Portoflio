import path from 'node:path';
import { defineConfig } from '@playwright/test';

const results = path.resolve(process.cwd(), '../qa', process.env.QA_RUN || 'browser');

export default defineConfig({
  testDir: '.',
  testMatch: '**/*.spec.ts',
  outputDir: path.join(results, 'artifacts'),
  fullyParallel: true,
  workers: process.env.QA_WORKERS ? Number(process.env.QA_WORKERS) : 1,
  retries: 0,
  timeout: 75_000,
  expect: { timeout: 8_000 },
  reporter: [['list'], ['json', { outputFile: path.join(results, 'report.json') }]],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:4177',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
    { name: 'firefox', use: { browserName: 'firefox' } },
    { name: 'webkit', use: { browserName: 'webkit' } },
  ],
});
