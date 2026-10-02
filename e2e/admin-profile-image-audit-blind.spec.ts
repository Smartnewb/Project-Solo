import { expect, test } from '@playwright/test';
import { sealData } from 'iron-session';
import { profileImageAuditItemFixture } from '../__tests__/app/services/fixtures/profile-image-audit';
import type { ProfileImageAuditItem } from '../app/services/admin/profile-image-audit';

const LIST_PATH = '/api/admin-proxy/admin/v2/profile-image-audit/images';
const SECRET = 'synthetic-rank-browser-qa-only-secret-32-chars';
const photo = (text: string, color: string) => `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="240" height="320"><rect width="240" height="320" fill="${color}"/><text x="24" y="160" font-size="24">${text}</text></svg>`)}`;

test.use({ channel: 'chrome' });

test('filters blind profiles, compares originals and characters, and restores rejected originals', async ({ page, context, baseURL }, testInfo) => {
  if (!baseURL || !['localhost', '127.0.0.1'].includes(new URL(baseURL).hostname)) throw new Error('Blind audit QA requires an isolated loopback server');
  const origin = new URL(baseURL).origin;
  const original = photo('Original', '#dbeafe');
  const character = photo('Character', '#ede9fe');
  const items: ProfileImageAuditItem[] = [
    { ...profileImageAuditItemFixture, profileImageId: 'qa-blind-original', presentationMode: 'BLIND', kind: 'profile_image', selectable: true, imageUrl: original, thumbnailUrl: original, originalImageUrl: original, blindImageUrl: character },
    { ...profileImageAuditItemFixture, profileImageId: 'blind_asset:qa-asset', presentationMode: 'BLIND', kind: 'blind_asset', selectable: false, imageUrl: character, thumbnailUrl: character, originalImageUrl: null, blindImageUrl: character },
    { ...profileImageAuditItemFixture, profileImageId: 'qa-photo', presentationMode: 'PHOTO', kind: 'profile_image', selectable: true, imageUrl: original, thumbnailUrl: original },
    { ...profileImageAuditItemFixture, profileImageId: 'qa-rejected', presentationMode: 'BLIND', kind: 'profile_image', selectable: true, imageUrl: original, thumbnailUrl: original, originalImageUrl: original, blindImageUrl: character, reviewStatus: 'rejected', auditStatus: 'rejected' },
  ];
  const requests: { method: string; url: string; body?: unknown }[] = [];
  const unexpected: string[] = [];
  const runtimeErrors: string[] = [];
  page.on('pageerror', error => runtimeErrors.push(error.message));
  await context.addCookies([{ name: 'admin_session_meta', url: baseURL,
    value: await sealData({ id: 'qa-admin', email: 'blind-qa@example.test', roles: ['admin'], selectedCountry: 'kr', issuedAt: Date.now() }, { password: SECRET }) }]);
  await context.route('**/*', async route => {
    const request = route.request();
    const url = new URL(request.url());
    if (url.protocol === 'data:') return route.continue();
    if (url.origin !== origin) { unexpected.push(url.href); return route.abort(); }
    if (url.pathname === '/api/admin/session') return route.fulfill({ json: { user: { id: 'qa-admin', email: 'blind-qa@example.test', roles: ['admin'] }, selectedCountry: 'kr' } });
    if (url.pathname === LIST_PATH && request.method() === 'GET') {
      requests.push({ method: 'GET', url: url.href });
      const data = items.filter(item => (!url.searchParams.get('presentationMode') || item.presentationMode === url.searchParams.get('presentationMode')) && (!url.searchParams.get('auditStatus') || item.auditStatus === url.searchParams.get('auditStatus')));
      return route.fulfill({ json: { data, meta: { page: 1, limit: 18, total: data.length, totalPages: 1 } } });
    }
    if (url.pathname === `${LIST_PATH}/bulk-mark-ok` && request.method() === 'POST') {
      const body = request.postDataJSON(); requests.push({ method: 'POST', url: url.href, body });
      if (JSON.stringify(body) !== JSON.stringify({ profileImageIds: ['qa-rejected'] })) { unexpected.push('Unexpected audit mutation'); return route.abort(); }
      const target = items.find(item => item.profileImageId === 'qa-rejected')!;
      items[items.indexOf(target)] = { ...target, auditStatus: 'ok', reviewStatus: 'approved', rejectionReason: null };
      return route.fulfill({ json: { data: { requested: 1, succeeded: 1, failed: 0, results: [{ profileImageId: 'qa-rejected', status: 'success' }] } } });
    }
    if (url.pathname.startsWith('/api/') || request.method() !== 'GET') { unexpected.push(`${request.method()} ${url.pathname}`); return route.abort(); }
    return route.continue();
  });
  const listResponse = () => page.waitForResponse(response => new URL(response.url()).pathname === LIST_PATH && response.request().method() === 'GET');
  const select = async (label: string, option: string) => {
    await page.getByRole('button', { name: new RegExp(label) }).click();
    const key = label === '프로필 공개 방식' ? 'presentationMode' : 'auditStatus';
    const value = ({ '블라인드 (캐릭터)': 'BLIND', '일반 (원본 사진)': 'PHOTO', '거절됨': 'rejected', '정상 처리': 'ok' } as Record<string, string>)[option];
    const response = page.waitForResponse(result => new URL(result.url()).pathname === LIST_PATH && new URL(result.url()).searchParams.get(key) === value);
    await page.getByRole('option', { name: option, exact: true }).click();
    return response;
  };
  await page.goto('/admin/profile-image-audit');
  await expect(page.getByRole('heading', { name: '프로필 이미지 전수검사', exact: true })).toBeVisible();
  const blindResponse = await select('프로필 공개 방식', '블라인드 (캐릭터)');
  expect(new URL(blindResponse.url()).searchParams.get('presentationMode')).toBe('BLIND');
  await expect(page.getByTestId('blind-photo-comparison')).toHaveCount(2);
  const comparison = page.getByTestId('blind-photo-comparison').first();
  const originalBounds = await comparison.getByRole('img', { name: 'qa-blind-original 원본 사진' }).boundingBox();
  const characterBounds = await comparison.getByRole('img', { name: 'qa-blind-original 블라인드 캐릭터' }).boundingBox();
  expect(originalBounds && characterBounds && originalBounds.x + originalBounds.width <= characterBounds.x).toBeTruthy();
  await expect(page.getByText('원본 미보관')).toBeVisible();
  await expect(page.getByRole('checkbox', { name: 'blind_asset:qa-asset 선택' })).toHaveCount(0);
  await page.getByRole('button', { name: '전체선택', exact: true }).click();
  await expect(page.getByText('선택 1장', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'qa-blind-original 크게 보기' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByTestId('blind-photo-comparison')).toHaveCount(3);
  await page.getByRole('dialog').evaluate(async () => {
    const animations = document.getAnimations().filter(animation => animation.effect?.getComputedTiming().iterations !== Infinity);
    await Promise.all(animations.map(animation => animation.finished));
  });
  await page.screenshot({ path: testInfo.outputPath('blind-comparison-modal.png') });
  await page.getByRole('button', { name: '큰 이미지 닫기' }).click();
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.screenshot({ path: testInfo.outputPath('blind-desktop.png'), fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(comparison).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath('blind-mobile.png'), fullPage: true });
  await page.setViewportSize({ width: 1440, height: 1000 });
  const normalResponse = await select('프로필 공개 방식', '일반 (원본 사진)');
  expect(new URL(normalResponse.url()).searchParams.get('presentationMode')).toBe('PHOTO');
  await expect(page.getByTestId('blind-photo-comparison')).toHaveCount(0);
  await select('프로필 공개 방식', '블라인드 (캐릭터)');
  await select('검수 상태', '거절됨');
  const rejected = page.getByRole('checkbox', { name: 'qa-rejected 선택' });
  await rejected.focus(); await page.keyboard.press('Space');
  await page.getByRole('button', { name: '정상 처리', exact: true }).click();
  const refreshed = listResponse();
  await page.getByRole('button', { name: '처리', exact: true }).click();
  await refreshed;
  await expect(page.getByTestId('profile-image-audit-card')).toHaveCount(0);
  await select('검수 상태', '정상 처리');
  await expect(page.getByTestId('profile-image-audit-card')).toHaveCount(1);
  expect(unexpected).toEqual([]);
  expect(runtimeErrors).toEqual([]);
  expect(requests.filter(request => request.method === 'POST')).toHaveLength(1);
  await testInfo.attach('requests', { body: JSON.stringify(requests, null, 2), contentType: 'application/json' });
});
