export interface AdminIdentitySource {
  id?: string | null;
  name?: string | null;
  email?: string | null;
  role?: string | null;
  roles?: string[] | null;
}

export interface AdminSessionUser {
  id: string;
  email: string;
  name: string;
  roles: string[];
}

export function extractRoles(source: AdminIdentitySource | null | undefined): string[] {
  if (!source) return [];
  if (Array.isArray(source.roles)) {
    return source.roles.filter((role): role is string => typeof role === 'string' && role.length > 0);
  }
  if (typeof source.role === 'string' && source.role.length > 0) {
    return [source.role];
  }
  return [];
}

export function isAdminRoleSet(roles: string[]): boolean {
  return roles.includes('admin');
}

export function buildAdminSessionUser(
  identity: AdminIdentitySource,
  details?: AdminIdentitySource | null,
  fallbackEmail?: string,
): AdminSessionUser {
  return {
    id: identity.id ?? '',
    email: details?.email ?? identity.email ?? fallbackEmail ?? '',
    name: identity.name ?? details?.name ?? '',
    roles: extractRoles(identity),
  };
}
