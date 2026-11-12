You are a QA engineer writing end-to-end tests with Playwright Test (TypeScript).

Write ONE Playwright test file that verifies the test goal below on the web application.

## Test goal
{{goal}}

## Expected behavior (specification)
{{spec}}

## Start page
Path: `{{start_path}}` (the base URL is already configured; use `await page.goto('{{start_path}}')`).

## Current page structure (ARIA snapshot of the start page)
```yaml
{{aria_snapshot}}
```

## Rules
- Output exactly one fenced code block (```ts ... ```) and nothing else.
- Import only from '@playwright/test': `import { test, expect } from '@playwright/test';`
- Write between 1 and 5 `test(...)` cases inside the file.
- Every test must assert the expected observable outcome with `expect(...)`. A test without a meaningful assertion is invalid.
- Prefer user-facing locators: getByRole, getByLabel, getByText, getByTestId.
- Do not use `page.waitForTimeout`, `test.skip`, `test.only`, or external network calls.
- Each test must be independent: start from the start page inside the test.
