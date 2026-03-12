'use client';

import { useEffect, type ReactNode } from 'react';
import { LegacyAuthBridgeProvider } from './legacy-auth-bridge';
import { LegacyCountryBridgeProvider } from './legacy-country-bridge';
import { ErrorBoundary } from '@/shared/ui/error-boundary';
import { patchAdminAxios } from '@/shared/lib/http/admin-axios-interceptor';

/**
 * Wraps legacy admin pages to run inside the new AdminShell.
 *
 * Structure:
 *   AdminShell (session context)
 *     └─ LegacyPageAdapter
 *          └─ Axios interceptor (routes API calls through BFF)
 *          └─ LegacyAuthBridgeProvider (syncs session → localStorage)
 *               └─ LegacyCountryBridgeProvider (syncs country → localStorage)
 *                    └─ ErrorBoundary
 *                         └─ Legacy page component
 *
 * The axios interceptor is critical: it rewrites all admin API calls
 * from direct backend access to /api/admin-proxy, making cookie-based
 * auth actually work for legacy pages.
 */
export function LegacyPageAdapter({ children }: { children: ReactNode }) {
  useEffect(() => {
    // Patch axios to route through BFF proxy
    const unpatch = patchAdminAxios();
    return () => unpatch();
  }, []);

  return (
    <LegacyAuthBridgeProvider>
      <LegacyCountryBridgeProvider>
        <ErrorBoundary fallback={<div className="p-4 text-red-500">페이지 로딩 오류</div>}>
          {children}
        </ErrorBoundary>
      </LegacyCountryBridgeProvider>
    </LegacyAuthBridgeProvider>
  );
}
