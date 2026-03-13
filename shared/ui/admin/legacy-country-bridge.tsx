'use client';
/* eslint-disable no-restricted-globals -- Legacy bridge: syncs cookie-based country to localStorage for legacy CountryProvider. Will be removed in Phase 6. */

import { useLayoutEffect, type ReactNode } from 'react';
import { useAdminSession } from '@/shared/contexts/admin-session-context';

/**
 * Syncs cookie-based country selection to localStorage so legacy
 * CountryProvider reads the correct value on mount.
 *
 * Uses useLayoutEffect to sync BEFORE paint (review fix: race condition).
 */
export function LegacyCountryBridgeProvider({ children }: { children: ReactNode }) {
  const { session } = useAdminSession();

  useLayoutEffect(() => {
    if (!session?.selectedCountry) return;
    localStorage.setItem('admin_selected_country', session.selectedCountry);
  }, [session?.selectedCountry]);

  return <>{children}</>;
}
