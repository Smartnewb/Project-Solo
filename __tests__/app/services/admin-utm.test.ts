jest.mock('@/shared/lib/http/admin-fetch', () => ({
	adminGet: jest.fn(),
	adminPost: jest.fn(),
	adminPatch: jest.fn(),
	adminDelete: jest.fn(),
}));

import { utm } from '@/app/services/admin/utm';
import { adminGet } from '@/shared/lib/http/admin-fetch';

describe('utm admin service', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('normalizes bare summary event arrays into dashboard summary cards', async () => {
		(adminGet as jest.Mock).mockResolvedValue([
			{ eventType: 'page_visit', count: 12, previousCount: 10, changePercent: 20 },
			{ eventType: 'signup', count: 5, previousCount: 4, changePercent: 25 },
			{ eventType: 'profile_approved', count: 3, previousCount: 2, changePercent: 50 },
			{ eventType: 'first_purchase', count: 1, previousCount: 1, changePercent: 0 },
		]);

		await expect(utm.getSummary('2026-04-06', '2026-04-13')).resolves.toEqual({
			pageVisit: { count: 12, change: 20 },
			signup: { count: 5, change: 25 },
			profileApproved: { count: 3, change: 50 },
			firstPurchase: { count: 1, change: 0 },
		});
	});

	it('accepts bare funnel arrays from the dashboard endpoint', async () => {
		(adminGet as jest.Mock).mockResolvedValue([
			{ step: 'page_visit', count: 10, rate: 100 },
			{ step: 'signup', count: 4, rate: 40 },
		]);

		await expect(utm.getFunnel('2026-04-06', '2026-04-13')).resolves.toEqual([
			{ step: 'page_visit', count: 10, rate: 100 },
			{ step: 'signup', count: 4, rate: 40 },
		]);
	});

	it('accepts bare channel arrays and fills missing approved counts with zero', async () => {
		(adminGet as jest.Mock).mockResolvedValue([
			{ source: 'instagram', clicks: 11, signups: 4, signupRate: 36.4, purchases: 1, purchaseRate: 9.1 },
		]);

		await expect(utm.getChannels('2026-04-06', '2026-04-13')).resolves.toEqual([
			{
				source: 'instagram',
				clicks: 11,
				signups: 4,
				signupRate: 36.4,
				approved: 0,
				purchases: 1,
				purchaseRate: 9.1,
			},
		]);
	});

	it('keeps supporting wrapped campaign responses', async () => {
		(adminGet as jest.Mock).mockResolvedValue({
			data: [{ campaign: 'spring_launch', clicks: 9, signups: 3, purchases: 1 }],
		});

		await expect(utm.getCampaigns('instagram', '2026-04-06', '2026-04-13')).resolves.toEqual([
			{ campaign: 'spring_launch', clicks: 9, signups: 3, purchases: 1 },
		]);
	});
});
