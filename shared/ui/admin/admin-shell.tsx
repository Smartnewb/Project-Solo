'use client';
/* eslint-disable no-restricted-globals, no-restricted-properties -- AdminShell: reads/writes localStorage during country change and uses reload for legacy compatibility. */

import { useEffect, useState, useCallback, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { AdminSessionContext, type AdminSession } from '@/shared/contexts/admin-session-context';
import { AdminQueryProvider } from '@/shared/providers/query-provider';
import { AdminSidebar } from './sidebar';
import { AdminCountrySelectorModal } from './admin-country-selector';
import {
  buildAdminLogoutPayload,
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
    return (
      <div className="flex min-h-screen items-center justify-center bg-white text-[#222222]">
        Loading...
      </div>
    );
  }

  if (!session) {
    if (error && error !== 'Authentication required') {
      return (
        <div className="flex items-center justify-center min-h-screen p-6 bg-white">
          <div className="max-w-md text-center space-y-4">
            <p className="text-[#3f3f3f]">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="min-h-12 rounded-lg bg-[#ff385c] px-6 py-[14px] text-sm font-medium text-white transition-colors hover:bg-[#e00b41]"
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
          <div className="admin-airbnb-screen flex min-h-screen bg-white text-[#222222]">
            <div className={`fixed inset-y-0 left-0 z-50 h-screen w-72 overflow-y-auto border-r border-[#12365f] bg-[#071a33] text-white transform transition-transform md:sticky md:top-0 md:h-screen md:translate-x-0 md:shrink-0 ${
              sidebarOpen ? 'translate-x-0' : '-translate-x-full'
            }`}>
              <div className="shrink-0 border-b border-[#12365f] bg-[#06162b] p-5">
                <h2 className="text-lg font-semibold tracking-normal text-white">관리자 대시보드</h2>
                <p className="mt-1 truncate text-sm text-[#9fb6d8]">{session.user.email}</p>
              </div>
              <div className="flex-1 overflow-y-auto">
                <AdminSidebar onNavigate={() => setSidebarOpen(false)} />
              </div>
              <div className="shrink-0 border-t border-[#12365f] bg-[#071a33] px-4 pt-3">
                <button
                  onClick={() => {
                    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }));
                  }}
                  className="flex w-full items-center justify-between rounded-full border border-[#1f4b7a] bg-[#0b2748] px-3 py-2 text-sm text-[#c7d7ef] transition-colors hover:border-[#4f8fd8] hover:bg-[#10345f]"
                >
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    메뉴 검색
                  </span>
                  <kbd className="rounded border border-[#2f5f93] bg-[#06162b] px-1.5 py-0.5 text-[10px] font-medium text-[#9fb6d8]">
                    ⌘K
                  </kbd>
                </button>
              </div>
              <div className="space-y-1 bg-[#071a33] px-4 pb-3 pt-2 shrink-0">
                <button
                  onClick={() => setCountryModalOpen(true)}
                  className="flex w-full items-center gap-2 rounded-lg px-4 py-2 text-left text-[#c7d7ef] transition-colors hover:bg-[#10345f] hover:text-white"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9" />
                  </svg>
                  국가 변경 ({session.selectedCountry.toUpperCase()})
                </button>
                <button
                  onClick={logout}
                  className="w-full rounded-lg px-4 py-2 text-left text-[#ffb3c1] transition-colors hover:bg-[#3a1730] hover:text-white"
                >
                  로그아웃
                </button>
              </div>
            </div>

            {sidebarOpen && (
              <div
                className="fixed inset-0 z-40 bg-black/50 md:hidden"
                onClick={() => setSidebarOpen(false)}
              />
            )}

            <div className="flex min-w-0 flex-1 flex-col overflow-auto">
              <div className="flex items-center justify-between border-b border-[#dddddd] bg-white p-4 md:hidden">
                <h1 className="text-lg font-semibold text-[#222222]">관리자 대시보드</h1>
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="rounded-full p-2 transition-colors hover:bg-[#f7f7f7]"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              </div>
              <main className="flex-1 overflow-y-auto bg-white p-6">
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
