import { expect, test } from '@playwright/test';
import { sealData } from 'iron-session';
import { profileImageAuditItemFixture } from '../__tests__/app/services/fixtures/profile-image-audit';
import type { ProfileImageAuditItem } from '../app/services/admin/profile-image-audit';

const LIST_PATH = '/api/admin-proxy/admin/v2/profile-image-audit/images';
const SECRET = 'synthetic-rank-browser-qa-only-secret-32-chars';
const photo = (text: string, color: string) => `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="240" height="320"><rect width="240" height="320" fill="${color}"/><text x="24" y="160" font-size="24">${text}</text></svg>`)}`;

test.use({ channel: 'chrome' });

test('separates regular photos from photo-made character originals and restores a rejected original', async ({ page, context, baseURL }, testInfo) => {
  test.setTimeout(90_000);
  if (!baseURL || !['localhost', '127.0.0.1'].includes(new URL(baseURL).hostname)) throw new Error('Blind audit QA requires an isolated loopback server');
  const origin = new URL(baseURL).origin;
  const original = photo('Original', '#dbeafe');
  const character = photo('Character', '#ede9fe');
  const characterOriginal = (
    id: string,
    characterVersion: 'v1' | 'v2',
    auditStatus: ProfileImageAuditItem['auditStatus'] = 'unreviewed',
  ): ProfileImageAuditItem => ({
    ...profileImageAuditItemFixture,
    profileImageId: id,
    userId: `user-${id}`,
    presentationMode: 'BLIND',
    population: 'character_original',
    characterVersion,
    kind: 'profile_image',
    selectable: true,
    imageUrl: original,
    thumbnailUrl: original,
    originalImageUrl: original,
    originalImageStatus: 'AVAILABLE',
    blindImageUrl: character,
    auditStatus,
    reviewStatus: auditStatus === 'rejected' ? 'rejected' : 'approved',
  });
  const items: ProfileImageAuditItem[] = [
    { ...profileImageAuditItemFixture, profileImageId: 'qa-photo', presentationMode: 'PHOTO', population: 'regular_photo', kind: 'profile_image', selectable: true, imageUrl: original, thumbnailUrl: original, characterVersion: null },
    { ...profileImageAuditItemFixture, profileImageId: 'qa-photo-ok', presentationMode: 'PHOTO', population: 'regular_photo', kind: 'profile_image', selectable: true, imageUrl: original, thumbnailUrl: original, characterVersion: null, auditStatus: 'ok' },
    characterOriginal('qa-character-v1', 'v1'),
    characterOriginal('qa-character-v2', 'v2'),
    characterOriginal('qa-rejected', 'v2', 'rejected'),
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
      const population = url.searchParams.get('population') ?? 'regular_photo';
      const auditStatus = url.searchParams.get('auditStatus');
      const data = items.filter(item => item.population === population && (!auditStatus || item.auditStatus === auditStatus));
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
  const select = async (label: string, option: string, key: string, value: string) => {
    await page.getByRole('button', { name: new RegExp(label) }).click();
    const response = page.waitForResponse(result => new URL(result.url()).pathname === LIST_PATH && new URL(result.url()).searchParams.get(key) === value);
    await page.getByRole('option', { name: option, exact: true }).click();
    return response;
  };
  const initial = listResponse();
  await page.goto('/admin/profile-image-audit', { waitUntil: 'domcontentloaded' });
  const initialResponse = await initial;
  await expect(page.getByRole('heading', { name: '프로필 이미지 전수검사', exact: true })).toBeVisible();
  expect(new URL(initialResponse.url()).searchParams.get('population')).toBe('regular_photo');
  expect(new URL(initialResponse.url()).searchParams.get('auditStatus')).toBe('unreviewed');
  await expect(page.getByText('캐릭터 없이 본인 사진으로 공개된 회원만 봅니다.')).toBeVisible();
  await expect(page.getByTestId('profile-image-audit-card')).toHaveCount(1);
  await expect(page.getByTestId('blind-photo-comparison')).toHaveCount(0);
  await expect(page.getByTestId('profile-image-audit-card').getByText('일반 사진', { exact: true })).toBeVisible();
  await expect(page.getByText('기본 캐릭터 · 원본 사진 없음')).toHaveCount(0);
  const characterResponse = await select('볼 회원', '사진으로 만든 캐릭터', 'population', 'character_original');
  const characterParams = new URL(characterResponse.url()).searchParams;
  expect(characterParams.get('population')).toBe('character_original');
  expect(characterParams.get('includeAlreadyAudited')).toBe('true');
  expect(characterParams.has('auditStatus')).toBe(false);
  expect(characterParams.has('presentationMode')).toBe(false);
  await expect(page.getByText('사진을 올려 캐릭터를 만든 회원의 원본 사진입니다.')).toBeVisible();
  await expect(page.getByText('사진을 올리지 않은 기본 캐릭터는 빠집니다.')).toBeVisible();
  await expect(page.getByTestId('blind-photo-comparison')).toHaveCount(3);
  await expect(page.getByText('캐릭터 v1', { exact: true })).toHaveCount(1);
  await expect(page.getByText('캐릭터 v2', { exact: true })).toHaveCount(2);
  await expect(page.locator('[data-original-image-status]')).toHaveCount(0);
  const comparison = page.getByTestId('blind-photo-comparison').first();
  const originalBounds = await comparison.getByRole('img', { name: 'qa-character-v1 원본 사진' }).boundingBox();
  const characterBounds = await comparison.getByRole('img', { name: 'qa-character-v1 블라인드 캐릭터' }).boundingBox();
  expect(originalBounds && characterBounds && originalBounds.x + originalBounds.width <= characterBounds.x).toBeTruthy();
  await expect(page.getByRole('img', { name: 'qa-character-v1 원본 사진', exact: true })).toHaveAttribute('src', original);
  await page.getByRole('button', { name: '전체선택', exact: true }).click();
  await expect(page.getByText('선택 3장 · 3명')).toBeVisible();
  await page.getByRole('button', { name: 'qa-character-v1 크게 보기' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByTestId('blind-photo-comparison')).toHaveCount(4);
  await page.getByRole('dialog').evaluate(async () => {
    const animations = document.getAnimations().filter(animation => animation.effect?.getComputedTiming().iterations !== Infinity);
    await Promise.all(animations.map(animation => animation.finished));
  });
  await page.screenshot({ path: testInfo.outputPath('character-original-modal.png') });
  await page.getByRole('button', { name: '큰 이미지 닫기' }).click();
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.screenshot({ path: testInfo.outputPath('character-original-desktop.png'), fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(comparison).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath('character-original-mobile.png'), fullPage: true });
  await page.setViewportSize({ width: 1440, height: 1000 });
  const regularResponse = await select('볼 회원', '일반 사진', 'population', 'regular_photo');
  expect(new URL(regularResponse.url()).searchParams.get('population')).toBe('regular_photo');
  expect(new URL(regularResponse.url()).searchParams.get('auditStatus')).toBe('unreviewed');
  await expect(page.getByTestId('blind-photo-comparison')).toHaveCount(0);
  await expect(page.getByTestId('profile-image-audit-card')).toHaveCount(1);
  await select('볼 회원', '사진으로 만든 캐릭터', 'population', 'character_original');
  await select('검수 상태', '거절됨', 'auditStatus', 'rejected');
  const rejected = page.getByRole('checkbox', { name: 'qa-rejected 선택' });
  await rejected.focus(); await page.keyboard.press('Space');
  await page.getByRole('button', { name: '정상 처리', exact: true }).click();
  const refreshed = listResponse();
  await page.getByRole('button', { name: '처리', exact: true }).click();
  await refreshed;
  await expect(page.getByTestId('profile-image-audit-card')).toHaveCount(0);
  await select('검수 상태', '정상 처리', 'auditStatus', 'ok');
  await expect(page.getByTestId('profile-image-audit-card')).toHaveCount(1);
  await expect(page.getByText('캐릭터 v2', { exact: true })).toBeVisible();
  expect(unexpected).toEqual([]);
  expect(runtimeErrors).toEqual([]);
  expect(requests.filter(request => request.method === 'POST')).toHaveLength(1);
  await testInfo.attach('requests', { body: JSON.stringify(requests, null, 2), contentType: 'application/json' });
});
