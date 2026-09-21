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

test.describe('Admin Dashboard E2E', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('대시보드 페이지 정상 로드', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // 메인 대시보드 헤딩 확인
    await expect(page.locator('text=메인 대시보드')).toBeVisible({ timeout: 10000 });
  });

  test('오늘 날짜가 대시보드에 표시된다', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth() + 1;

    // 날짜 형식: "YYYY년 M월" 포함 여부
    await expect(page.locator(`text=${year}년 ${month}월`)).toBeVisible({ timeout: 10000 });
  });

  test('대시보드 주요 섹션이 렌더링된다', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // 페이지가 로드된 후 핵심 컨텐츠 영역 존재 확인 (빈 페이지가 아님)
    const body = page.locator('main, [class*="min-h-screen"], [class*="MuiBox"]').first();
    await expect(body).toBeVisible({ timeout: 10000 });

    // 로딩 스피너가 최종적으로 사라지는지 확인
    await expect(page.locator('[role="progressbar"]')).toHaveCount(0, { timeout: 15000 });
  });

  test('사이드바가 표시된다', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // 사이드바 네비게이션 아이템 확인
    await expect(page.locator('a[href="/admin/dashboard"]').first()).toBeVisible({ timeout: 10000 });
  });

  test('사이드바에서 사용자 관리 페이지로 이동', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // 사이드바에서 사용자 관리 링크 클릭
    await page.click('a[href="/admin/users/appearance"]');
    await page.waitForURL('**/admin/users/appearance', { timeout: 15000 });
    await page.waitForLoadState('networkidle');

    expect(page.url()).toContain('/admin/users/appearance');
  });

  test('사이드바에서 배너 관리 페이지로 이동', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    await page.click('a[href="/admin/banners"]');
    await page.waitForURL('**/admin/banners', { timeout: 15000 });
    await page.waitForLoadState('networkidle');

    expect(page.url()).toContain('/admin/banners');
  });

  test('사이드바에서 매칭 관리 페이지로 이동', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    await page.click('a[href="/admin/matching-management"]');
    await page.waitForURL('**/admin/matching-management', { timeout: 15000 });
    await page.waitForLoadState('networkidle');

    expect(page.url()).toContain('/admin/matching-management');
  });

  test('에러 발생 시에도 페이지가 크래시하지 않는다', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // 페이지가 빈 화면이 아닌지 확인 (에러 바운더리 없이 완전히 흰 화면이면 실패)
    const bodyText = await page.locator('body').innerText();
    expect(bodyText.trim().length).toBeGreaterThan(0);
  });
});
