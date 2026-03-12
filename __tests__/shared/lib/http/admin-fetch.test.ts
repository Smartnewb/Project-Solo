import { buildAdminProxyUrl } from '@/shared/lib/http/admin-fetch';

describe('admin-fetch helpers', () => {
  it('rewrites admin api paths to the BFF proxy', () => {
    expect(buildAdminProxyUrl('/admin/banners')).toBe('/api/admin-proxy/admin/banners');
  });

  it('preserves query strings when routing through the BFF proxy', () => {
    expect(buildAdminProxyUrl('/admin/users?page=2&limit=20')).toBe(
      '/api/admin-proxy/admin/users?page=2&limit=20',
    );
  });
});
