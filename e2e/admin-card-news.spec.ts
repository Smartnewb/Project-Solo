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

test.describe('Admin Card News Page E2E', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/card-news');
    await page.waitForURL('**/admin/card-news', { timeout: 15000 });
    await page.waitForLoadState('networkidle');
  });

  test('카드뉴스 목록 페이지가 정상 로드된다', async ({ page }) => {
    await expect(page.locator('[role="progressbar"]')).toHaveCount(0, { timeout: 20000 });

    expect(page.url()).toContain('/admin/card-news');
    const bodyText = await page.locator('body').innerText();
    expect(bodyText.trim().length).toBeGreaterThan(0);
  });

  test('카드뉴스 목록 테이블이 표시된다', async ({ page }) => {
    await expect(page.locator('[role="progressbar"]')).toHaveCount(0, { timeout: 20000 });

    // 테이블 헤더 확인
    const table = page.locator('table').first();
    await expect(table).toBeVisible({ timeout: 15000 });
  });

  test('카드뉴스 만들기 버튼이 존재한다', async ({ page }) => {
    await expect(page.locator('[role="progressbar"]')).toHaveCount(0, { timeout: 20000 });

    // "만들기", "작성", "추가", "새 카드뉴스" 등의 버튼
    const createButton = page.locator('button:has-text("만들기"), button:has-text("작성"), button:has-text("추가"), button:has-text("새"), button:has-text("카드뉴스")').first();
    await expect(createButton).toBeVisible({ timeout: 10000 });
  });

  test('카드뉴스 만들기 버튼 클릭 시 생성 페이지로 이동한다', async ({ page }) => {
    await expect(page.locator('[role="progressbar"]')).toHaveCount(0, { timeout: 20000 });

    const createButton = page.locator('button:has-text("만들기"), button:has-text("작성"), button:has-text("추가"), button:has-text("새"), button:has-text("카드뉴스")').first();
    await createButton.click();

    await page.waitForURL('**/admin/card-news/create', { timeout: 10000 });
    expect(page.url()).toContain('/admin/card-news/create');
  });

  test('카드뉴스 생성 페이지에 필수 폼 필드가 존재한다', async ({ page }) => {
    await page.goto('/admin/card-news/create');
    await page.waitForURL('**/admin/card-news/create', { timeout: 15000 });
    await page.waitForLoadState('networkidle');
    await expect(page.locator('[role="progressbar"]')).toHaveCount(0, { timeout: 20000 });

    // 제목 필드
    const titleInput = page.locator('input[name="title"], input[placeholder*="제목"]').first();
    await expect(titleInput).toBeVisible({ timeout: 10000 });

    // 설명 필드
    const descInput = page.locator('input[name="description"], textarea[name="description"], input[placeholder*="설명"], textarea[placeholder*="설명"]').first();
    await expect(descInput).toBeVisible({ timeout: 10000 });
  });

  test('카드뉴스 생성 페이지에서 빈 폼 제출 시 유효성 검사 오류가 표시된다', async ({ page }) => {
    await page.goto('/admin/card-news/create');
    await page.waitForURL('**/admin/card-news/create', { timeout: 15000 });
    await page.waitForLoadState('networkidle');
    await expect(page.locator('[role="progressbar"]')).toHaveCount(0, { timeout: 20000 });

    // 저장 버튼 클릭
    const saveButton = page.locator('button:has-text("저장"), button:has-text("등록"), button:has([data-testid="SaveIcon"])').first();
    await saveButton.click();

    // 유효성 오류 메시지 확인
    const errorMessages = page.locator('[class*="MuiFormHelperText"][class*="error"], .MuiFormHelperText-root.Mui-error, p.Mui-error').first();
    await expect(errorMessages).toBeVisible({ timeout: 5000 });
  });

  test('카드뉴스 생성 페이지에서 뒤로 가기가 동작한다', async ({ page }) => {
    await page.goto('/admin/card-news/create');
    await page.waitForURL('**/admin/card-news/create', { timeout: 15000 });
    await page.waitForLoadState('networkidle');

    // 뒤로 가기 버튼 (ArrowBackIcon 또는 "목록" 텍스트)
    const backButton = page.locator('button:has([data-testid="ArrowBackIcon"]), button:has-text("목록"), button:has-text("뒤로")').first();
    await expect(backButton).toBeVisible({ timeout: 10000 });
    await backButton.click();

    await page.waitForURL('**/admin/card-news', { timeout: 10000 });
    expect(page.url()).toContain('/admin/card-news');
  });

  test('카드뉴스 목록에서 섹션 추가 버튼이 생성 페이지에 존재한다', async ({ page }) => {
    await page.goto('/admin/card-news/create');
    await page.waitForURL('**/admin/card-news/create', { timeout: 15000 });
    await page.waitForLoadState('networkidle');
    await expect(page.locator('[role="progressbar"]')).toHaveCount(0, { timeout: 20000 });

    // 섹션 추가 버튼 (AddIcon 또는 "섹션 추가" 텍스트)
    const addSectionButton = page.locator('button:has([data-testid="AddIcon"]), button:has-text("섹션"), button:has-text("카드 추가")').first();
    await expect(addSectionButton).toBeVisible({ timeout: 10000 });
  });
});
