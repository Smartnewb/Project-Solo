'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavItem {
  href: string;
  label: string;
}

interface NavCategory {
  icon: string;
  label: string;
  items: NavItem[];
}

export const NAV_CATEGORIES: NavCategory[] = [
  {
    icon: '📊',
    label: '대시보드',
    items: [
      { href: '/admin/dashboard', label: '대시보드' },
      { href: '/admin/dashboard/member-stats', label: '회원 통계' },
      { href: '/admin/kpi-report', label: 'KPI 리포트' },
      { href: '/admin/app-reviews', label: '앱 리뷰 관리' },
    ],
  },
  {
    icon: '👥',
    label: '회원 관리',
    items: [
      { href: '/admin/users/appearance', label: '사용자 관리' },
      { href: '/admin/profile-review', label: '프로필 심사' },
      { href: '/admin/reports', label: '신고 관리' },
      { href: '/admin/community', label: '커뮤니티' },
      { href: '/admin/support-chat', label: '고객 지원' },
      { href: '/admin/universities', label: '대학교 관리' },
      { href: '/admin/universities/clusters', label: '대학교 클러스터' },
      { href: '/admin/reset-password', label: '비밀번호 초기화' },
    ],
  },
  {
    icon: '💕',
    label: '매칭/채팅',
    items: [
      { href: '/admin/matching-management', label: '매칭 관리' },
      { href: '/admin/matching-monitor', label: '매칭 모니터' },
      { href: '/admin/likes', label: '좋아요 관리' },
      { href: '/admin/scheduled-matching', label: '정기 매칭' },
      { href: '/admin/chat', label: '채팅 관리' },
      { href: '/admin/ai-chat', label: 'AI 채팅' },
      { href: '/admin/style-reference', label: 'V4 스타일 관리' },
      { href: '/admin/moment', label: '모먼트' },
    ],
  },
  {
    icon: '💰',
    label: '결제/매출',
    items: [
      { href: '/admin/sales', label: '매출 조회' },
      { href: '/admin/gems', label: '구슬 관리' },
      { href: '/admin/gems/pricing', label: '구슬 가격표' },
      { href: '/admin/ios-refund', label: 'iOS 환불 관리' },
    ],
  },
  {
    icon: '📢',
    label: '마케팅',
    items: [
      { href: '/admin/sms', label: 'SMS 관리' },
      { href: '/admin/push-notifications', label: '푸시 알림 관리' },
      { href: '/admin/fcm-tokens', label: 'FCM 토큰 현황' },
      { href: '/admin/card-news', label: '카드뉴스 관리' },
      { href: '/admin/banners', label: '배너 관리' },
      { href: '/admin/sometime-articles', label: '썸타임 이야기' },
    ],
  },
  {
    icon: '🔄',
    label: '리텐션',
    items: [
      { href: '/admin/female-retention', label: '여성 유저 리텐션' },
      { href: '/admin/deleted-females', label: '탈퇴 회원 복구' },
      { href: '/admin/dormant-likes', label: '파묘 좋아요' },
      { href: '/admin/dormant-likes/logs', label: '처리 이력' },
    ],
  },
  {
    icon: '⚙️',
    label: '설정',
    items: [
      { href: '/admin/version-management', label: '버전 관리' },
      { href: '/admin/feature-flags', label: 'Feature Flags' },
      { href: '/admin/lab', label: '실험실' },
    ],
  },
];

export function AdminSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex-1 overflow-y-auto py-4">
      {NAV_CATEGORIES.map((category) => (
        <div key={category.label}>
          <div className="px-4 py-2 mt-3 text-sm font-semibold text-gray-400 uppercase tracking-wider">
            {category.icon} {category.label}
          </div>
          <ul>
            {category.items.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onNavigate}
                  className={`block px-4 py-2.5 text-sm transition-colors ${
                    pathname === item.href
                      ? 'bg-primary text-white'
                      : 'text-gray-600 hover:bg-primary hover:text-white'
                  }`}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}
