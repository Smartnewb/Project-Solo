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

test.describe('Admin Banners Page E2E', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/banners');
    await page.waitForURL('**/admin/banners', { timeout: 15000 });
    await page.waitForLoadState('networkidle');
  });

  test('배너 관리 페이지가 정상 로드된다', async ({ page }) => {
    await expect(page.locator('[role="progressbar"]')).toHaveCount(0, { timeout: 20000 });

    const bodyText = await page.locator('body').innerText();
    expect(bodyText.trim().length).toBeGreaterThan(0);
    expect(page.url()).toContain('/admin/banners');
  });

  test('배너 위치 탭이 표시된다', async ({ page }) => {
    await expect(page.locator('[role="progressbar"]')).toHaveCount(0, { timeout: 20000 });

    // 배너 페이지는 위치별 탭(all, home, match 등)이 있음
    const tabs = page.locator('[role="tab"]');
    await expect(tabs.first()).toBeVisible({ timeout: 10000 });
    const tabCount = await tabs.count();
    expect(tabCount).toBeGreaterThanOrEqual(1);
  });

  test('배너 추가 버튼이 존재한다', async ({ page }) => {
    await expect(page.locator('[role="progressbar"]')).toHaveCount(0, { timeout: 20000 });

    // AddIcon 버튼 또는 "배너 추가" 텍스트 버튼
    const addButton = page.locator('button:has([data-testid="AddIcon"]), button:has-text("추가"), button:has-text("배너"), [aria-label*="추가"]').first();
    await expect(addButton).toBeVisible({ timeout: 10000 });
  });

  test('배너 추가 버튼 클릭 시 다이얼로그가 열린다', async ({ page }) => {
    await expect(page.locator('[role="progressbar"]')).toHaveCount(0, { timeout: 20000 });

    const addButton = page.locator('button:has([data-testid="AddIcon"]), button:has-text("추가"), button:has-text("배너"), [aria-label*="추가"]').first();
    await addButton.click();

    // MUI Dialog가 열림
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible({ timeout: 5000 });
  });

  test('배너 폼 다이얼로그에 필드가 존재한다', async ({ page }) => {
    await expect(page.locator('[role="progressbar"]')).toHaveCount(0, { timeout: 20000 });

    const addButton = page.locator('button:has([data-testid="AddIcon"]), button:has-text("추가"), button:has-text("배너"), [aria-label*="추가"]').first();
    await addButton.click();

    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible({ timeout: 5000 });

    // actionUrl 필드 확인
    const urlInput = dialog.locator('input[name="actionUrl"], input[placeholder*="URL"], input[placeholder*="url"]').first();
    await expect(urlInput).toBeVisible({ timeout: 5000 });
  });

  test('빈 폼 제출 시 유효성 검사 오류가 표시된다', async ({ page }) => {
    await expect(page.locator('[role="progressbar"]')).toHaveCount(0, { timeout: 20000 });

    const addButton = page.locator('button:has([data-testid="AddIcon"]), button:has-text("추가"), button:has-text("배너"), [aria-label*="추가"]').first();
    await addButton.click();

    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible({ timeout: 5000 });

    // 저장/등록 버튼 클릭 (이미지 없이)
    const submitButton = dialog.locator('button:has-text("저장"), button:has-text("등록"), button[type="submit"]').first();
    await submitButton.click();

    // 에러 메시지가 표시되어야 함 (이미지 미선택 또는 필드 오류)
    // MUI TextField의 helper text 또는 Alert 메시지
    const errorMessage = dialog.locator('[class*="error"], [class*="MuiFormHelperText"], .MuiAlert-root, text=필수, text=required, text=오류').first();
    await expect(errorMessage).toBeVisible({ timeout: 5000 });
  });

  test('다이얼로그 닫기 버튼이 동작한다', async ({ page }) => {
    await expect(page.locator('[role="progressbar"]')).toHaveCount(0, { timeout: 20000 });

    const addButton = page.locator('button:has([data-testid="AddIcon"]), button:has-text("추가"), button:has-text("배너"), [aria-label*="추가"]').first();
    await addButton.click();

    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible({ timeout: 5000 });

    // 취소 버튼 또는 닫기 버튼
    const cancelButton = dialog.locator('button:has-text("취소"), button:has-text("닫기"), button:has([data-testid="CloseIcon"])').first();
    await cancelButton.click();

    await expect(dialog).not.toBeVisible({ timeout: 5000 });
  });

  test('탭 전환이 정상 동작한다', async ({ page }) => {
    await expect(page.locator('[role="progressbar"]')).toHaveCount(0, { timeout: 20000 });

    const tabs = page.locator('[role="tab"]');
    const tabCount = await tabs.count();

    if (tabCount >= 2) {
      await tabs.nth(1).click();
      await page.waitForLoadState('networkidle');

      const secondTab = tabs.nth(1);
      const ariaSelected = await secondTab.getAttribute('aria-selected');
      expect(ariaSelected).toBe('true');
    }
  });
});
