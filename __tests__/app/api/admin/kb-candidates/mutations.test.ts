/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';

jest.mock('next/headers', () => ({ cookies: jest.fn() }));

jest.mock('@/shared/auth', () => ({
	getAdminAccessToken: jest.fn(),
	getSessionMeta: jest.fn(),
}));

import { POST as approve } from '@/app/api/admin/kb-candidates/[id]/approve/route';
import { POST as reject } from '@/app/api/admin/kb-candidates/[id]/reject/route';
import { getAdminAccessToken } from '@/shared/auth';

const mockFetch = jest.fn();
global.fetch = mockFetch;

function request(path: string, origin?: string) {
	return new NextRequest(`http://localhost:3000${path}`, {
		method: 'POST',
		headers: origin ? { Origin: origin } : undefined,
	});
}

const params = { params: Promise.resolve({ id: 'candidate-1' }) };

describe('KB candidate mutation routes', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		(getAdminAccessToken as jest.Mock).mockResolvedValue('access-token');
		mockFetch.mockResolvedValue({
			ok: true,
			status: 200,
			json: () => Promise.resolve({ success: true }),
		});
	});

	it.each([
		['approve', approve, '/api/admin/kb-candidates/candidate-1/approve'],
		['reject', reject, '/api/admin/kb-candidates/candidate-1/reject'],
	] as const)('rejects cross-origin %s requests', async (_name, handler, path) => {
		const response = await handler(request(path, 'https://evil.example'), params);

		expect(response.status).toBe(403);
		expect(await response.json()).toEqual({ error: 'Forbidden' });
		expect(mockFetch).not.toHaveBeenCalled();
	});

	it.each([
		['approve', approve, '/api/admin/kb-candidates/candidate-1/approve'],
		['reject', reject, '/api/admin/kb-candidates/candidate-1/reject'],
	] as const)('allows same-origin %s requests', async (_name, handler, path) => {
		const response = await handler(request(path, 'http://localhost:3000'), params);

		expect(response.status).toBe(200);
		expect(mockFetch).toHaveBeenCalledTimes(1);
	});
});
