import { defineConfig, devices } from '@playwright/test';

// Fixed execution environment for the experiment (PROTOCOL.md §5).
// The harness sets BASE_URL and PW_OUTPUT_DIR per run.
//   llm-generated/  LLM-generated suites (execution copies, git-ignored)
//   reference/      human-written reference tests, one per fault (fault validity, PROTOCOL.md §7)
export default defineConfig({
  testDir: '.',
  testMatch: ['llm-generated/**/*.spec.ts', 'reference/**/*.spec.ts'],
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
