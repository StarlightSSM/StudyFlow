import { test, expect } from '@playwright/test';

test.describe('과제 완료 처리 기능 검증', () => {
  test('미완료 과제 체크 시 상태가 완료로 변경되고 과제 현황이 즉시 갱신되며, 체크 해제 시 원복된다', async ({ page }) => {
    await page.goto('/tasks');

    const taskRow = page.getByRole('row', { name: /네트워크 시각화 과제/ });
    const checkbox = page.getByRole('checkbox', { name: '네트워크 시각화 과제 완료' });
    const statusRegion = page.getByRole('region', { name: '과제 현황' });

    // 초기 상태 검증 (완료 4 / 전체 12, 미완료 8, 33%)
    await expect(taskRow.getByRole('cell', { name: '미완료', exact: true })).toBeVisible();
    await expect(statusRegion.getByText('완료 4 / 전체 12')).toBeVisible();
    await expect(statusRegion.getByText('미완료 8')).toBeVisible();
    await expect(statusRegion.getByText('33%')).toBeVisible();

    // 체크박스 선택하여 완료 처리
    await checkbox.check();

    // 상태 변경 및 현황 수치 갱신 확인 (완료 5 / 전체 12, 미완료 7, 42%)
    await expect(taskRow.getByRole('cell', { name: '완료', exact: true })).toBeVisible();
    await expect(statusRegion.getByText('완료 5 / 전체 12')).toBeVisible();
    await expect(statusRegion.getByText('미완료 7')).toBeVisible();
    await expect(statusRegion.getByText('42%')).toBeVisible();

    // 체크 해제하여 미완료로 변경
    await checkbox.uncheck();

    // 상태 및 현황 수치 원복 확인
    await expect(taskRow.getByRole('cell', { name: '미완료', exact: true })).toBeVisible();
    await expect(statusRegion.getByText('완료 4 / 전체 12')).toBeVisible();
    await expect(statusRegion.getByText('미완료 8')).toBeVisible();
    await expect(statusRegion.getByText('33%')).toBeVisible();
  });

  test("'미완료' 필터 선택 상태에서 과제를 완료 처리하면 해당 과제가 목록에서 즉시 사라진다", async ({ page }) => {
    await page.goto('/tasks');

    // '미완료' 상태 필터 선택
    await page.getByRole('radio', { name: '미완료' }).check();

    const taskRow = page.getByRole('row', { name: /신경망 역전파 정리/ });
    const checkbox = page.getByRole('checkbox', { name: '신경망 역전파 정리 완료' });

    await expect(taskRow).toBeVisible();

    // 과제 완료 처리
    await checkbox.check();

    // 목록에서 과제가 사라졌는지 확인
    await expect(taskRow).not.toBeVisible();

    // 테스트 간 데이터 독립성을 위해 원복
    await page.getByRole('radio', { name: '완료', exact: true }).check();
    await page.getByRole('checkbox', { name: '신경망 역전파 정리 완료' }).uncheck();
    await page.getByRole('radio', { name: '전체' }).check();
  });

  test('과제 완료 상태 변경 후 페이지를 새로고침해도 변경된 상태가 유지된다', async ({ page }) => {
    await page.goto('/tasks');

    const checkbox = page.getByRole('checkbox', { name: '기말 프로젝트 제안서 완료' });
    const taskRow = page.getByRole('row', { name: /기말 프로젝트 제안서/ });
    const statusRegion = page.getByRole('region', { name: '과제 현황' });

    // 완료 처리
    await checkbox.check();
    await expect(taskRow.getByRole('cell', { name: '완료', exact: true })).toBeVisible();
    await expect(statusRegion.getByText('완료 5 / 전체 12')).toBeVisible();

    // 페이지 새로고침
    await page.reload();

    // 새로고침 후에도 상태 유지 확인
    await expect(page.getByRole('checkbox', { name: '기말 프로젝트 제안서 완료' })).toBeChecked();
    await expect(page.getByRole('row', { name: /기말 프로젝트 제안서/ }).getByRole('cell', { name: '완료', exact: true })).toBeVisible();
    await expect(statusRegion.getByText('완료 5 / 전체 12')).toBeVisible();

    // 테스트 원복
    await page.getByRole('checkbox', { name: '기말 프로젝트 제안서 완료' }).uncheck();
  });
});
