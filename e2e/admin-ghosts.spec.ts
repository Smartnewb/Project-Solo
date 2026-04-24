import { test, expect, type Page } from '@playwright/test';

const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL || 'admin@test.com';
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD || 'admin1234';
const GHOSTS_URL = '/admin/ai-profiles/ghosts?view=card';

const DELETE_REASON = 'E2E 자동화 테스트 삭제 검증';
const BULK_DELETE_REASON = 'E2E 자동화 테스트 일괄 삭제';
const CREATE_REASON = 'E2E 자동화 테스트 생성 검증';

async function login(page: Page) {
  await page.goto('/');
  await page.fill('input[type="email"]', ADMIN_EMAIL);
  await page.fill('input[type="password"]', ADMIN_PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL('**/admin/**', { timeout: 20_000 });
}

async function gotoGhostsList(page: Page) {
  await page.goto(GHOSTS_URL);
  await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => undefined);
  await expect(page.getByRole('heading', { name: /가상 프로필 관리/ })).toBeVisible({ timeout: 15_000 });
}

async function getTrueTotal(page: Page): Promise<number> {
  return page.evaluate(async () => {
    const res = await fetch('/api/admin-proxy/admin/ghost-injection/ghosts?page=1&limit=1', {
      credentials: 'include',
    });
    if (!res.ok) throw new Error(`list ghosts failed: ${res.status}`);
    const data = await res.json();
    return data?.meta?.totalItems ?? 0;
  });
}

async function getGhostCardCount(page: Page): Promise<number> {
  const emptyText = page.locator('text=가상 프로필이 없습니다.');
  if (await emptyText.isVisible().catch(() => false)) return 0;
  const grid = page.locator('div.grid > div.cursor-pointer');
  return grid.count();
}

async function selectAllOnCardView(page: Page) {
  const cards = page.locator('div.grid > div.cursor-pointer');
  const count = await cards.count();
  for (let i = 0; i < count; i++) {
    const checkbox = cards.nth(i).locator('input[type="checkbox"]');
    if (!(await checkbox.isChecked())) {
      await checkbox.check();
    }
  }
}

async function bulkDeleteAllSelected(page: Page) {
  const selectionBar = page.locator('text=/\\d+.*개 선택됨/');
  await expect(selectionBar).toBeVisible({ timeout: 5_000 });

  await page.getByRole('button', { name: /선택 항목 삭제/ }).click();

  const dialog = page.getByRole('dialog');
  await expect(dialog.getByRole('heading', { name: /가상 프로필 일괄 삭제/ })).toBeVisible();

  const reasonInput = dialog.locator('textarea[placeholder*="변경 사유"]');
  await reasonInput.fill(BULK_DELETE_REASON);

  const confirmButton = dialog.getByRole('button', { name: /\d+개 영구 삭제/ });
  await confirmButton.click();

  const closeButton = dialog.getByRole('button', { name: /^닫기$/ });
  await expect(closeButton).toBeVisible({ timeout: 120_000 });
  await closeButton.click();
  await expect(dialog).toBeHidden({ timeout: 5_000 });
}

async function createSingleGhost(page: Page) {
  await page.getByRole('button', { name: /^프로필 생성$/ }).click();

  const dialog = page.getByRole('dialog');
  await expect(dialog.getByRole('heading', { name: /가상 프로필 일괄 생성/ })).toBeVisible();

  const reasonInput = dialog.locator('textarea[placeholder*="변경 사유"]');
  await reasonInput.fill(CREATE_REASON);

  const submitButton = dialog.getByRole('button', { name: /^\d+개 생성$/ });
  await submitButton.click();

  await expect(dialog.getByRole('heading', { name: /생성 결과/ })).toBeVisible({ timeout: 180_000 });
  await expect(dialog.locator('text=/성공.*1/')).toBeVisible();

  await dialog.getByRole('button', { name: /^닫기$/ }).click();
  await expect(dialog).toBeHidden({ timeout: 5_000 });
}

async function deleteFirstGhostFromDrawer(page: Page) {
  const cards = page.locator('div.grid > div.cursor-pointer');
  await expect(cards.first()).toBeVisible({ timeout: 10_000 });
  await cards.first().click();

  const drawer = page.getByRole('dialog').filter({ hasText: /프로필 상세|위험 구역/ });
  await expect(drawer).toBeVisible({ timeout: 10_000 });

  const dangerSection = drawer.locator('section').filter({ hasText: '위험 구역' });
  await dangerSection.scrollIntoViewIfNeeded();

  const reasonInput = dangerSection.locator('textarea[placeholder*="변경 사유"]');
  await reasonInput.fill(DELETE_REASON);

  await dangerSection.getByRole('button', { name: /가상 프로필 영구 삭제/ }).click();

  const confirmDialog = page.getByRole('dialog').filter({ hasText: /영구 삭제/ }).last();
  await expect(confirmDialog).toBeVisible({ timeout: 5_000 });

  await confirmDialog.getByRole('button', { name: /^영구 삭제$/ }).click();

  await expect(confirmDialog).toBeHidden({ timeout: 30_000 });
  await expect(drawer).toBeHidden({ timeout: 10_000 });
}

test.describe.configure({ mode: 'serial' });

test.describe('Admin Ghost Profile Full E2E', () => {
  test.setTimeout(600_000);

  test('로그인 → 카드 뷰 진입', async ({ page }) => {
    await login(page);
    await gotoGhostsList(page);
  });

  test('기존 가상 프로필 전체 일괄 삭제', async ({ page }) => {
    await login(page);
    await gotoGhostsList(page);

    let total = await getTrueTotal(page);
    let pass = 0;
    const MAX_PASSES = 50;

    while (total > 0 && pass < MAX_PASSES) {
      await selectAllOnCardView(page);
      await bulkDeleteAllSelected(page);
      await page.reload({ waitUntil: 'domcontentloaded' });
      await expect(page.getByRole('heading', { name: /가상 프로필 관리/ })).toBeVisible({ timeout: 20_000 });
      const newTotal = await getTrueTotal(page);
      if (newTotal >= total) {
        throw new Error(`일괄 삭제 후에도 total 감소 없음: pass=${pass}, before=${total}, after=${newTotal}`);
      }
      total = newTotal;
      pass += 1;
    }

    expect(total).toBe(0);
  });

  test('신규 가상 프로필 1개 생성', async ({ page }) => {
    await login(page);
    await gotoGhostsList(page);

    const beforeTotal = await getTrueTotal(page);
    await createSingleGhost(page);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: /가상 프로필 관리/ })).toBeVisible({ timeout: 15_000 });

    const afterTotal = await getTrueTotal(page);
    expect(afterTotal).toBe(beforeTotal + 1);
  });

  test('상세 drawer에서 단일 프로필 삭제', async ({ page }) => {
    await login(page);
    await gotoGhostsList(page);

    const beforeTotal = await getTrueTotal(page);
    expect(beforeTotal).toBeGreaterThan(0);

    await deleteFirstGhostFromDrawer(page);

    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: /가상 프로필 관리/ })).toBeVisible({ timeout: 15_000 });
    const afterTotal = await getTrueTotal(page);
    expect(afterTotal).toBe(beforeTotal - 1);
  });
});
