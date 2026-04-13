'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/shared/ui/collapsible';

interface NavLink {
  href: string;
  label: string;
}

interface NavExpandable {
  id: string;
  label: string;
  children: NavLink[];
  defaultOpen?: boolean;
}

type NavItem = NavLink | NavExpandable;

interface NavCategory {
  icon: string;
  label: string;
  items: NavItem[];
}

function isExpandable(item: NavItem): item is NavExpandable {
  return 'children' in item;
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
      { href: '/admin/reports', label: '프로필 신고 관리' },
      { href: '/admin/review-inbox', label: '검토 인박스' },
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
      { href: '/admin/keywords', label: '키워드 관리' },
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
      { href: '/admin/push-notifications/catalog', label: '알림 구조도' },
      { href: '/admin/fcm-tokens', label: 'FCM 토큰 현황' },
      { href: '/admin/card-news', label: '카드뉴스 관리' },
      { href: '/admin/banners', label: '배너 관리' },
      { href: '/admin/sometime-articles', label: '썸타임 이야기' },
      { href: '/admin/utm-management', label: 'UTM 추적' },
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
      { href: '/admin/care', label: '유저 케어' },
      { href: '/admin/care/logs', label: '케어 이력' },
    ],
  },
  {
    icon: '🤖',
    label: '가상 매칭',
    items: [
      { href: '/admin/ai-profiles/ghosts', label: '가상 프로필' },
      { href: '/admin/ai-profiles/candidates', label: '매칭 후보' },
      { href: '/admin/ai-profiles/policy', label: '노출 정책' },
      { href: '/admin/ai-profiles/schools', label: '학교 설정' },
      { href: '/admin/ai-profiles/rollback', label: '긴급 중단' },
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

function useExpandableState(
  id: string,
  defaultOpen: boolean,
  forceOpen: boolean,
): [boolean, (next: boolean) => void] {
  const storageKey = `admin-sidebar.${id}.open`;
  const [open, setOpen] = useState<boolean>(defaultOpen);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const stored = window.localStorage.getItem(storageKey);
      if (stored !== null) {
        setOpen(stored === '1');
      }
    } catch {
      // ignore quota/access errors
    }
  }, [storageKey]);

  useEffect(() => {
    if (forceOpen) setOpen(true);
  }, [forceOpen]);

  const update = (next: boolean) => {
    setOpen(next);
    try {
      window.localStorage.setItem(storageKey, next ? '1' : '0');
    } catch {
      // ignore
    }
  };

  return [open, update];
}

interface ExpandableGroupProps {
  item: NavExpandable;
  pathname: string;
  onNavigate?: () => void;
}

function ExpandableGroup({ item, pathname, onNavigate }: ExpandableGroupProps) {
  const childHrefs = item.children.map((c) => c.href);
  const containsActive = childHrefs.some((href) => pathname === href || pathname.startsWith(`${href}/`));
  const [open, setOpen] = useExpandableState(item.id, item.defaultOpen ?? false, containsActive);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="flex w-full items-center justify-between px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50">
        <span>{item.label}</span>
        <ChevronDown
          className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <ul>
          {item.children.map((child) => (
            <li key={child.href}>
              <Link
                href={child.href}
                onClick={onNavigate}
                className={`block pl-8 pr-4 py-2.5 text-sm transition-colors ${
                  pathname === child.href
                    ? 'bg-primary text-white'
                    : 'text-gray-600 hover:bg-primary hover:text-white'
                }`}
              >
                {child.label}
              </Link>
            </li>
          ))}
        </ul>
      </CollapsibleContent>
    </Collapsible>
  );
}

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
            {category.items.map((item) => {
              if (isExpandable(item)) {
                return (
                  <li key={item.id}>
                    <ExpandableGroup
                      item={item}
                      pathname={pathname ?? ''}
                      onNavigate={onNavigate}
                    />
                  </li>
                );
              }
              return (
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
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
