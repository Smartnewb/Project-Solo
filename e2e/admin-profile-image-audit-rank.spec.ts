import { expect, test, type Page, type Response, type TestInfo } from '@playwright/test';
import { sealData } from 'iron-session';
import type { ProfileImageAuditItem, ProfileImageAuditListResponse } from '../app/services/admin/profile-image-audit';

// Browser-to-BFF contract coverage; backend filtering has separate server tests.
const LIST_PATH = '/api/admin-proxy/admin/v2/profile-image-audit/images';
// Start the isolated Next server with this test-only ADMIN_SESSION_SECRET.
const QA_SESSION_SECRET = 'synthetic-rank-browser-qa-only-secret-32-chars';
const RANK_COUNTS = { S: 20, A: 4, B: 6, C: 8 } as const;
const ITEMS: ProfileImageAuditItem[] = (['S', 'A', 'B', 'C'] as const).flatMap((rank) =>
  ['FEMALE', 'MALE'].flatMap((gender) =>
    (['unreviewed', 'ok'] as const).flatMap((auditStatus) =>
      Array.from({ length: RANK_COUNTS[rank] }, (_, index): ProfileImageAuditItem => {
        const id = `qa-${rank}-${gender}-${auditStatus}-${index + 1}`;
        const image = `data:image/svg+xml,${encodeURIComponent(
          `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="320"><rect width="240" height="320" fill="#e0f2fe"/><text x="24" y="160" font-size="26" fill="#0f172a">QA ${rank} ${index + 1}</text></svg>`,
        )}`;
        return {
          profileImageId: id, imageId: `image-${id}`, userId: `user-${id}`,
          profileId: `profile-${id}`, imageUrl: image, thumbnailUrl: image,
          profileRank: rank, age: 24, gender,
          universityName: 'QA University', slotIndex: 0, isMain: true,
          reviewStatus: 'approved', reviewedType: 'admin',
          reviewedAt: '2026-09-01T00:00:00.000Z', rejectionReason: null,
          auditStatus, auditReviewedAt: null, auditReviewedBy: null,
          auditDecisionReason: null, isBlacklisted: false, suspendedAt: null,
          approvedImageCount: 2, totalActiveImageCount: 2, hasReport: false,
          siblingImages: [], validation: null,
          riskSignals: {
            reportCount: 0, hasSuspensionHistory: false, isFirstReview: false,
            isUniversityVerified: true, hasPurchaseHistory: false,
          },
        };
      }),
    ),
  ),
);

function listResponse(params: URLSearchParams): ProfileImageAuditListResponse {
  const filtered = ITEMS.filter((item) =>
    (!params.has('profileRank') || item.profileRank === params.get('profileRank')) &&
    (!params.has('gender') || item.gender === params.get('gender')) &&
    (!params.has('auditStatus') || item.auditStatus === params.get('auditStatus')),
  );
  const page = Number(params.get('page'));
  const limit = Number(params.get('limit'));
  return {
    data: filtered.slice((page - 1) * limit, page * limit),
    meta: { page, limit, total: filtered.length, totalPages: Math.ceil(filtered.length / limit) },
  };
}

function isListResponse(response: Response): boolean {
  return new URL(response.url()).pathname === LIST_PATH && response.request().method() === 'GET';
}

async function verifyResult(page: Page, response: Response, expected: {
  page: number; total: number; profileRank?: string; gender?: string; auditStatus?: string;
}) {
  expect(response.ok()).toBe(true);
  const params = new URL(response.url()).searchParams;
  expect(Object.fromEntries(params)).toEqual({
    page: String(expected.page), limit: '18',
    auditStatus: expected.auditStatus ?? 'unreviewed',
    includeSuspended: 'false', includeBlacklisted: 'false',
    ...(expected.profileRank ? { profileRank: expected.profileRank } : {}),
    ...(expected.gender ? { gender: expected.gender } : {}),
  });
  const body: ProfileImageAuditListResponse = await response.json();
  expect(body.meta.total).toBe(expected.total);
  const cards = page.getByTestId('profile-image-audit-card');
  await expect(cards).toHaveCount(body.data.length);
  // Exact IDs ensure a stale page or client-side filtering of the old page fails.
  const expectedIds = body.data.map((item) => `${item.profileImageId} 선택`);
  await expect(cards.first().getByRole('checkbox')).toHaveAttribute('aria-label', expectedIds[0]);
  expect(await cards.locator('input[type="checkbox"]').evaluateAll((inputs) =>
    inputs.map((input) => input.getAttribute('aria-label')),
  )).toEqual(expectedIds);
  const totalLabel = page.getByRole('heading', { name: '프로필 이미지 전수검사' }).locator('..').locator('p');
  // Assert the rendered numeric metadata, not prose wording.
  expect(Number((await totalLabel.innerText()).replace(/\D/g, ''))).toBe(expected.total);
  if (body.meta.totalPages > 1) {
    await expect(page.locator('.MuiPagination-root [aria-current="page"]')).toHaveText(String(expected.page));
  } else {
    await expect(page.locator('.MuiPagination-root')).toHaveCount(0);
  }
}

async function choose(page: Page, label: string, option: string): Promise<Response> {
  await page.getByRole('combobox', { name: label, exact: true }).click();
  const response = page.waitForResponse(isListResponse, { timeout: 10_000 });
  await page.getByRole('option', { name: option, exact: true }).click();
  return response;
}

async function pageTwo(page: Page): Promise<Response> {
  const response = page.waitForResponse(isListResponse, { timeout: 10_000 });
  await page.getByRole('button', { name: 'Go to page 2', exact: true }).click();
  return response;
}

test.beforeEach(async ({ context, page, baseURL }) => {
  if (!baseURL || !['localhost', '127.0.0.1', '[::1]'].includes(new URL(baseURL).hostname)) {
    throw new Error('Rank QA requires an isolated loopback Next server. Never target production.');
  }
  const origin = new URL(baseURL).origin;
  const unexpected: string[] = [];
  const requests: string[] = [];
  const runtimeErrors: string[] = [];
  page.on('pageerror', (error) => runtimeErrors.push(error.message));
  await context.addCookies([{
    name: 'admin_session_meta', url: baseURL,
    value: await sealData({
      id: 'qa-admin', email: 'rank-qa@example.test', roles: ['admin'],
      selectedCountry: 'kr', issuedAt: 1788998400000,
    }, { password: QA_SESSION_SECRET }),
  }]);
  // Fail closed: no API call or write can escape to Next's real BFF/backend.
  await context.route('**/*', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (url.protocol === 'data:') return route.continue();
    if (url.origin !== origin || request.method() !== 'GET') {
      unexpected.push(`${request.method()} ${url.origin}${url.pathname}`);
      return route.abort('blockedbyclient');
    }
    if (url.pathname === '/api/admin/session') {
      return route.fulfill({ json: {
        user: { id: 'qa-admin', email: 'rank-qa@example.test', roles: ['admin'] },
        selectedCountry: 'kr', issuedAt: 1788998400000,
      } });
    }
    if (url.pathname === LIST_PATH) {
      requests.push(url.pathname + url.search);
      return route.fulfill({ json: listResponse(url.searchParams) });
    }
    if (url.pathname.startsWith('/api/')) {
      unexpected.push(`${request.method()} ${url.pathname}`);
      return route.fulfill({ status: 501, json: { error: 'Unmocked API blocked by rank QA' } });
    }
    return route.continue();
  });
  // Attach receipts even on assertion failure via the fixture's afterEach hook.
  receipts.set(page, { unexpected, requests, runtimeErrors });
});

const receipts = new WeakMap<Page, { unexpected: string[]; requests: string[]; runtimeErrors: string[] }>();

test.afterEach(async ({ page }, testInfo) => {
  const receipt = receipts.get(page);
  await testInfo.attach('request-and-runtime-receipt', {
    body: JSON.stringify(receipt, null, 2), contentType: 'application/json',
  });
  expect(receipt?.unexpected).toEqual([]);
  expect(receipt?.runtimeErrors).toEqual([]);
});

test('rank requests, combined filters, pagination reset, and response cards/counts', async ({ page }) => {
  const initial = page.waitForResponse(isListResponse, { timeout: 10_000 });
  await page.goto('/admin/profile-image-audit');
  await verifyResult(page, await initial, { page: 1, total: 76 });
  await verifyResult(page, await pageTwo(page), { page: 2, total: 76 });
  for (const [rank, count] of Object.entries(RANK_COUNTS)) {
    await verifyResult(page, await choose(page, '외모 등급', rank), {
      page: 1, total: count * 2, profileRank: rank,
    });
  }
  await verifyResult(page, await choose(page, '성별', '여성'), {
    page: 1, total: 8, profileRank: 'C', gender: 'FEMALE',
  });
  await verifyResult(page, await choose(page, '검수 상태', '정상 처리'), {
    page: 1, total: 8, profileRank: 'C', gender: 'FEMALE', auditStatus: 'ok',
  });
  await verifyResult(page, await choose(page, '외모 등급', 'S'), {
    page: 1, total: 20, profileRank: 'S', gender: 'FEMALE', auditStatus: 'ok',
  });
  await verifyResult(page, await pageTwo(page), {
    page: 2, total: 20, profileRank: 'S', gender: 'FEMALE', auditStatus: 'ok',
  });
  await verifyResult(page, await choose(page, '외모 등급', '전체'), {
    page: 1, total: 38, gender: 'FEMALE', auditStatus: 'ok',
  });
});

async function capture(page: Page, testInfo: TestInfo, name: string) {
  await page.evaluate(async () => {
    await document.fonts.ready;
  });
  const path = testInfo.outputPath(`${name}.png`);
  await page.screenshot({ path, animations: 'disabled' });
  await testInfo.attach(name, { path, contentType: 'image/png' });
  console.log(`SCREENSHOT ${path}`);
}

for (const width of [375, 768, 1280]) {
  test(`rank select visual evidence at ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 1000 });
    const initial = page.waitForResponse(isListResponse, { timeout: 10_000 });
    await page.goto('/admin/profile-image-audit');
    await verifyResult(page, await initial, { page: 1, total: 76 });
    await verifyResult(page, await choose(page, '외모 등급', 'A'), { page: 1, total: 8, profileRank: 'A' });
    await capture(page, testInfo, `rank-${width}-closed`);
    await page.getByRole('combobox', { name: '외모 등급', exact: true }).click();
    await expect(page.getByRole('listbox').getByRole('option')).toHaveCount(5);
    await expect(page.getByRole('option', { name: 'A', exact: true })).toHaveAttribute('aria-selected', 'true');
    await capture(page, testInfo, `rank-${width}-open`);
    const menu = await page.getByRole('listbox').boundingBox();
    if (!menu) throw new Error('Rank menu has no visible bounding box');
    expect(menu.x).toBeGreaterThanOrEqual(0);
    expect(menu.x + menu.width).toBeLessThanOrEqual(width);
    await page.keyboard.press('Escape');
    await expect(page.getByRole('listbox')).toHaveCount(0);
  });
}
