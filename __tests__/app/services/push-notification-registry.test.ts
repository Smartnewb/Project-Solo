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

		await expect(pushNotificationRegistry.getRegistry()).resolves.toBe(response);

		expect(adminGet).toHaveBeenCalledWith('/admin/notifications/registry');
		expect(adminGet).not.toHaveBeenCalledWith(
			'/admin/v2/messaging/push/catalog',
			expect.anything(),
		);
	});
});
