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

test.describe('Admin Users Page E2E', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/users/appearance');
    await page.waitForURL('**/admin/users/appearance', { timeout: 15000 });
    await page.waitForLoadState('networkidle');
  });

  test('사용자 관리 페이지가 정상 로드된다', async ({ page }) => {
    // 로딩 스피너가 사라질 때까지 대기
    await expect(page.locator('[role="progressbar"]')).toHaveCount(0, { timeout: 20000 });

    // 페이지에 컨텐츠가 있어야 함
    const bodyText = await page.locator('body').innerText();
    expect(bodyText.trim().length).toBeGreaterThan(0);
  });

  test('탭 네비게이션이 표시된다', async ({ page }) => {
    await expect(page.locator('[role="progressbar"]')).toHaveCount(0, { timeout: 20000 });

    // MUI Tabs 컴포넌트 확인
    const tabs = page.locator('[role="tab"]');
    await expect(tabs.first()).toBeVisible({ timeout: 10000 });
  });

  test('사용자 테이블 또는 리스트가 렌더링된다', async ({ page }) => {
    await expect(page.locator('[role="progressbar"]')).toHaveCount(0, { timeout: 20000 });

    // 테이블 또는 리스트 컨테이너 확인
    const tableOrList = page.locator('table, [role="table"], [role="list"]').first();
    await expect(tableOrList).toBeVisible({ timeout: 15000 });
  });

  test('검색 입력 필드가 존재하고 입력 가능하다', async ({ page }) => {
    await expect(page.locator('[role="progressbar"]')).toHaveCount(0, { timeout: 20000 });

    // 검색 input 찾기 (TextField, input 등)
    const searchInput = page.locator('input[type="text"], input[placeholder*="검색"], input[placeholder*="search"]').first();
    await expect(searchInput).toBeVisible({ timeout: 10000 });

    // 텍스트 입력 가능한지 확인
    await searchInput.fill('테스트');
    await expect(searchInput).toHaveValue('테스트');
  });

  test('검색어 입력 후 엔터를 누르면 검색이 실행된다', async ({ page }) => {
    await expect(page.locator('[role="progressbar"]')).toHaveCount(0, { timeout: 20000 });

    const searchInput = page.locator('input[type="text"], input[placeholder*="검색"], input[placeholder*="search"]').first();
    await expect(searchInput).toBeVisible({ timeout: 10000 });

    await searchInput.fill('test@example.com');
    await searchInput.press('Enter');

    // 검색 후 로딩이 다시 완료될 때까지 대기
    await page.waitForLoadState('networkidle');
    await expect(page.locator('[role="progressbar"]')).toHaveCount(0, { timeout: 15000 });

    // URL이 변경되거나 페이지가 크래시하지 않음을 확인
    expect(page.url()).toContain('/admin/users/appearance');
  });

  test('탭 전환이 정상 동작한다', async ({ page }) => {
    await expect(page.locator('[role="progressbar"]')).toHaveCount(0, { timeout: 20000 });

    const tabs = page.locator('[role="tab"]');
    const tabCount = await tabs.count();

    if (tabCount >= 2) {
      // 두 번째 탭 클릭
      await tabs.nth(1).click();
      await page.waitForLoadState('networkidle');

      // 두 번째 탭이 선택된 상태가 됨
      const secondTab = tabs.nth(1);
      const ariaSelected = await secondTab.getAttribute('aria-selected');
      expect(ariaSelected).toBe('true');
    }
  });
});
