/* eslint-disable no-restricted-globals -- Bridge module: centralizes all legacy localStorage access for admin auth tokens/country. */
export type AdminCountry = 'kr' | 'jp';
export const ADMIN_REFRESH_STORAGE_KEY = 'admin_refresh_token';
export const ADMIN_COUNTRY_STORAGE_KEY = 'admin_selected_country';

export function normalizeAdminCountry(country?: string | null): AdminCountry {
  return country === 'jp' ? 'jp' : 'kr';
}

export function buildAdminLogoutPayload(refreshToken?: string | null) {
  if (!refreshToken) return undefined;
  return { refreshToken };
}

export function getStoredAdminRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(ADMIN_REFRESH_STORAGE_KEY);
}

export function setStoredAdminRefreshToken(refreshToken?: string | null): void {
  if (typeof window === 'undefined') return;
  if (refreshToken) {
    localStorage.setItem(ADMIN_REFRESH_STORAGE_KEY, refreshToken);
    return;
  }
  localStorage.removeItem(ADMIN_REFRESH_STORAGE_KEY);
}

export function getStoredAdminCountry(): AdminCountry {
  if (typeof window === 'undefined') return 'kr';
  return normalizeAdminCountry(localStorage.getItem(ADMIN_COUNTRY_STORAGE_KEY));
}
