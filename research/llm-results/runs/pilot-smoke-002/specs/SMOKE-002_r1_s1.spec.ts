import { test, expect } from '@playwright/test';

test('카운터 버튼 클릭 시 카운트가 증가하는지 검증한다', async ({ page }) => {
  await page.goto('/');

  const counterButton = page.getByRole('button', { name: /count is/i });
  
  await expect(counterButton).toHaveText('Count is 0');
  
  await counterButton.click();
  
  await expect(counterButton).toHaveText('Count is 1');
});
