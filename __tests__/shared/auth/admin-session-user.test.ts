import {
  extractRoles,
  isAdminRoleSet,
  buildAdminSessionUser,
} from '@/shared/auth/admin-session-user';

describe('admin-session-user helpers', () => {
  it('extracts roles from roles array', () => {
    expect(extractRoles({ roles: ['user', 'admin'] })).toEqual(['user', 'admin']);
  });

  it('extracts roles from single role field', () => {
    expect(extractRoles({ role: 'admin' })).toEqual(['admin']);
  });

  it('recognizes admin role from either response shape', () => {
    expect(isAdminRoleSet(['admin'])).toBe(true);
    expect(isAdminRoleSet(['user'])).toBe(false);
  });

  it('builds session user from /user and /user/details responses', () => {
    expect(
      buildAdminSessionUser(
        { id: 'user-1', name: 'Admin', roles: ['admin'] },
        { email: 'admin@example.com' },
      ),
    ).toEqual({
      id: 'user-1',
      email: 'admin@example.com',
      name: 'Admin',
      roles: ['admin'],
    });
  });

  it('falls back to login email when details response has no email', () => {
    expect(
      buildAdminSessionUser(
        { id: 'user-1', role: 'admin' },
        null,
        'fallback@example.com',
      ),
    ).toEqual({
      id: 'user-1',
      email: 'fallback@example.com',
      name: '',
      roles: ['admin'],
    });
  });
});
