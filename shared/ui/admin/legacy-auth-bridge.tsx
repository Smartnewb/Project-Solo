'use client';

import { useEffect, type ReactNode } from 'react';
import { useAdminSession } from '@/shared/contexts/admin-session-context';

/**
 * Syncs cookie-based session data to localStorage so legacy pages
 * that read from localStorage continue to work.
 *
 * Consumes AdminSession context (set by AdminShell).
 * Does NOT make its own /api/admin/session call (review fix).
 */
export function LegacyAuthBridgeProvider({ children }: { children: ReactNode }) {
  const { session } = useAdminSession();

  useEffect(() => {
    if (!session) return;

    // Sync session data to localStorage for legacy page compatibility
    // Legacy pages read: accessToken, user, isAdmin from localStorage
    const userData = {
      id: session.user.id,
      email: session.user.email,
      roles: session.user.roles,
    };
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('isAdmin', 'true');
    // Note: accessToken in localStorage is set during login or sync flow
    // We don't set it here because we don't have the raw token (it's in httpOnly cookie)
  }, [session]);

  return <>{children}</>;
}
