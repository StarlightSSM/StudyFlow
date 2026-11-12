import { test, expect } from '@playwright/test';

test('increments count on button click', async ({ page }) => {
  await page.goto('/');

  const counterButton = page.getByRole('button', { name: /Count is/ });

  // Check initial state
  await expect(counterButton).toHaveText('Count is 0');

  // Click once and verify count is 1
  await counterButton.click();
  await expect(counterButton).toHaveText('Count is 1');

  // Click a second time and verify count is 2
  await counterButton.click();
  await expect(counterButton).toHaveText('Count is 2');
});
