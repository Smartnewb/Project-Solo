import {
  adminGet,
  adminPatch,
  buildAdminProxyUrl,
} from '@/shared/lib/http/admin-fetch';
import { forceMatching } from '@/app/services/admin/matching';

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

  it('forwards custom headers on adminGet and cross-border country params in forceMatching', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: jest.fn().mockResolvedValue(JSON.stringify({ data: [] })),
    });
    global.fetch = fetchMock;

    await adminGet('/admin/v2/users', { search: 'taro' }, { headers: { 'X-Country': 'jp' } });
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/admin-proxy/admin/v2/users?search=taro',
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({ 'X-Country': 'jp' }),
      }),
    );

    await forceMatching.searchUsers({ search: 'taro', gender: 'male', country: 'JP' });
    expect(fetchMock).toHaveBeenLastCalledWith(
      '/api/admin-proxy/admin/v2/users?filter=verified&page=1&limit=10&search=taro&gender=MALE',
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({ 'X-Country': 'jp' }),
      }),
    );

    await forceMatching.createForceChatRoom({
      userIdA: 'jp-male-1',
      userIdB: 'kr-female-1',
      countryA: 'JP',
      countryB: 'KR',
    });
    expect(fetchMock).toHaveBeenLastCalledWith(
      '/api/admin-proxy/admin/v2/matching/force',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          userIdA: 'jp-male-1',
          userIdB: 'kr-female-1',
          countryA: 'JP',
          countryB: 'KR',
        }),
      }),
    );
  });
});
