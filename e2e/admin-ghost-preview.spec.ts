import { expect, test, type Page } from '@playwright/test';

const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL || 'admin@test.com';
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD || 'admin1234';
const GHOSTS_URL = '/admin/ai-profiles/ghosts?view=card';
const PREVIEW_REASON = 'E2E 자동화 테스트 preview 검증 플로우';

async function login(page: Page) {
	await page.goto('/');
	await page.fill('input[type="email"]', ADMIN_EMAIL);
	await page.fill('input[type="password"]', ADMIN_PASSWORD);
	await page.click('button[type="submit"]');
	await page.waitForURL('**/admin/**', { timeout: 20_000 });
}

async function gotoGhostsList(page: Page) {
	await page.goto(GHOSTS_URL);
	await page
		.waitForLoadState('networkidle', { timeout: 15_000 })
		.catch(() => undefined);
	await expect(
		page.getByRole('heading', { name: /가상 프로필 관리/ }),
	).toBeVisible({ timeout: 15_000 });
}

test.describe.configure({ mode: 'serial' });

test.describe('Admin Ghost Preview Flow', () => {
	test.setTimeout(600_000);

	test('로그인 → 카드 뷰 진입', async ({ page }) => {
		await login(page);
		await gotoGhostsList(page);
	});

	test('프로필 생성 버튼 → preview setup 다이얼로그 오픈', async ({ page }) => {
		await login(page);
		await gotoGhostsList(page);

		await page.getByRole('button', { name: /^프로필 생성$/ }).click();

		const dialog = page.getByRole('dialog');
		await expect(dialog).toBeVisible({ timeout: 5_000 });

		// Setup phase heading (matches SetupPhase h2)
		await expect(
			dialog.getByRole('heading', { name: /가상 프로필 미리보기 생성/ }),
		).toBeVisible({ timeout: 5_000 });

		// Setup phase controls: count input + submit button
		await expect(dialog.locator('input[type="number"]').first()).toBeVisible();
		await expect(
			dialog.getByRole('button', { name: /\d+개 미리보기 생성/ }),
		).toBeVisible();
	});

	test('preview 생성 (count=2) → review 카드 표시 → 취소', async ({ page }) => {
		await login(page);
		await gotoGhostsList(page);

		await page.getByRole('button', { name: /^프로필 생성$/ }).click();

		const dialog = page.getByRole('dialog');
		await expect(dialog).toBeVisible({ timeout: 5_000 });
		await expect(
			dialog.getByRole('heading', { name: /가상 프로필 미리보기 생성/ }),
		).toBeVisible();

		// Fill count=2
		const countInput = dialog.locator('input[type="number"]').first();
		await countInput.fill('2');

		// Submit setup → triggers createBatchPreview (Gemini calls, long wait)
		await dialog
			.getByRole('button', { name: /\d+개 미리보기 생성/ })
			.click();

		// Wait for review phase heading
		await expect(
			dialog.getByRole('heading', { name: /프로필 미리보기 검토/ }),
		).toBeVisible({ timeout: 180_000 });

		// Verify total badge shows 2
		await expect(dialog.getByText(/총\s*2\s*개/)).toBeVisible({
			timeout: 180_000,
		});

		// Fill reason (>= 10 chars) so eventual actions satisfy validation
		const reasonInput = dialog.locator('textarea[placeholder*="변경 사유"]');
		await reasonInput.fill(PREVIEW_REASON);

		// Click "취소 (미리보기 삭제)" → deleteBatchPreview → dialog closes on success
		await dialog
			.getByRole('button', { name: /취소.*미리보기 삭제/ })
			.click();

		await expect(dialog).toBeHidden({ timeout: 15_000 });
	});
});
