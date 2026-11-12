import { test, expect } from '@playwright/test';

test.describe('과제 완료 처리 기능', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/tasks');
  });

  test('미완료 과제의 체크박스를 선택하면 완료 상태로 바뀌고, 해제하면 미완료 상태로 바뀐다', async ({ page }) => {
    const taskName = '네트워크 시각화 과제';
    const row = page.getByRole('row', { name: new RegExp(taskName) });
    const checkbox = page.getByRole('checkbox', { name: `${taskName} 완료` });

    // 초기 상태 확인
    await expect(checkbox).not.toBeChecked();
    await expect(row.getByRole('cell', { name: '미완료', exact: true })).toBeVisible();

    // 체크박스 선택하여 완료 처리
    await checkbox.check();
    await expect(checkbox).toBeChecked();
    await expect(row.getByRole('cell', { name: '완료', exact: true })).toBeVisible();

    // 체크박스 해제하여 미완료 처리
    await checkbox.uncheck();
    await expect(checkbox).not.toBeChecked();
    await expect(row.getByRole('cell', { name: '미완료', exact: true })).toBeVisible();
  });

  test('과제 상태 변경 후 페이지를 새로고침해도 변경된 상태가 유지된다', async ({ page }) => {
    const taskName = '신경망 역전파 정리';
    const row = page.getByRole('row', { name: new RegExp(taskName) });
    const checkbox = page.getByRole('checkbox', { name: `${taskName} 완료` });

    // 완료 상태로 변경
    await checkbox.check();
    await expect(checkbox).toBeChecked();
    await expect(row.getByRole('cell', { name: '완료', exact: true })).toBeVisible();

    // 페이지 새로고침
    await page.reload();

    // 새로고침 후 상태 유지 확인
    const reloadedRow = page.getByRole('row', { name: new RegExp(taskName) });
    const reloadedCheckbox = page.getByRole('checkbox', { name: `${taskName} 완료` });
    await expect(reloadedCheckbox).toBeChecked();
    await expect(reloadedRow.getByRole('cell', { name: '완료', exact: true })).toBeVisible();
  });

  test('상태 필터 선택 시 해당 상태의 과제만 표시된다', async ({ page }) => {
    const incompleteRadio = page.getByRole('radio', { name: '미완료' });
    const completeRadio = page.getByRole('radio', { name: '완료' });
    const allRadio = page.getByRole('radio', { name: '전체' });

    // 미완료 필터 선택
    await incompleteRadio.check();
    await expect(incompleteRadio).toBeChecked();
    await expect(page.getByRole('row', { name: /네트워크 시각화 과제/ })).toBeVisible();
    await expect(page.getByRole('row', { name: /링크 예측 실습/ })).not.toBeVisible();

    // 완료 필터 선택
    await completeRadio.check();
    await expect(completeRadio).toBeChecked();
    await expect(page.getByRole('row', { name: /네트워크 시각화 과제/ })).not.toBeVisible();
    await expect(page.getByRole('row', { name: /링크 예측 실습/ })).toBeVisible();

    // 전체 필터 선택
    await allRadio.check();
    await expect(allRadio).toBeChecked();
    await expect(page.getByRole('row', { name: /네트워크 시각화 과제/ })).toBeVisible();
    await expect(page.getByRole('row', { name: /링크 예측 실습/ })).toBeVisible();
  });
});
