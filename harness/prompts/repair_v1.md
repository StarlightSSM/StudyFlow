The Playwright test file below failed when run against the correct (fault-free) version of the application.

## Test goal
{{goal}}

## Expected behavior (specification)
{{spec}}

## Current page structure (ARIA snapshot of the start page `{{start_path}}`)
```yaml
{{aria_snapshot}}
```

## Test file that failed
```ts
{{code}}
```

## Failure output from Playwright
```
{{error}}
```

## Task
Fix the test file so that it passes on the correct application while still verifying the expected behavior.
- Do NOT delete or weaken assertions just to make the test pass. Keep checking the specified outcome.
- Output exactly one fenced code block (```ts ... ```) containing the complete corrected file, and nothing else.
- Follow the same rules as before: import only from '@playwright/test', 1-5 tests, user-facing locators, no `page.waitForTimeout`, no `test.skip`/`test.only`.
