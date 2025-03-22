'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import { useAuth } from '@/contexts/AuthContext';
import NotificationBell from '../NotificationBell';

// 네비게이션 링크 항목
interface NavItem {
  name: string;
  href: string;
  adminOnly?: boolean;
}

const navigation: NavItem[] = [
  { name: '홈', href: '/home' },
  { name: '내 프로필', href: '/home/my-profile' },
  { name: '내 매칭', href: '/home/matching-result' },
  { name: '관리자', href: '/admin', adminOnly: true },
];

// 헤더 컴포넌트
export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const { user, loading, isAdmin } = useAuth();

  // 로그인 상태에 따라 표시할 메뉴 필터링
  const filteredNav = navigation.filter(item => {
    if (item.adminOnly) {
      return isAdmin;
    }
    return true;
  });

  // 현재 활성화된 링크인지 확인
  const isActive = (href: string) => {
    if (href === '/home') {
      return pathname === '/home';
    }
    return pathname.startsWith(href);
  };

  return (
    <header className="bg-white shadow">
      <nav className="mx-auto flex max-w-7xl items-center justify-between p-4 lg:px-8" aria-label="Global">
        <div className="flex items-center gap-4">
          <Link href="/home" className="-m-1.5 p-1.5">
            <span className="sr-only">캐치</span>
            <Image
              src="/logo.svg"
              alt="캐치 로고"
              width={80}
              height={32}
              className="h-8 w-auto"
            />
          </Link>

          {/* 데스크톱 네비게이션 */}
          <div className="hidden md:flex md:gap-x-6">
            {filteredNav.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`text-sm font-semibold ${
                  isActive(item.href)
                    ? 'text-blue-600'
                    : 'text-gray-900 hover:text-blue-500'
                }`}
              >
                {item.name}
              </Link>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* 알림 버튼 */}
          {user && (
            <NotificationBell className="mx-2" />
          )}

          {/* 로그인/로그아웃 버튼 */}
          {!loading && (
            <>
              {user ? (
                <Link
                  href="/api/auth/signout"
                  className="text-sm font-semibold text-gray-700 hover:text-blue-500"
                >
                  로그아웃
                </Link>
              ) : (
                <Link
                  href="/login"
                  className="text-sm font-semibold text-gray-700 hover:text-blue-500"
                >
                  로그인
                </Link>
              )}
            </>
          )}

          {/* 모바일 메뉴 버튼 */}
          <div className="flex md:hidden">
            <button
              type="button"
              className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-gray-700"
              onClick={() => setMobileMenuOpen(true)}
            >
              <span className="sr-only">메뉴 열기</span>
              <Bars3Icon className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>
        </div>
      </nav>

      {/* 모바일 메뉴 */}
      <div
        className={`fixed inset-0 z-50 ${
          mobileMenuOpen ? 'block' : 'hidden'
        }`}
      >
        <div className="fixed inset-0 bg-black/20" onClick={() => setMobileMenuOpen(false)} />

        <div className="fixed inset-y-0 right-0 z-50 w-full overflow-y-auto bg-white px-6 py-6 sm:max-w-sm sm:ring-1 sm:ring-gray-900/10">
          <div className="flex items-center justify-between">
            <Link href="/home" className="-m-1.5 p-1.5">
              <span className="sr-only">캐치</span>
              <Image
                src="/logo.svg"
                alt="캐치 로고"
                width={80}
                height={32}
                className="h-8 w-auto"
              />
            </Link>
            <button
              type="button"
              className="-m-2.5 rounded-md p-2.5 text-gray-700"
              onClick={() => setMobileMenuOpen(false)}
            >
              <span className="sr-only">메뉴 닫기</span>
              <XMarkIcon className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>
          <div className="mt-6 flow-root">
            <div className="-my-6 divide-y divide-gray-500/10">
              <div className="space-y-2 py-6">
                {filteredNav.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`-mx-3 block rounded-lg px-3 py-2 text-base font-semibold ${
                      isActive(item.href)
                        ? 'bg-gray-50 text-blue-600'
                        : 'text-gray-900 hover:bg-gray-50'
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
} 