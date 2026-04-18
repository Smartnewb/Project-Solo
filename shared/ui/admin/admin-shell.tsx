'use client';
/* eslint-disable no-restricted-globals -- AdminShell: reads/writes localStorage during country change and logout for legacy compatibility. */

import { useEffect, useState, useCallback, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { AdminSessionContext, type AdminSession } from '@/shared/contexts/admin-session-context';
import { AdminQueryProvider } from '@/shared/providers/query-provider';
import { AdminSidebar } from './sidebar';
import { AdminCountrySelectorModal } from './admin-country-selector';
import {
  buildAdminLogoutPayload,
  getStoredAdminCountry,
  getStoredAdminRefreshToken,
  setStoredAdminRefreshToken,
} from '@/shared/auth/admin-auth-contract';
import { CountryProvider } from '@/contexts/CountryContext';
import { AdminErrorBoundary } from './admin-error-boundary';
import { ToastProvider, ToastContainer } from '@/shared/ui/admin/toast';
import { ConfirmDialogProvider, ConfirmDialog } from '@/shared/ui/admin/confirm-dialog';
import { CommandSearch } from './command-search';

export function AdminShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [session, setSession] = useState<AdminSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [countryModalOpen, setCountryModalOpen] = useState(false);

  useEffect(() => {
    async function initSession() {
      setIsLoading(true);
      try {
        const res = await fetch('/api/admin/session');
        if (res.ok) {
          const data = await res.json();
          setSession(data);
        } else if (res.status === 401 || res.status === 403) {
          setError('Authentication required');
          router.push('/');
        } else {
          setError('세션 확인 실패 (서버 오류). 페이지를 새로고침하세요.');
        }
      } catch {
        setError('네트워크 오류로 세션을 확인할 수 없습니다. 페이지를 새로고침하세요.');
      } finally {
        setIsLoading(false);
      }
    }

    initSession();
  }, [router]);

  const changeCountry = useCallback(async (country: string) => {
    const res = await fetch('/api/admin/session/country', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ country }),
    });
    if (res.ok) {
      setSession((prev) => prev ? { ...prev, selectedCountry: country } : null);
    }
  }, []);

  const logout = useCallback(async () => {
    const refreshToken = getStoredAdminRefreshToken();
    const logoutPayload = buildAdminLogoutPayload(refreshToken);
    await fetch('/api/admin/auth/logout', {
      method: 'POST',
      headers: logoutPayload ? { 'Content-Type': 'application/json' } : undefined,
      body: logoutPayload ? JSON.stringify(logoutPayload) : undefined,
    });
    setStoredAdminRefreshToken(null);
    setSession(null);
    router.push('/');
  }, [router]);

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!session) {
    if (error && error !== 'Authentication required') {
      return (
        <div className="flex items-center justify-center min-h-screen p-6">
          <div className="max-w-md text-center space-y-4">
            <p className="text-gray-700">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-gray-900 text-white rounded hover:bg-gray-800"
            >
              새로고침
            </button>
          </div>
        </div>
      );
    }
    return null;
  }

  return (
    <AdminSessionContext.Provider value={{ session, isLoading, error, changeCountry, logout }}>
      <CountryProvider>
      <AdminQueryProvider>
          <div className="flex min-h-screen bg-gray-100">
            <div className={`fixed inset-y-0 left-0 z-50 h-screen w-64 overflow-y-auto bg-white shadow-lg transform transition-transform md:sticky md:top-0 md:h-screen md:translate-x-0 md:shrink-0 ${
              sidebarOpen ? 'translate-x-0' : '-translate-x-full'
            }`}>
              <div className="p-4 border-b shrink-0">
                <h2 className="text-lg font-semibold">관리자 대시보드</h2>
                <p className="text-sm text-gray-500">{session.user.email}</p>
              </div>
              <div className="flex-1 overflow-y-auto">
                <AdminSidebar onNavigate={() => setSidebarOpen(false)} />
              </div>
              <div className="px-4 pt-3 border-t shrink-0">
                <button
                  onClick={() => {
                    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }));
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 text-sm text-gray-400 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    메뉴 검색
                  </span>
                  <kbd className="text-[10px] px-1.5 py-0.5 bg-white rounded border border-gray-200 font-medium">
                    ⌘K
                  </kbd>
                </button>
              </div>
              <div className="px-4 pt-2 pb-3 space-y-1 shrink-0">
                <button
                  onClick={() => setCountryModalOpen(true)}
                  className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 rounded transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9" />
                  </svg>
                  국가 변경 ({session.selectedCountry.toUpperCase()})
                </button>
                <button
                  onClick={logout}
                  className="w-full text-left px-4 py-2 text-red-500 hover:bg-red-50 rounded transition-colors"
                >
                  로그아웃
                </button>
              </div>
            </div>

            {sidebarOpen && (
              <div
                className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
                onClick={() => setSidebarOpen(false)}
              />
            )}

            <div className="flex min-w-0 flex-1 flex-col overflow-auto">
              <div className="md:hidden flex items-center justify-between p-4 bg-white shadow-sm">
                <h1 className="text-lg font-semibold">관리자 대시보드</h1>
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="p-2 rounded-md hover:bg-gray-100"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              </div>
              <main className="flex-1 overflow-y-auto p-6">
                <ToastProvider>
                  <ConfirmDialogProvider>
                    <ToastContainer />
                    <ConfirmDialog />
                    <AdminErrorBoundary>{children}</AdminErrorBoundary>
                  </ConfirmDialogProvider>
                </ToastProvider>
              </main>
            </div>

            <CommandSearch />
            <AdminCountrySelectorModal
              open={countryModalOpen}
              onClose={() => setCountryModalOpen(false)}
            />
          </div>
      </AdminQueryProvider>
      </CountryProvider>
    </AdminSessionContext.Provider>
  );
}
