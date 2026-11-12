import { test, expect } from '@playwright/test';

test('counter button increments when clicked', async ({ page }) => {
  await page.goto('/');

  const counterButton = page.getByRole('button', { name: /Count is/i });

  // Initial state verification
  await expect(counterButton).toHaveText('Count is 0');

  // Click once and verify increment to 1
  await counterButton.click();
  await expect(counterButton).toHaveText('Count is 1');

  // Click again and verify increment to 2
  await counterButton.click();
  await expect(counterButton).toHaveText('Count is 2');
});
