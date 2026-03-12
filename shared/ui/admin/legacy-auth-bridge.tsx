'use client';

import { useEffect, type ReactNode } from 'react';
import { useAdminSession } from '@/shared/contexts/admin-session-context';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Syncs cookie-based session data to localStorage AND AuthContext
 * so legacy pages that read from either source continue to work.
 *
 * Consumes AdminSession context (set by AdminShell).
 * Does NOT make its own /api/admin/session call (review fix).
 */
export function LegacyAuthBridgeProvider({ children }: { children: ReactNode }) {
  const { session } = useAdminSession();
  const { syncExternalAuth } = useAuth();

  useEffect(() => {
    if (!session) return;

    const userData = {
      id: session.user.id,
      email: session.user.email,
      roles: session.user.roles,
    };

    // Sync to localStorage for legacy page compatibility
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('isAdmin', 'true');

    // Sync to AuthContext so useAuth() consumers see the session
    syncExternalAuth(
      { id: session.user.id, email: session.user.email, role: session.user.roles[0] || 'admin' },
      true,
    );
  }, [session, syncExternalAuth]);

  return <>{children}</>;
}
