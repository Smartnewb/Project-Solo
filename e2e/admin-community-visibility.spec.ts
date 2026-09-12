import { expect, test, type Locator, type Page, type Response, type TestInfo } from '@playwright/test';
import { sealData } from 'iron-session';
import type { TargetPostDetail, TargetPostSummary } from '../app/services/admin/community-automation';

// Real Next page/service/fetch; only the browser-to-BFF boundary is mocked.
// Start an isolated loopback Next server with this synthetic ADMIN_SESSION_SECRET
// and NEXT_PUBLIC_API_URL=http://127.0.0.1:1/api. Never use production credentials.
const QA_SESSION_SECRET = 'synthetic-visibility-browser-qa-only-secret-32-chars';
const PAGE_PATH = '/admin/community-automation/target-posts';
const LIST_PATH = '/api/admin-proxy/admin/v2/community-automation/target-posts';
const CATEGORY_PATH = '/api/admin-proxy/admin/v2/community/categories';
const STATUS_PREFIX = '/api/admin-proxy/admin/v2/community/posts/';
const STAMP = '2026-09-01T00:00:00.000Z';
const IDS = ['qa-post-a', 'qa-post-b', 'qa-post-c'];
const ERROR_SENTINEL = 'QA_VISIBILITY_DENIED';

function initialPosts(): TargetPostSummary[] {
  return IDS.map((id) => ({
    id, title: `Visibility ${id}`, content: `Synthetic visibility contract fixture ${id}`,
    categoryId: 'qa-general', categoryName: '실시간', authorId: `author-${id}`,
    authorName: 'QA author', authorRegion: '서울', authorRegionCluster: 'SEOUL',
    commentCount: 0, likeCount: 0, readCount: 7, reportCount: 0,
    isBlinded: false, blindedAt: null, latestComment: null, latestCommentAt: null,
    automationStatus: null, automationCount: 0, automationUpdatedAt: null,
    createdAt: STAMP, updatedAt: null,
  }));
}

type Receipt = {
  unexpected: string[];
  runtimeErrors: string[];
  requests: { method: string; path: string; body?: unknown; status: number; state?: unknown }[];
  posts: TargetPostSummary[];
  failNextStatus: boolean;
};
const receipts = new WeakMap<Page, Receipt>();

test.use({ serviceWorkers: 'block' });

test.beforeEach(async ({ context, page, baseURL }) => {
  if (!baseURL || !['localhost', '127.0.0.1', '[::1]'].includes(new URL(baseURL).hostname)) {
    throw new Error('Visibility QA requires an isolated loopback Next server. Never target production.');
  }
  const origin = new URL(baseURL).origin;
  const receipt: Receipt = {
    unexpected: [], runtimeErrors: [], requests: [], posts: initialPosts(), failNextStatus: false,
  };
  receipts.set(page, receipt);
  page.on('pageerror', (error) => receipt.runtimeErrors.push(error.message));
  await context.addCookies([{
    name: 'admin_session_meta', url: baseURL,
    value: await sealData({
      id: 'qa-admin', email: 'visibility-qa@example.test', roles: ['admin'],
      selectedCountry: 'kr', issuedAt: 1788998400000,
    }, { password: QA_SESSION_SECRET }),
  }]);
  await context.routeWebSocket('**/*', (socket) => {
    const url = new URL(socket.url());
    if (url.host === new URL(origin).host && url.pathname === '/_next/webpack-hmr') {
      socket.connectToServer();
    } else {
      receipt.unexpected.push(`WEBSOCKET ${socket.url()}`);
      socket.close();
    }
  });
  // Fail closed, including external assets, unknown APIs, and non-status writes.
  await context.route('**/*', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const method = request.method();
    const path = url.pathname;
    if (url.origin !== origin) {
      receipt.unexpected.push(`${method} ${url.origin}${path}`);
      return route.abort('blockedbyclient');
    }
    // Production Next prefetches sidebar links; do not load unrelated pages.
    if (method === 'GET' && path.startsWith('/admin/') &&
      request.headers()['next-router-prefetch'] === '1') {
      return route.fulfill({ status: 204 });
    }
    const reply = (json: unknown, status = 200, body?: unknown, state?: unknown) => {
      receipt.requests.push({ method, path: path + url.search, body, status, state });
      return route.fulfill({ status, json });
    };
    if (method === 'GET' && path === '/api/admin/session') {
      return reply({
        user: { id: 'qa-admin', email: 'visibility-qa@example.test', roles: ['admin'] },
        selectedCountry: 'kr', issuedAt: 1788998400000,
      });
    }
    if (method === 'GET' && path === CATEGORY_PATH) {
      return reply({ data: [{ id: 'qa-general', code: 'general', displayName: '실시간' }] });
    }
    if (method === 'GET' && path === LIST_PATH) {
      const items = receipt.posts.map((post) => ({ ...post }));
      return reply({ data: { items, total: items.length, page: 1, limit: 20 } }, 200, undefined, items);
    }
    const detailPost = receipt.posts.find((post) => path === `${LIST_PATH}/${post.id}`);
    if (method === 'GET' && detailPost) {
      const detail: TargetPostDetail = {
        post: { ...detailPost }, comments: [], automationHistory: [],
        ghostCandidates: [], ghostCandidateCount: 0,
        defaults: { defaultRegionCluster: 'SEOUL', defaultPublishMode: 'review_queue' },
      };
      return reply({ data: detail }, 200, undefined, detail.post);
    }
    if (method === 'GET' && receipt.posts.some((post) => path === `${LIST_PATH}/${post.id}/scheduled-comments`)) {
      return reply({ data: { items: [] } });
    }
    const statusPost = receipt.posts.find((post) => path === `${STATUS_PREFIX}${post.id}/status`);
    if (method === 'PATCH' && statusPost) {
      const body: { action?: string; isBlinded?: boolean } = request.postDataJSON();
      if (receipt.failNextStatus) {
        receipt.failNextStatus = false;
        return reply({ message: ERROR_SENTINEL }, 403, body, { ...statusPost });
      }
      // Match community-v2.service.updatePostStatus: every non-blind action unblinds.
      statusPost.isBlinded = body.action === 'blind';
      statusPost.blindedAt = statusPost.isBlinded ? STAMP : null;
      return reply({ data: { success: true, articleId: statusPost.id } }, 200, body, { ...statusPost });
    }
    if (method === 'GET' && (
      path === PAGE_PATH ||
      (path.startsWith('/_next/') && path !== '/_next/image') ||
      path === '/favicon.ico'
    )) return route.continue();
    receipt.unexpected.push(`${method} ${path}`);
    return route.fulfill({ status: 501, json: { error: 'Unmocked request blocked by visibility QA' } });
  });
});

test.afterEach(async ({ page }, testInfo) => {
  const receipt = receipts.get(page);
  await testInfo.attach('visibility-request-receipt', {
    body: JSON.stringify(receipt, null, 2), contentType: 'application/json',
  });
  expect(receipt?.unexpected).toEqual([]);
  expect(receipt?.runtimeErrors).toEqual([]);
});

function waitResponse(page: Page, path: string, method = 'GET') {
  return page.waitForResponse((response) =>
    new URL(response.url()).pathname === path && response.request().method() === method,
  { timeout: 60_000 });
}

function card(page: Page, id: string) {
  return page.getByRole('button', { name: `Visibility ${id} 작업 열기`, exact: true, includeHidden: true });
}

async function verifyList(page: Page, response: Response, hiddenIds: string[]) {
  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(body.data.items.map((post: TargetPostSummary) => ({
    id: post.id, isBlinded: post.isBlinded, blindedAt: post.blindedAt,
  }))).toEqual(IDS.map((id) => ({
    id, isBlinded: hiddenIds.includes(id), blindedAt: hiddenIds.includes(id) ? STAMP : null,
  })));
  for (const id of IDS) {
    await expect(card(page, id)).toBeVisible();
    await expect(card(page, id).getByRole('alert', { includeHidden: true })).toHaveCount(hiddenIds.includes(id) ? 1 : 0);
  }
}

async function select(page: Page, ids: string[]) {
  for (const id of ids) {
    await page.getByRole('checkbox', { name: `Visibility ${id} 선택`, exact: true }).check();
  }
}

async function changeVisibility(page: Page, button: Locator, ids: string[], action: 'blind' | 'unblind', hiddenIds: string[], detailId?: string) {
  const statusResponses = ids.map((id) => waitResponse(page, `${STATUS_PREFIX}${id}/status`, 'PATCH'));
  const listResponse = waitResponse(page, LIST_PATH);
  const detailResponse = detailId ? waitResponse(page, `${LIST_PATH}/${detailId}`) : undefined;
  await button.click();
  for (const response of await Promise.all(statusResponses)) {
    expect(response.status()).toBe(200);
    expect(response.request().postDataJSON()).toEqual({ action });
    expect(response.request().headers()['content-type']).toBe('application/json');
  }
  if (detailResponse && detailId) {
    const response = await detailResponse;
    expect(response.status()).toBe(200);
    const { data } = await response.json();
    expect(data.post.isBlinded).toBe(hiddenIds.includes(detailId));
    expect(data.post.blindedAt).toBe(hiddenIds.includes(detailId) ? STAMP : null);
    await expect(page.locator('.MuiDrawer-paper').getByText('블라인드', { exact: true }))
      .toHaveCount(hiddenIds.includes(detailId) ? 1 : 0);
  }
  await verifyList(page, await listResponse, hiddenIds);
  for (const id of ids) {
    await expect(page.getByRole('checkbox', { name: `Visibility ${id} 선택`, exact: true, includeHidden: true })).not.toBeChecked();
  }
  if (detailId) await expect(button).toBeEnabled();
  else await expect(button).toBeDisabled();
}

async function reload(page: Page, hiddenIds: string[]) {
  const response = waitResponse(page, LIST_PATH);
  await page.reload();
  await verifyList(page, await response, hiddenIds);
}

async function capture(page: Page, testInfo: TestInfo, name: string, fullPage = true) {
  await page.evaluate(async () => { await document.fonts.ready; });
  const path = testInfo.outputPath(`${name}.png`);
  await page.screenshot({ path, fullPage, animations: 'disabled' });
  await testInfo.attach(name, { path, contentType: 'image/png' });
  console.log(`SCREENSHOT ${path}`);
}

for (const width of [1440, 375]) {
  test(`target-post visibility contract at ${width}px`, async ({ page }, testInfo) => {
    test.setTimeout(120_000);
    await page.setViewportSize({ width, height: 1000 });
    const initial = waitResponse(page, LIST_PATH);
    await page.goto(PAGE_PATH);
    await verifyList(page, await initial, []);
    const hide = page.getByRole('button', { name: '선택 가리기', exact: true });
    const unhide = page.getByRole('button', { name: '가리기 해제', exact: true });
    await expect(hide).toBeDisabled();
    await capture(page, testInfo, `visibility-${width}-initial`);

    await select(page, [IDS[0]]);
    await changeVisibility(page, hide, [IDS[0]], 'blind', [IDS[0]]);
    await reload(page, [IDS[0]]);
    await select(page, [IDS[0]]);
    await changeVisibility(page, unhide, [IDS[0]], 'unblind', []);
    await select(page, IDS.slice(0, 2));
    await changeVisibility(page, hide, IDS.slice(0, 2), 'blind', IDS.slice(0, 2));
    await reload(page, IDS.slice(0, 2));
    await capture(page, testInfo, `visibility-${width}-hidden-persisted`);
    await select(page, IDS.slice(0, 2));
    await changeVisibility(page, unhide, IDS.slice(0, 2), 'unblind', []);

    const detail = waitResponse(page, `${LIST_PATH}/${IDS[2]}`);
    const timeline = waitResponse(page, `${LIST_PATH}/${IDS[2]}/scheduled-comments`);
    await card(page, IDS[2]).click();
    expect((await detail).status()).toBe(200);
    expect((await timeline).status()).toBe(200);
    const drawer = page.locator('.MuiDrawer-paper');
    await changeVisibility(page, drawer.getByRole('button', { name: '가리기', exact: true }), [IDS[2]], 'blind', [IDS[2]], IDS[2]);
    await drawer.getByText('블라인드', { exact: true }).scrollIntoViewIfNeeded();
    await capture(page, testInfo, `visibility-${width}-drawer-hidden`, false);
    await changeVisibility(page, drawer.getByRole('button', { name: '해제', exact: true }), [IDS[2]], 'unblind', [], IDS[2]);
    // The mutation temporarily disables its focused button; target the drawer again.
    await drawer.getByRole('button', { name: '해제', exact: true }).press('Escape');
    await expect(drawer).toHaveCount(0);
    await reload(page, []);

    const receipt = receipts.get(page);
    if (!receipt) throw new Error('Visibility QA receipt was not initialized');
    receipt.failNextStatus = true;
    await select(page, [IDS[0]]);
    const denied = waitResponse(page, `${STATUS_PREFIX}${IDS[0]}/status`, 'PATCH');
    await hide.click();
    const deniedResponse = await denied;
    expect(deniedResponse.status()).toBe(403);
    expect(deniedResponse.request().postDataJSON()).toEqual({ action: 'blind' });
    await expect(page.getByRole('alert').filter({ hasText: ERROR_SENTINEL })).toBeVisible();
    await expect(page.locator('.MuiAlert-standardSuccess')).toHaveCount(0);
    await expect(hide).toBeEnabled();
    await expect(page.getByRole('checkbox', { name: `Visibility ${IDS[0]} 선택`, exact: true })).toBeChecked();
    for (const id of IDS) await expect(card(page, id).getByRole('alert')).toHaveCount(0);
    await capture(page, testInfo, `visibility-${width}-error`);
    await reload(page, []);
    expect(receipt.requests.filter((request) => request.method === 'PATCH')).toHaveLength(9);
    expect(receipt.posts.every((post) => !post.isBlinded && post.blindedAt === null)).toBe(true);
  });
}
