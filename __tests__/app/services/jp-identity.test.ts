jest.mock('@/shared/lib/http/admin-fetch', () => ({
	adminGet: jest.fn(),
	adminPost: jest.fn(),
}));

import { jpIdentity } from '@/app/services/admin/jp-identity';
import { adminGet, adminPost } from '@/shared/lib/http/admin-fetch';

describe('jpIdentity admin service', () => {
	beforeEach(() => jest.clearAllMocks());

	it('loads the pending queue and single items from admin/jp/identity', async () => {
		(adminGet as jest.Mock).mockResolvedValue([]);

		await jpIdentity.getPending();
		await jpIdentity.getById('sub-1');

		expect(adminGet).toHaveBeenNthCalledWith(1, '/admin/jp/identity/pending');
		expect(adminGet).toHaveBeenNthCalledWith(2, '/admin/jp/identity/sub-1');
	});

	it('posts approve without a body and reject with the required reason', async () => {
		(adminPost as jest.Mock).mockResolvedValue({ message: 'ok', data: {} });

		await jpIdentity.approve('sub-1');
		await jpIdentity.reject('sub-1', '画像が不鮮明です。');

		expect(adminPost).toHaveBeenNthCalledWith(1, '/admin/jp/identity/sub-1/approve');
		expect(adminPost).toHaveBeenNthCalledWith(2, '/admin/jp/identity/sub-1/reject', {
			reason: '画像が不鮮明です。',
		});
	});
});
