import { test, expect } from '@playwright/test';

test.describe('과제 완료 처리 기능', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/tasks');
  });

  test('미완료 과제를 완료 처리 및 해제하면 과제 상태와 현황 통계가 즉시 갱신된다', async ({ page }) => {
    const statusRegion = page.getByRole('region', { name: '과제 현황' });
    const targetCheckbox = page.getByRole('checkbox', { name: '네트워크 시각화 과제 완료' });
    const targetRow = page.getByRole('row', { name: /네트워크 시각화 과제/ });

    // 초기 상태 검증
    await expect(statusRegion.getByText('완료 4 / 전체 12')).toBeVisible();
    await expect(statusRegion.getByText('미완료 8')).toBeVisible();
    await expect(statusRegion.getByText('33%')).toBeVisible();
    await expect(targetRow.getByRole('cell').nth(3)).toHaveText('미완료');

    // 과제 완료 처리 (체크)
    await targetCheckbox.check();

    // 완료 상태 및 현황 갱신 검증
    await expect(targetCheckbox).toBeChecked();
    await expect(targetRow.getByRole('cell').nth(3)).toHaveText('완료');
    await expect(statusRegion.getByText('완료 5 / 전체 12')).toBeVisible();
    await expect(statusRegion.getByText('미완료 7')).toBeVisible();
    await expect(statusRegion.getByText('42%')).toBeVisible();

    // 과제 완료 해제 (언체크)
    await targetCheckbox.uncheck();

    // 미완료 상태 원복 검증
    await expect(targetCheckbox).not.toBeChecked();
    await expect(targetRow.getByRole('cell').nth(3)).toHaveText('미완료');
    await expect(statusRegion.getByText('완료 4 / 전체 12')).toBeVisible();
    await expect(statusRegion.getByText('미완료 8')).toBeVisible();
    await expect(statusRegion.getByText('33%')).toBeVisible();
  });

  test('미완료 필터 상태에서 과제를 완료 처리하면 목록에서 즉시 사라진다', async ({ page }) => {
    // 상태 필터에서 '미완료' 선택
    await page.getByRole('radio', { name: '미완료' }).check();

    const targetCheckbox = page.getByRole('checkbox', { name: '네트워크 시각화 과제 완료' });
    await expect(targetCheckbox).toBeVisible();

    // 완료 처리
    await targetCheckbox.check();

    // 미완료 목록에서 해당 과제가 제거되었는지 검증
    await expect(targetCheckbox).not.toBeVisible();
  });

  test('과제 완료 변경 상태는 페이지 새로고침 후에도 유지된다', async ({ page }) => {
    const targetCheckbox = page.getByRole('checkbox', { name: '신경망 역전파 정리 완료' });

    // 완료 처리
    await targetCheckbox.check();
    await expect(targetCheckbox).toBeChecked();

    // 페이지 새로고침
    await page.reload();

    // 새로고침 후 변경 상태 유지 검증
    const reloadedCheckbox = page.getByRole('checkbox', { name: '신경망 역전파 정리 완료' });
    const reloadedRow = page.getByRole('row', { name: /신경망 역전파 정리/ });

    await expect(reloadedCheckbox).toBeChecked();
    await expect(reloadedRow.getByRole('cell').nth(3)).toHaveText('완료');
  });
});
