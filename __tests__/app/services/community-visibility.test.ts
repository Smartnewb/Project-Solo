import communityService from '@/app/services/community';
import { AdminApiError } from '@/shared/lib/http/admin-fetch';
import { Response } from 'cross-fetch';

describe('community post visibility API contract', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	afterEach(() => {
		jest.restoreAllMocks();
	});

	it.each([
		{ isBlinded: true, action: 'blind' },
		{ isBlinded: false, action: 'unblind' },
	])('sends $action when single-post visibility is $isBlinded', async ({ isBlinded, action }) => {
		// Given a successful HTTP transport, keeping the real service and serializer.
		const fetchSpy = jest.spyOn(global, 'fetch').mockImplementation(async () =>
			new Response(JSON.stringify({ data: { success: true, articleId: 'post-1' } })),
		);

		// When changing visibility through the same service used by target-posts.
		await communityService.blindArticle('post-1', isBlinded);

		// Then the BFF receives the backend's action contract, not an ignored boolean.
		expect(fetchSpy).toHaveBeenCalledTimes(1);
		expect(fetchSpy).toHaveBeenCalledWith('/api/admin-proxy/admin/v2/community/posts/post-1/status', {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ action }),
		});
	});

	it.each([
		{ ids: ['post-1'], isBlinded: true, action: 'blind' },
		{ ids: ['post-1'], isBlinded: false, action: 'unblind' },
		{ ids: ['post-1', 'post-2'], isBlinded: true, action: 'blind' },
		{ ids: ['post-1', 'post-2'], isBlinded: false, action: 'unblind' },
	])('sends $action for every post in bulk $ids', async ({ ids, isBlinded, action }) => {
		// Given a successful HTTP transport.
		const fetchSpy = jest.spyOn(global, 'fetch').mockImplementation(async () =>
			new Response(JSON.stringify({ data: { success: true } })),
		);

		// When changing one or multiple posts through the bulk entry point.
		await communityService.bulkBlindArticles(ids, isBlinded);

		// Then every request preserves the explicit action.
		expect(fetchSpy).toHaveBeenCalledTimes(ids.length);
		ids.forEach((id, index) => {
			expect(fetchSpy).toHaveBeenNthCalledWith(index + 1, `/api/admin-proxy/admin/v2/community/posts/${id}/status`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ action }),
			});
		});
	});

	it('rejects instead of reporting success when the server denies visibility changes', async () => {
		// Given a denied HTTP response.
		jest.spyOn(global, 'fetch').mockImplementation(async () =>
			new Response(JSON.stringify({ message: 'Forbidden' }), { status: 403 }),
		);

		// When the caller requests blinding, then the failure reaches the page.
		await expect(communityService.blindArticle('post-1', true)).rejects.toBeInstanceOf(AdminApiError);
	});
});
