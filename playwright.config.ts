import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests',
  timeout: 30_000,
  use: { baseURL: 'http://localhost:4200', screenshot: 'on', headless: true },
  outputDir: './tests/results',
  reporter: [['list']],
});
