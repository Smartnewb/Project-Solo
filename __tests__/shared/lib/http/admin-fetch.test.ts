import {
  adminPatch,
  buildAdminProxyUrl,
} from '@/shared/lib/http/admin-fetch';

describe('admin-fetch helpers', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it('rewrites admin api paths to the BFF proxy', () => {
    expect(buildAdminProxyUrl('/admin/banners')).toBe('/api/admin-proxy/admin/banners');
  });

  it('preserves query strings when routing through the BFF proxy', () => {
    expect(buildAdminProxyUrl('/admin/users?page=2&limit=20')).toBe(
      '/api/admin-proxy/admin/users?page=2&limit=20',
    );
  });

  it('treats empty successful responses as undefined instead of throwing JSON parse errors', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: jest.fn().mockResolvedValue(''),
    });

    await expect(
      adminPatch('/admin/v2/users/123/appearance', { rank: 'A' }),
    ).resolves.toBeUndefined();
  });
});
