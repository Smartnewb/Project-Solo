import { test, expect } from '@playwright/test';
import { sealData } from 'iron-session';

const SESSION_COOKIE = 'admin_session_meta';
const SESSION_PASSWORD =
  process.env.ADMIN_SESSION_SECRET || 'DEVELOPMENT_SECRET_MUST_BE_32_CHARS_LONG!!';

async function setAdminSession(page: import('@playwright/test').Page) {
  const sessionValue = await sealData(
    {
      id: 'e2e-admin',
      email: 'admin@test.com',
      roles: ['admin'],
      issuedAt: Date.now(),
      selectedCountry: 'kr',
    },
    {
      password: SESSION_PASSWORD,
      ttl: 30 * 24 * 60 * 60,
    },
  );

  await page.context().addCookies([
    {
      name: SESSION_COOKIE,
      value: sessionValue,
      url: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:32211',
      httpOnly: true,
      sameSite: 'Lax',
    },
  ]);
}

test.describe('Admin push notification registry', () => {
  test('상황별 알림 탭과 구조도는 발송 endpoint를 호출하지 않는다', async ({ page }) => {
    test.setTimeout(90000);
    await setAdminSession(page);
    let sendRequestCount = 0;

    await page.route('**/api/admin/session', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: {
            id: 'e2e-admin',
            email: 'admin@test.com',
            roles: ['admin'],
          },
          selectedCountry: 'kr',
          issuedAt: Date.now(),
        }),
      });
    });

    await page.route('**/api/admin-proxy/admin/v2/messaging/push/send', async (route) => {
      sendRequestCount += 1;
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'send endpoint must not be called while browsing registry' }),
      });
    });

    await page.route('**/api/admin-proxy/admin/notifications/registry', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          version: '2026-05-14-001',
          stats: {
            total: 46,
            byCategory: { campaign: 4, chat: 1 },
            byTrigger: { event: 42, cron: 4 },
          },
          notifications: {
            campaign_reminder: cronFixture('campaign_reminder', '0 19 * * *', 'campaignIncompleteFemales'),
            somemate_resume: cronFixture('somemate_resume', '30 19 * * *', 'somemateResumeCandidates'),
            somemate_discovery: cronFixture('somemate_discovery', '30 20 * * *', 'somemateDiscoveryCandidates'),
            somemate_rehearsal_prompt: cronFixture(
              'somemate_rehearsal_prompt',
              '30 21 * * *',
              'somemateRehearsalPromptCandidates',
            ),
          },
          directNotifications: directFixtures(),
        }),
      });
    });

    await page.goto('/admin/push-notifications?tab=registry');
    await expect(page.locator('text=총 46개')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=이벤트 42개 · 크론 4개')).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('heading', { name: '알림 구조도' })).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('5개')).toBeVisible();
    await expect(page.locator('text=음성 통화 라이프사이클 푸시')).toBeVisible();
    await expect(page.getByText('신입생 마일스톤 푸시')).toBeVisible();
    await expect(page.getByText('AI 컴패니언 선제 메시지 푸시')).toBeVisible();
    await expect(page.getByText('body: 상대방이 기다리고 있어요')).toBeVisible();
    await expect(page.getByText('deepLink: /voice-call')).toBeVisible();
    await expect(page.getByText('skipOnlineCheck: true').first()).toBeVisible();
    await expect(page.getByText('persistence: general/roulette_reminder')).toBeVisible();
    await expect(page.getByText('skipPersist: false').first()).toBeVisible();
    await expect(page.getByText('notes: registry-external direct send')).toBeVisible();
    await page.getByRole('button', { name: /캠페인 4개 · campaign/ }).click();
    await expect(page).toHaveURL(/\/admin\/push-notifications\?tab=registry&view=table/);
    await expect(page.getByText('campaign_reminder').first()).toBeVisible();
    await expect(page.getByText('오늘의 추천 {remaining}명이 기다리고 있어요').first()).toBeVisible();
    await expect(page.getByText('캠페인 참여가 끝나지 않은 유저에게 오늘 확인할 추천이 남아 있을 때 보냅니다.').first()).toBeVisible();
    await expect(page.getByText('Throttle: campaign_reminder:{userId}:{date} · 86400s').first()).toBeVisible();
    await expect(page.getByText('somemate_resume').first()).toBeVisible();
    await expect(page.getByText('somemate_discovery').first()).toBeVisible();
    await expect(page.getByText('somemate_rehearsal_prompt').first()).toBeVisible();

    await page.goto('/admin/push-notifications/catalog');
    await expect(page).toHaveURL(/\/admin\/push-notifications\?tab=registry&view=graph/);
    await expect(page.getByRole('heading', { name: '알림 구조도' })).toBeVisible({ timeout: 10000 });
    await page.getByText('somemate_resume · 자동').click();
    await expect(page.getByText('somemate_resume').first()).toBeVisible();
    await expect(page.getByText('campaign_reminder')).not.toBeVisible();

    await page.goto('/admin/push-notifications?tab=send');
    await expect(page.locator('h2:has-text("사용자 필터링")')).toBeVisible({ timeout: 10000 });
    expect(sendRequestCount).toBe(0);
  });
});

function directFixtures() {
  const base = {
    persistence: null,
    throttle: null,
    readonly: true,
    status: 'active' as const,
    skipOnlineCheck: false,
    skipPersist: true,
  };

  return [
    {
      ...base,
      id: 'voice-call',
      label: '음성 통화 라이프사이클 푸시',
      category: 'voice-call',
      trigger: 'voice call lifecycle',
      audience: 'call participant',
      template: { ko: { title: '통화 알림', body: '상대방이 기다리고 있어요' } },
      route: '/voice-call',
      deepLink: '/voice-call',
      requiredFields: ['sessionId'],
      skipOnlineCheck: true,
      skipPersist: true,
      source: 'src/voice-call/services/voice-call.service.ts',
      notes: ['registry-external direct send'],
    },
    {
      ...base,
      id: 'freshmen-milestone',
      label: '신입생 마일스톤 푸시',
      category: 'freshmen',
      trigger: 'freshmen milestone queue',
      audience: 'freshmen chunk',
      template: { ko: { title: '{pushTitle}', body: '{pushBody}' } },
      route: '/home',
      deepLink: null,
      requiredFields: ['userIds', 'milestone'],
      skipOnlineCheck: true,
      source: 'src/freshmen/queue/freshmen-push.processor.ts',
      notes: ['data.type=freshmen_milestone'],
    },
    {
      ...base,
      id: 'companion-proactive',
      label: 'AI 컴패니언 선제 메시지 푸시',
      category: 'ai-companion',
      trigger: 'offline proactive message',
      audience: 'offline relationship user',
      template: { ko: { title: '{companion.name}', body: '{content}' } },
      route: '/chat/companion',
      deepLink: null,
      requiredFields: ['relationshipId', 'messageId'],
      source: 'src/ai-companion/application/proactive-message.usecase.ts',
      notes: ['offline only'],
    },
    {
      ...base,
      id: 'version-update',
      label: '앱 버전 업데이트 푸시',
      category: 'system',
      trigger: 'version update queue',
      audience: 'active users by platform',
      template: { ko: { title: '새 버전 출시', body: '새 버전이 출시되었습니다. 업데이트해주세요!' } },
      route: '/settings',
      deepLink: null,
      requiredFields: ['versionId', 'platforms'],
      skipOnlineCheck: true,
      source: 'src/config/version/services/version-update-push.service.ts',
      notes: ['queued chunks'],
    },
    {
      ...base,
      id: 'roulette-reminder-disabled',
      label: '룰렛 리마인더 푸시(비활성)',
      category: 'reminder',
      status: 'disabled' as const,
      trigger: 'disabled roulette cron',
      audience: 'roulette nonparticipants',
      template: { ko: { title: '룰렛 이벤트 알림', body: '현재 발송하지 않습니다' } },
      route: '/events/roulette',
      deepLink: null,
      requiredFields: ['eventId'],
      persistence: { type: 'general', subType: 'roulette_reminder' },
      skipOnlineCheck: true,
      skipPersist: false,
      source: 'src/events/roulette/service/roulette-notification.service.ts',
      notes: ['disabled by constant'],
    },
  ];
}

function cronFixture(eventType: string, schedule: string, resolver: string) {
  return {
    category: 'campaign',
    route: eventType === 'campaign_reminder' ? '/home' : '/chat/somemate',
    deepLink: eventType === 'campaign_reminder' ? 'sometimes://home' : null,
    requiredFields: eventType === 'campaign_reminder' ? ['remaining'] : [],
    suppressInRoom: false,
    trigger: { type: 'cron', schedule, timeZone: 'Asia/Seoul' },
    audience: { type: 'query', resolver },
    template: {
      ko: {
        title: eventType === 'campaign_reminder' ? '아직 확인하지 않은 추천이 있어요' : `${eventType} 알림`,
        body: eventType === 'campaign_reminder' ? '오늘의 추천 {remaining}명이 기다리고 있어요' : `${eventType} 본문`,
      },
      ja: {
        title: eventType === 'campaign_reminder' ? 'まだ確認していないおすすめがあります' : `${eventType} 通知`,
        body: eventType === 'campaign_reminder' ? '今日のおすすめ{remaining}人が待っています' : `${eventType} 本文`,
      },
    },
    persistence: { type: 'general', subType: eventType },
    throttle: { key: `${eventType}:{userId}:{date}`, ttlSeconds: 86400 },
    skipOnlineCheck: false,
    skipPersist: false,
    badge: null,
  };
}
