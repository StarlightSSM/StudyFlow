import { test, expect } from '@playwright/test';

test.describe('Counter button', () => {
  test('increments the count when clicked', async ({ page }) => {
    await page.goto('/');

    const counterButton = page.getByRole('button', { name: /Count is/ });

    // Verify initial count is 0
    await expect(counterButton).toHaveText('Count is 0');

    // Click once and verify count becomes 1
    await counterButton.click();
    await expect(counterButton).toHaveText('Count is 1');

    // Click again and verify count becomes 2
    await counterButton.click();
    await expect(counterButton).toHaveText('Count is 2');
  });
});
