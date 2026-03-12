'use client';

import { useEffect, useState, useCallback, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { AdminSessionContext, type AdminSession } from '@/shared/contexts/admin-session-context';
import { AdminQueryProvider } from '@/shared/providers/query-provider';
import { AdminSidebar } from './sidebar';
import { AdminCountrySelectorModal } from './admin-country-selector';

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
          setIsLoading(false);
          return;
        }
      } catch {
        // Cookie session failed, try fallback
      }

      const localToken = localStorage.getItem('accessToken');
      if (localToken) {
        try {
          const syncRes = await fetch('/api/admin/auth/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ accessToken: localToken }),
          });

          if (syncRes.ok) {
            const sessionRes = await fetch('/api/admin/session');
            if (sessionRes.ok) {
              const data = await sessionRes.json();
              setSession(data);
              setIsLoading(false);
              return;
            }
          }
        } catch {
          // Sync failed
        }
      }

      setError('Authentication required');
      setIsLoading(false);
      router.push('/');
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
      localStorage.setItem('admin_selected_country', country);
    }
  }, []);

  const logout = useCallback(async () => {
    await fetch('/api/admin/auth/logout', { method: 'POST' });
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    localStorage.removeItem('isAdmin');
    localStorage.removeItem('admin_selected_country');
    setSession(null);
    router.push('/');
  }, [router]);

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (error || !session) {
    return null;
  }

  return (
    <AdminSessionContext.Provider value={{ session, isLoading, error, changeCountry, logout }}>
      <AdminQueryProvider>
          <div className="flex h-screen bg-gray-100">
            <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform md:relative md:translate-x-0 ${
              sidebarOpen ? 'translate-x-0' : '-translate-x-full'
            }`}>
              <div className="p-4 border-b">
                <h2 className="text-lg font-semibold">관리자 대시보드</h2>
                <p className="text-sm text-gray-500">{session.user.email}</p>
              </div>
              <AdminSidebar onNavigate={() => setSidebarOpen(false)} />
              <div className="px-4 pt-4 mt-3 border-t space-y-1">
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

            <div className="flex-1 flex flex-col overflow-auto">
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
              <main className="p-6">{children}</main>
            </div>

            <AdminCountrySelectorModal
              open={countryModalOpen}
              onClose={() => setCountryModalOpen(false)}
            />
          </div>
      </AdminQueryProvider>
    </AdminSessionContext.Provider>
  );
}
