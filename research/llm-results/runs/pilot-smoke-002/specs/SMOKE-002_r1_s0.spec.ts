import { test, expect } from '@playwright/test';

test('카운터 버튼 클릭 시 Clicks: 1에서 Clicks: 2로 변경되는지 검증한다', async ({ page }) => {
  await page.goto('/');

  const counterButton = page.getByRole('button');
  
  await expect(counterButton).toHaveText('Clicks: 1');
  
  await counterButton.click();
  
  await expect(counterButton).toHaveText('Clicks: 2');
});
