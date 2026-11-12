/**
 * Reference test for fault F1 (상태 갱신 누락) - human-written, NOT an LLM test.
 * Purpose (PROTOCOL.md §7): prove F1 is observable on its variant before it enters the experiment.
 *
 *   variant B, fault none -> must PASS
 *   variant B, fault F1   -> must FAIL, and the reach log must contain an F1 entry
 *
 * Precondition: DB reset to seed data (POST /api/__research/reset).
 */
import { expect, test } from '@playwright/test';

test('완료 처리하면 과제 현황의 완료 수가 1 증가한다 (F1 기준 테스트)', async ({ page }) => {
  await page.goto('/tasks');

  const summary = page.getByRole('region', { name: '과제 현황' });
  await expect(summary).toContainText('완료 4 / 전체 12');

  await page.getByRole('checkbox', { name: '중심성 지표 정리 완료' }).check();

  const row = page.getByRole('row', { name: /중심성 지표 정리/ });
  await expect(row.getByRole('cell').nth(3)).toHaveText('완료');
  await expect(summary).toContainText('완료 5 / 전체 12');
});
