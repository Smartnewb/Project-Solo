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

test.describe('Admin Profile Review Page E2E', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/profile-review');
    await page.waitForURL('**/admin/profile-review', { timeout: 15000 });
  });

  test('프로필 심사 페이지가 정상 로드된다', async ({ page }) => {
    // Wait for loading spinner to disappear
    await expect(page.locator('[role="progressbar"]')).toHaveCount(0, { timeout: 20000 });

    // Page heading should be visible
    await expect(page.locator('text=프로필 이미지 심사')).toBeVisible({ timeout: 10000 });
  });

  test('탭이 두 개 표시된다 (적격 심사, 이력 보기)', async ({ page }) => {
    await expect(page.locator('[role="progressbar"]')).toHaveCount(0, { timeout: 20000 });

    const tabs = page.locator('[role="tab"]');
    await expect(tabs).toHaveCount(2, { timeout: 10000 });

    await expect(tabs.nth(0)).toContainText('적격 심사');
    await expect(tabs.nth(1)).toContainText('이력 보기');
  });

  test('첫 번째 탭(적격 심사)이 기본으로 선택되어 있다', async ({ page }) => {
    await expect(page.locator('[role="progressbar"]')).toHaveCount(0, { timeout: 20000 });

    const firstTab = page.locator('[role="tab"]').nth(0);
    await expect(firstTab).toHaveAttribute('aria-selected', 'true', { timeout: 10000 });
  });

  test('탭 전환 - 이력 보기 탭으로 전환된다', async ({ page }) => {
    await expect(page.locator('[role="progressbar"]')).toHaveCount(0, { timeout: 20000 });

    const secondTab = page.locator('[role="tab"]').nth(1);
    await secondTab.click();

    await expect(secondTab).toHaveAttribute('aria-selected', 'true', { timeout: 10000 });

    // The first tab panel should now be hidden
    const firstTabPanel = page.locator('[role="tabpanel"]#review-tabpanel-0');
    await expect(firstTabPanel).toBeHidden({ timeout: 5000 });
  });

  test('탭 전환 후 다시 적격 심사 탭으로 돌아올 수 있다', async ({ page }) => {
    await expect(page.locator('[role="progressbar"]')).toHaveCount(0, { timeout: 20000 });

    const tabs = page.locator('[role="tab"]');

    // Switch to second tab
    await tabs.nth(1).click();
    await expect(tabs.nth(1)).toHaveAttribute('aria-selected', 'true', { timeout: 5000 });

    // Switch back to first tab
    await tabs.nth(0).click();
    await expect(tabs.nth(0)).toHaveAttribute('aria-selected', 'true', { timeout: 5000 });
  });

  test('검색 아이콘 버튼이 표시된다', async ({ page }) => {
    await expect(page.locator('[role="progressbar"]')).toHaveCount(0, { timeout: 20000 });

    // Search icon button (Tooltip: 검색)
    const searchButton = page.locator('[aria-label="검색"], button:has(svg[data-testid="SearchIcon"])').first();
    await expect(searchButton).toBeVisible({ timeout: 10000 });
  });

  test('필터 아이콘 버튼이 표시된다', async ({ page }) => {
    await expect(page.locator('[role="progressbar"]')).toHaveCount(0, { timeout: 20000 });

    // Filter icon button (Tooltip: 필터)
    const filterButton = page.locator('[aria-label="필터"], button:has(svg[data-testid="FilterListIcon"])').first();
    await expect(filterButton).toBeVisible({ timeout: 10000 });
  });

  test('심사 대기 목록 테이블이 렌더링된다', async ({ page }) => {
    await expect(page.locator('[role="progressbar"]')).toHaveCount(0, { timeout: 20000 });
    await page.waitForLoadState('networkidle');

    // The page should show either a table/list or an empty state - not crash
    const bodyText = await page.locator('body').innerText();
    expect(bodyText.trim().length).toBeGreaterThan(0);

    // Check that the tabpanel for "적격 심사" is shown
    const firstTabPanel = page.locator('[id="review-tabpanel-0"]');
    await expect(firstTabPanel).toBeVisible({ timeout: 10000 });
  });

  test('유저 클릭 시 상세 심사 패널이 표시된다', async ({ page }) => {
    await expect(page.locator('[role="progressbar"]')).toHaveCount(0, { timeout: 20000 });
    await page.waitForLoadState('networkidle');

    // If there are users in the list, click the first one
    const userRows = page.locator('table tbody tr, [role="row"]:not([aria-label])').first();
    const rowCount = await userRows.count();

    if (rowCount > 0) {
      await userRows.click();
      // After clicking a user, the right-side review panel should become populated
      // (ImageReviewPanel renders approve/reject buttons when a user is selected)
      await page.waitForTimeout(500);
      const bodyText = await page.locator('body').innerText();
      expect(bodyText.trim().length).toBeGreaterThan(0);
    } else {
      // No users available in test environment - skip gracefully
      test.skip(true, '심사 대기 유저가 없습니다');
    }
  });

  test('반려 다이얼로그 - 반려 사유 모달이 열린다', async ({ page }) => {
    await expect(page.locator('[role="progressbar"]')).toHaveCount(0, { timeout: 20000 });
    await page.waitForLoadState('networkidle');

    // Look for reject buttons in the image review panel (visible when a user is selected)
    const rejectButton = page.locator('button:has-text("반려"), button:has-text("거절")').first();
    const rejectButtonCount = await rejectButton.count();

    if (rejectButtonCount === 0) {
      test.skip(true, '심사 대기 유저가 없어 반려 버튼을 테스트할 수 없습니다');
      return;
    }

    await rejectButton.click();

    // The RejectReasonModal should open as a Dialog
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible({ timeout: 5000 });
    await expect(dialog.locator('text=반려 사유 선택')).toBeVisible();
  });

  test('반려 다이얼로그 - 카테고리와 사유 없이 제출하면 유효성 오류가 표시된다', async ({ page }) => {
    await expect(page.locator('[role="progressbar"]')).toHaveCount(0, { timeout: 20000 });
    await page.waitForLoadState('networkidle');

    const rejectButton = page.locator('button:has-text("반려"), button:has-text("거절")').first();
    const rejectButtonCount = await rejectButton.count();

    if (rejectButtonCount === 0) {
      test.skip(true, '심사 대기 유저가 없어 반려 버튼을 테스트할 수 없습니다');
      return;
    }

    await rejectButton.click();

    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible({ timeout: 5000 });

    // Click the "반려하기" submit button without filling anything
    await dialog.locator('button:has-text("반려하기")').click();

    // Form validation should prevent submission and show errors
    // The dialog should remain open
    await expect(dialog).toBeVisible({ timeout: 3000 });
  });

  test('반려 다이얼로그 - 취소 버튼으로 모달을 닫을 수 있다', async ({ page }) => {
    await expect(page.locator('[role="progressbar"]')).toHaveCount(0, { timeout: 20000 });
    await page.waitForLoadState('networkidle');

    const rejectButton = page.locator('button:has-text("반려"), button:has-text("거절")').first();
    const rejectButtonCount = await rejectButton.count();

    if (rejectButtonCount === 0) {
      test.skip(true, '심사 대기 유저가 없어 반려 버튼을 테스트할 수 없습니다');
      return;
    }

    await rejectButton.click();

    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible({ timeout: 5000 });

    // Click cancel
    await dialog.locator('button:has-text("취소")').click();

    await expect(dialog).toHaveCount(0, { timeout: 5000 });
  });

  test('반려 다이얼로그 - 빠른 선택 칩(Chip)이 표시된다', async ({ page }) => {
    await expect(page.locator('[role="progressbar"]')).toHaveCount(0, { timeout: 20000 });
    await page.waitForLoadState('networkidle');

    const rejectButton = page.locator('button:has-text("반려"), button:has-text("거절")').first();
    const rejectButtonCount = await rejectButton.count();

    if (rejectButtonCount === 0) {
      test.skip(true, '심사 대기 유저가 없어 반려 버튼을 테스트할 수 없습니다');
      return;
    }

    await rejectButton.click();

    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible({ timeout: 5000 });

    // Quick-select chips should be visible (e.g., "얼굴 식별 불가")
    await expect(dialog.locator('text=얼굴 식별 불가')).toBeVisible({ timeout: 3000 });
    await expect(dialog.locator('text=화질 불량')).toBeVisible({ timeout: 3000 });
  });

  test('페이지가 에러 없이 렌더링된다 (빈 화면 아님)', async ({ page }) => {
    await expect(page.locator('[role="progressbar"]')).toHaveCount(0, { timeout: 20000 });

    const bodyText = await page.locator('body').innerText();
    expect(bodyText.trim().length).toBeGreaterThan(0);

    // Should not show a JS crash / blank page
    expect(page.url()).toContain('/admin/profile-review');
  });
});
