'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ChartPieIcon,
  UsersIcon,
  HeartIcon,
  ChatBubbleLeftRightIcon,
  ChartBarIcon,
  QuestionMarkCircleIcon,
  ArrowLeftOnRectangleIcon,
} from '@heroicons/react/24/outline';

const menuItems = [
  {
    name: '대시보드',
    href: '/admin',
    icon: ChartPieIcon,
  },
  {
    name: '유저 관리',
    href: '/admin/users',
    icon: UsersIcon,
  },
  {
    name: '매칭 관리',
    href: '/admin/matching',
    icon: HeartIcon,
  },
  {
    name: '커뮤니티 관리',
    href: '/admin/community',
    icon: ChatBubbleLeftRightIcon,
  },
  {
    name: '통계/분석',
    href: '/admin/statistics',
    icon: ChartBarIcon,
  },
  {
    name: '고객 문의',
    href: '/admin/inquiries',
    icon: QuestionMarkCircleIcon,
  },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(true);

  return (
    <div className="min-h-screen bg-gray-100">
      {/* 사이드바 */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r transform transition-transform duration-200 ease-in-out ${
          isMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* 로고 */}
        <div className="h-16 flex items-center justify-between px-4 border-b">
          <h1 className="text-xl font-bold text-primary-DEFAULT">
            Project-Solo Admin
          </h1>
          <button
            onClick={() => setIsMenuOpen(false)}
            className="p-2 rounded-lg hover:bg-gray-100 lg:hidden"
          >
            ×
          </button>
        </div>

        {/* 메뉴 아이템 */}
        <nav className="mt-4 px-2">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg mb-1 ${
                  isActive
                    ? 'bg-primary-50 text-primary-DEFAULT'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <item.icon className="w-6 h-6" />
                <span>{item.name}</span>
              </Link>
            );
          })}

          {/* 로그아웃 */}
          <button className="flex items-center gap-3 px-4 py-3 rounded-lg mb-1 text-gray-700 hover:bg-gray-50 w-full mt-8">
            <ArrowLeftOnRectangleIcon className="w-6 h-6" />
            <span>로그아웃</span>
          </button>
        </nav>
      </div>

      {/* 메인 컨텐츠 */}
      <div
        className={`transition-all duration-200 ${
          isMenuOpen ? 'ml-64' : 'ml-0'
        }`}
      >
        {/* 상단 헤더 */}
        <div className="h-16 bg-white border-b px-4 flex items-center">
          <button
            onClick={() => setIsMenuOpen(true)}
            className={`p-2 rounded-lg hover:bg-gray-100 lg:hidden ${
              isMenuOpen ? 'hidden' : 'block'
            }`}
          >
            ☰
          </button>
        </div>

        {/* 페이지 컨텐츠 */}
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
} 