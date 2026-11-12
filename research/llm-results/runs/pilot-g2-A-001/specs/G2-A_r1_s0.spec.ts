import { test, expect } from '@playwright/test';

test.describe('과제 완료 처리 기능 검증', () => {
  test('미완료 과제 체크박스를 선택하면 완료 상태로 바뀌고 해제 시 미완료 상태로 돌아온다', async ({ page }) => {
    await page.goto('/tasks');

    const taskRow = page.getByRole('row').filter({ hasText: '네트워크 시각화 과제' });
    const checkbox = page.getByRole('checkbox', { name: '네트워크 시각화 과제 완료' });

    // 초기 상태가 미완료인지 확인
    await expect(taskRow.getByRole('cell', { name: '미완료', exact: true })).toBeVisible();
    await expect(checkbox).not.toBeChecked();

    // 체크박스 선택 후 상태가 완료로 변경되는지 확인
    await checkbox.check();
    await expect(taskRow.getByRole('cell', { name: '완료', exact: true })).toBeVisible();
    await expect(checkbox).toBeChecked();

    // 체크박스 해제 후 상태가 다시 미완료로 변경되는지 확인
    await checkbox.uncheck();
    await expect(taskRow.getByRole('cell', { name: '미완료', exact: true })).toBeVisible();
    await expect(checkbox).not.toBeChecked();
  });

  test('상태 변경 후 페이지를 새로고침해도 변경된 상태가 유지된다', async ({ page }) => {
    await page.goto('/tasks');

    const taskRow = page.getByRole('row').filter({ hasText: '신경망 역전파 정리' });
    const checkbox = page.getByRole('checkbox', { name: '신경망 역전파 정리 완료' });

    // 미완료 과제를 완료 처리
    await checkbox.check();
    await expect(taskRow.getByRole('cell', { name: '완료', exact: true })).toBeVisible();

    // 페이지 새로고침
    await page.reload();

    // 새로고침 후에도 완료 상태 및 체크박스 상태가 유지되는지 확인
    const reloadedRow = page.getByRole('row').filter({ hasText: '신경망 역전파 정리' });
    const reloadedCheckbox = page.getByRole('checkbox', { name: '신경망 역전파 정리 완료' });

    await expect(reloadedCheckbox).toBeChecked();
    await expect(reloadedRow.getByRole('cell', { name: '완료', exact: true })).toBeVisible();
  });

  test('상태 필터 선택에 따라 해당 상태의 과제만 표시된다', async ({ page }) => {
    await page.goto('/tasks');

    const incompleteTaskRow = page.getByRole('row').filter({ hasText: '네트워크 시각화 과제' });
    const completeTaskRow = page.getByRole('row').filter({ hasText: '링크 예측 실습' });

    // '미완료' 필터 선택 시 미완료 과제만 표시
    await page.getByRole('radio', { name: '미완료' }).check();
    await expect(incompleteTaskRow).toBeVisible();
    await expect(completeTaskRow).toBeHidden();

    // '완료' 필터 선택 시 완료 과제만 표시
    await page.getByRole('radio', { name: '완료' }).check();
    await expect(incompleteTaskRow).toBeHidden();
    await expect(completeTaskRow).toBeVisible();

    // '전체' 필터 선택 시 모든 과제 표시
    await page.getByRole('radio', { name: '전체' }).check();
    await expect(incompleteTaskRow).toBeVisible();
    await expect(completeTaskRow).toBeVisible();
  });
});
