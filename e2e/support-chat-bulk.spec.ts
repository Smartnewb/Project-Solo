import { test, expect } from '@playwright/test';
import { sealData } from 'iron-session';

test.use({ channel: 'chrome' });

test('resolves only selected support sessions and preserves arrival order', async ({ page, context }) => {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) throw new Error('ADMIN_SESSION_SECRET is required for isolated local QA.');
  const baseURL = process.env.PLAYWRIGHT_BASE_URL;
  if (!baseURL || !/^http:\/\/(127\.0\.0\.1|localhost):/.test(baseURL)) {
    throw new Error('This test requires a local server and synthetic session.');
  }
  const cookie = await sealData({ id: 'qa-admin', email: 'qa@example.invalid', roles: ['admin'], issuedAt: Date.now(), selectedCountry: 'kr' }, { password: secret, ttl: 3600 });
  await context.addCookies([{ name: 'admin_session_meta', value: cookie, url: baseURL }]);
  const sessions = [
    { sessionId: 'older', userId: 'u1', userNickname: '먼저 접수한 상담', status: 'admin_handling', language: 'ko', messageCount: 1, createdAt: '2026-09-29T01:00:00Z', domain: 'payment' },
    { sessionId: 'newer', userId: 'u2', userNickname: '아직 확인 안 한 상담', status: 'waiting_admin', language: 'ko', messageCount: 1, createdAt: '2026-09-30T01:00:00Z', domain: 'account' },
  ];
  const resolvedIds: string[] = [];
  await page.route('**/api/**', async (route) => {
    const url = new URL(route.request().url());
    let body: unknown = {};
    if (url.pathname === '/api/admin/session') body = { user: { id: 'qa-admin', email: 'qa@example.invalid', roles: ['admin'] }, selectedCountry: 'kr', issuedAt: Date.now() };
    else if (url.pathname.endsWith('/resolve')) {
      const id = url.pathname.split('/').at(-2);
      const session = sessions.find((item) => item.sessionId === id);
      if (!session || !id) throw new Error('Unknown session');
      expect(route.request().postDataJSON()).toEqual({ resolutionReason: 'solved' });
      resolvedIds.push(id);
      session.status = 'admin_resolved';
      body = { success: true, sessionId: id, status: session.status, resolvedAt: '2026-10-01T00:00:00Z' };
    } else if (url.pathname.endsWith('/sessions')) {
      const filtered = sessions.filter((item) => item.status === url.searchParams.get('status'));
      body = { sessions: filtered, pagination: { page: 1, limit: 100, total: filtered.length, totalPages: 1 } };
    } else if (url.pathname.includes('/sessions/')) {
      const session = sessions.find((item) => item.sessionId === url.pathname.split('/').at(-1));
      if (!session) throw new Error('Unknown detail');
      body = { ...session, user: { id: session.userId }, messages: [{ id: `message-${session.sessionId}`, sessionId: session.sessionId, senderType: 'user', content: '추가로 궁금한 내용이 있어요.', createdAt: session.createdAt }] };
    }
    await route.fulfill({ json: body });
  });
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(`${baseURL}/admin/support-chat`);
  const older = page.getByRole('checkbox', { name: '먼저 접수한 상담 선택' });
  await expect(older).toBeVisible();
  await expect(page.getByRole('heading', { level: 6 }).first()).toContainText('먼저 접수한 상담');
  await older.check();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.screenshot({ path: 'test-results/support-desktop.png', fullPage: true });
  await page.getByRole('button', { name: '선택 1건 해결 완료' }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toContainText('먼저 접수한 상담');
  await expect(dialog).not.toContainText('아직 확인 안 한 상담');
  await page.screenshot({ path: 'test-results/support-confirm.png', fullPage: true });
  await dialog.getByRole('button', { name: '해결 완료', exact: true }).click();
  await expect(page.getByRole('alert').filter({ hasText: '1건 완료' })).toBeVisible();
  expect(resolvedIds).toEqual(['older']);
  await expect(page.getByRole('checkbox', { name: '아직 확인 안 한 상담 선택' })).toBeVisible();
  await page.setViewportSize({ width: 375, height: 812 });
  await expect(page.getByRole('checkbox', { name: '아직 확인 안 한 상담 선택' })).toBeVisible();
  await page.screenshot({ path: 'test-results/support-mobile.png', fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.screenshot({ path: 'test-results/support-tablet.png', fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
