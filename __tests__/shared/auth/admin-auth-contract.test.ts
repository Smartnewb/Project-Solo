import {
  normalizeAdminCountry,
  buildAdminSyncPayload,
  buildAdminLogoutPayload,
} from '@/shared/auth/admin-auth-contract';

describe('admin auth contract helpers', () => {
  it('prefers an explicit persisted country when it is valid', () => {
    expect(normalizeAdminCountry('jp')).toBe('jp');
  });

  it('falls back to kr when the country is missing or invalid', () => {
    expect(normalizeAdminCountry(undefined)).toBe('kr');
    expect(normalizeAdminCountry('KR')).toBe('kr');
    expect(normalizeAdminCountry('us')).toBe('kr');
  });

  it('builds sync payload with refresh token and country', () => {
    expect(buildAdminSyncPayload('access-token', 'refresh-token', 'jp')).toEqual({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      selectedCountry: 'jp',
    });
  });

  it('builds logout payload only when refresh token exists', () => {
    expect(buildAdminLogoutPayload('refresh-token')).toEqual({
      refreshToken: 'refresh-token',
    });
    expect(buildAdminLogoutPayload(null)).toBeUndefined();
  });
});
