jest.mock('@/shared/lib/http/admin-fetch', () => ({
	adminGet: jest.fn(),
}));

import { pushNotificationRegistry } from '@/app/services/admin/push-notification-registry';
import { adminGet } from '@/shared/lib/http/admin-fetch';

describe('pushNotificationRegistry service', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('fetches the API-owned admin notification registry', async () => {
		const response = {
			version: '2026-05-14-001',
			notifications: {},
			stats: {
				total: 46,
				byCategory: { campaign: 5 },
				byTrigger: { event: 42, cron: 4 },
			},
			directNotifications: [
				{
					id: 'voice-call',
					status: 'active',
					readonly: true,
				},
			],
		};
		(adminGet as jest.Mock).mockResolvedValue(response);

		await expect(pushNotificationRegistry.getRegistry()).resolves.toEqual({
			...response,
			directNotifications: [
				{
					...response.directNotifications[0],
					requiredFields: [],
					notes: [],
				},
			],
		});

		expect(adminGet).toHaveBeenCalledWith('/admin/notifications/registry');
		expect(adminGet).not.toHaveBeenCalledWith(
			'/admin/v2/messaging/push/catalog',
			expect.anything(),
		);
	});

	it('normalizes missing array fields before registry UI calls join', async () => {
		const response = {
			version: '2026-05-14-001',
			stats: {
				total: 1,
				byCategory: { chat: 1 },
				byTrigger: { event: 1 },
			},
			notifications: {
				chat_message: {
					category: 'chat',
					route: '/chat/rooms',
					deepLink: null,
					suppressInRoom: true,
					trigger: { type: 'event' },
					audience: { type: 'single' },
					template: {
						ko: { title: '새 메시지', body: '확인해주세요' },
						ja: { title: '新しいメッセージ', body: '確認してください' },
					},
					persistence: { type: 'chat', subType: 'chat_message' },
					throttle: null,
					skipOnlineCheck: true,
					skipPersist: false,
					badge: 1,
				},
			},
			directNotifications: [
				{
					id: 'voice-call',
					label: 'Voice call push',
					category: 'system',
					status: 'active',
					trigger: 'voice call lifecycle events',
					audience: 'call participant',
					template: { ko: { title: '통화 알림', body: '상대방이 기다리고 있어요' } },
					route: '/voice-call',
					deepLink: null,
					persistence: null,
					throttle: null,
					skipOnlineCheck: true,
					skipPersist: true,
					readonly: true,
					source: 'src/voice-call/services/voice-call.service.ts',
				},
			],
		};
		(adminGet as jest.Mock).mockResolvedValue(response);

		const registry = await pushNotificationRegistry.getRegistry();

		expect(registry.notifications.chat_message.requiredFields).toEqual([]);
		expect(registry.directNotifications[0].requiredFields).toEqual([]);
		expect(registry.directNotifications[0].notes).toEqual([]);
	});
});
