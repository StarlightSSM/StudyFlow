import { defineConfig, devices } from '@playwright/test';

// Fixed execution environment for the experiment (PROTOCOL.md §실행 환경).
// The harness sets BASE_URL and PW_OUTPUT_DIR per run.
export default defineConfig({
  testDir: './llm-generated',
  fullyParallel: false,
  workers: 1,
  retries: 0, // flakiness is measured explicitly by the harness, never hidden by retries
  timeout: 30_000,
  expect: { timeout: 5_000 },
  outputDir: process.env.PW_OUTPUT_DIR ?? 'test-results',
  use: {
    baseURL: process.env.BASE_URL ?? 'http://localhost:5173',
    viewport: { width: 1280, height: 800 },
    locale: 'ko-KR',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } } }],
});
