import { test, expect } from '@playwright/test';

const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL || 'admin@test.com';
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD || 'admin1234';

async function loginAsAdmin(page: import('@playwright/test').Page) {
  await page.goto('/');
  await page.fill('input[type="email"], input[name="email"]', ADMIN_EMAIL);
  await page.fill('input[type="password"], input[name="password"]', ADMIN_PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL('**/admin/dashboard', { timeout: 15000 });
}

test.describe('Admin Matching Management Page E2E', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/matching-management');
    await page.waitForURL('**/admin/matching-management', { timeout: 15000 });
    await page.waitForLoadState('networkidle');
  });

  test('매칭 관리 페이지가 정상 로드된다', async ({ page }) => {
    await expect(page.locator('[role="progressbar"]')).toHaveCount(0, { timeout: 20000 });

    expect(page.url()).toContain('/admin/matching-management');
    const bodyText = await page.locator('body').innerText();
    expect(bodyText.trim().length).toBeGreaterThan(0);
  });

  test('매칭 관리 탭이 표시된다', async ({ page }) => {
    await expect(page.locator('[role="progressbar"]')).toHaveCount(0, { timeout: 20000 });

    // aria-label="매칭 관리 탭" 속성의 탭 컨테이너 확인
    const tabList = page.locator('[aria-label="매칭 관리 탭"]');
    await expect(tabList).toBeVisible({ timeout: 10000 });
  });

  test('첫 번째 탭(구슬 관리)이 기본 선택된다', async ({ page }) => {
    await expect(page.locator('[role="progressbar"]')).toHaveCount(0, { timeout: 20000 });

    const firstTab = page.locator('[role="tab"]:has-text("구슬 관리")');
    await expect(firstTab).toBeVisible({ timeout: 10000 });

    const ariaSelected = await firstTab.getAttribute('aria-selected');
    expect(ariaSelected).toBe('true');
  });

  test('매칭 내역 조회 탭으로 전환된다', async ({ page }) => {
    await expect(page.locator('[role="progressbar"]')).toHaveCount(0, { timeout: 20000 });

    const targetTab = page.locator('[role="tab"]:has-text("매칭 내역 조회")');
    await expect(targetTab).toBeVisible({ timeout: 10000 });
    await targetTab.click();

    await page.waitForLoadState('networkidle');

    const ariaSelected = await targetTab.getAttribute('aria-selected');
    expect(ariaSelected).toBe('true');
  });

  test('단일 매칭 탭으로 전환된다', async ({ page }) => {
    await expect(page.locator('[role="progressbar"]')).toHaveCount(0, { timeout: 20000 });

    const targetTab = page.locator('[role="tab"]:has-text("단일 매칭")');
    await expect(targetTab).toBeVisible({ timeout: 10000 });
    await targetTab.click();

    await page.waitForLoadState('networkidle');

    const ariaSelected = await targetTab.getAttribute('aria-selected');
    expect(ariaSelected).toBe('true');
  });

  test('매칭 시뮬레이션 탭으로 전환된다', async ({ page }) => {
    await expect(page.locator('[role="progressbar"]')).toHaveCount(0, { timeout: 20000 });

    const targetTab = page.locator('[role="tab"]:has-text("매칭 시뮬레이션")');
    await expect(targetTab).toBeVisible({ timeout: 10000 });
    await targetTab.click();

    await page.waitForLoadState('networkidle');

    const ariaSelected = await targetTab.getAttribute('aria-selected');
    expect(ariaSelected).toBe('true');
  });

  test('강제 매칭 탭으로 전환된다', async ({ page }) => {
    await expect(page.locator('[role="progressbar"]')).toHaveCount(0, { timeout: 20000 });

    const targetTab = page.locator('[role="tab"]:has-text("강제 매칭")');
    await expect(targetTab).toBeVisible({ timeout: 10000 });
    await targetTab.click();

    await page.waitForLoadState('networkidle');

    const ariaSelected = await targetTab.getAttribute('aria-selected');
    expect(ariaSelected).toBe('true');
  });

  test('탭 전환 후 페이지가 크래시하지 않는다', async ({ page }) => {
    await expect(page.locator('[role="progressbar"]')).toHaveCount(0, { timeout: 20000 });

    const tabs = page.locator('[aria-label="매칭 관리 탭"] [role="tab"]');
    const tabCount = await tabs.count();

    // 처음 3개 탭을 순서대로 전환하며 각 탭이 크래시 없이 동작하는지 확인
    const maxTabsToCheck = Math.min(tabCount, 3);
    for (let i = 0; i < maxTabsToCheck; i++) {
      await tabs.nth(i).click();
      await page.waitForTimeout(500);

      // 탭 전환 후 오류 페이지가 아닌지 확인
      const bodyText = await page.locator('body').innerText();
      expect(bodyText.trim().length).toBeGreaterThan(0);
    }
  });
});
