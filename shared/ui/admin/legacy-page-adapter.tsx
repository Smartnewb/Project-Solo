'use client';

import { useContext, useEffect, type ReactNode } from 'react';
import { CountryProvider } from '@/contexts/CountryContext';
import { AdminSessionContext } from '@/shared/contexts/admin-session-context';
import { LegacyAuthBridgeProvider } from './legacy-auth-bridge';
import { LegacyCountryBridgeProvider } from './legacy-country-bridge';
import { ErrorBoundary } from '@/shared/ui/error-boundary';
import { patchAdminAxios } from '@/shared/lib/http/admin-axios-interceptor';

/**
 * Wraps legacy admin pages so they work in both layout modes:
 *
 * **V2 mode (AdminShell active):**
 *   AdminShell (session context)
 *     └─ LegacyPageAdapter
 *          └─ Axios interceptor (routes API calls through BFF)
 *          └─ LegacyAuthBridgeProvider (syncs session → localStorage)
 *               └─ LegacyCountryBridgeProvider (syncs country → localStorage)
 *                    └─ CountryProvider
 *                         └─ ErrorBoundary
 *                              └─ Legacy page component
 *
 * **Legacy mode (LegacyAdminLayout active, no AdminSessionContext):**
 *   LegacyAdminLayout (auth via useAuth + CountryProvider)
 *     └─ LegacyPageAdapter
 *          └─ ErrorBoundary
 *               └─ Legacy page component
 *
 * In legacy mode, bridges and BFF patches are skipped because
 * auth/country are already managed by the legacy layout, and API
 * calls use Bearer tokens from localStorage via the /api-proxy rewrite.
 */
export function LegacyPageAdapter({ children }: { children: ReactNode }) {
  const adminCtx = useContext(AdminSessionContext);
  const isInsideAdminShell = adminCtx !== null;

  useEffect(() => {
    if (!isInsideAdminShell) return;
    const unpatch = patchAdminAxios();
    return () => unpatch();
  }, [isInsideAdminShell]);

  if (isInsideAdminShell) {
    return (
      <LegacyAuthBridgeProvider>
        <LegacyCountryBridgeProvider>
          <CountryProvider>
            <ErrorBoundary fallback={<div className="p-4 text-red-500">페이지 로딩 오류</div>}>
              {children}
            </ErrorBoundary>
          </CountryProvider>
        </LegacyCountryBridgeProvider>
      </LegacyAuthBridgeProvider>
    );
  }

  return (
    <ErrorBoundary fallback={<div className="p-4 text-red-500">페이지 로딩 오류</div>}>
      {children}
    </ErrorBoundary>
  );
}
