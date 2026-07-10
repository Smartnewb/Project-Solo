jest.mock('@/shared/lib/http/admin-fetch', () => ({
	adminGet: jest.fn(),
	adminPost: jest.fn(),
}));

import { etaMission } from '@/app/services/admin/eta-mission';
import { adminGet, adminPost } from '@/shared/lib/http/admin-fetch';

describe('etaMission admin service', () => {
	beforeEach(() => jest.clearAllMocks());

	it('loads submissions from the live admin mission contract', async () => {
		(adminGet as jest.Mock).mockResolvedValue({ items: [], total: 0, page: 1, limit: 20 });

		await etaMission.getSubmissions('pending', 1, 20);

		expect(adminGet).toHaveBeenCalledWith('/admin/missions/everytime-promo/submissions', {
			status: 'pending',
			page: 1,
			limit: 20,
		});
	});

	it('uses the dedicated approve and reject commands', async () => {
		(adminPost as jest.Mock).mockResolvedValue({ success: true });

		await etaMission.approve('submission-1');
		await etaMission.reject('submission-1', '스크린샷 식별 불가');

		expect(adminPost).toHaveBeenNthCalledWith(
			1,
			'/admin/missions/everytime-promo/submission-1/approve',
		);
		expect(adminPost).toHaveBeenNthCalledWith(
			2,
			'/admin/missions/everytime-promo/submission-1/reject',
			{ reason: '스크린샷 식별 불가' },
		);
	});
});
