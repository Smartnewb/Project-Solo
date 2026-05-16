'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { ChevronDown, Star } from 'lucide-react';
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

interface FavoriteNavLink extends NavLink {
  category: string;
  icon: string;
}

const FAVORITE_STORAGE_KEY = 'admin-sidebar.favorite-hrefs.v1';

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
      { href: '/admin/unapproved-users', label: '미승인 유저' },
      { href: '/admin/profile-review', label: '프로필 심사' },
      { href: '/admin/reports', label: '프로필 신고 관리' },
      { href: '/admin/blacklist', label: '블랙리스트' },
      { href: '/admin/review-inbox', label: '검토 인박스' },
      {
        id: 'community-automation',
        label: '커뮤니티 관리',
        children: [
          { href: '/admin/community-automation/target-posts', label: '게시글/AI 활동' },
          { href: '/admin/community-automation/questions', label: '주간 질문' },
          { href: '/admin/community-automation/review-queue', label: '검수 대기' },
          { href: '/admin/community-automation/metrics', label: '예약/메트릭' },
        ],
      },
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
      { href: '/admin/somemate-chat', label: '썸메이트 대화' },
      { href: '/admin/ghost-chat', label: 'AI 매칭 채팅' },
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
      { href: '/admin/promotions', label: '프로모션 관리' },
      { href: '/admin/iap-catalog', label: 'IAP 카탈로그' },
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
      { href: '/admin/content', label: '운영 콘텐츠 관리' },
      { href: '/admin/seo', label: 'SEO 상태' },
      { href: '/admin/banners', label: '배너 관리' },
      {
        id: 'utm-management',
        label: 'UTM 추적 관리',
        children: [
          { href: '/admin/utm-management', label: '링크 생성/관리' },
          { href: '/admin/utm-management/dashboard', label: '성과 대시보드' },
        ],
      },
      {
        id: 'x-marketing',
        label: 'X 마케팅 관리',
        children: [
          { href: '/admin/x-marketing/dashboard', label: '대시보드' },
          { href: '/admin/x-marketing/collected-posts', label: '수집 게시글' },
          { href: '/admin/x-marketing/reply-candidates', label: '답변 후보' },
          { href: '/admin/x-marketing/own-posts', label: '독립 게시글' },
          { href: '/admin/x-marketing/actions', label: '액션 이력' },
          { href: '/admin/x-marketing/settings', label: '설정' },
        ],
      },
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
      { href: '/admin/incentive-campaign', label: '인센티브 캠페인' },
      { href: '/admin/care', label: '유저 케어' },
      { href: '/admin/care/logs', label: '케어 이력' },
    ],
  },
  {
    icon: '🤖',
    label: '가상 매칭',
    items: [
      { href: '/admin/ai-profiles/generator', label: 'AI 인연 프로필 (채팅)' },
      { href: '/admin/ai-profiles/generator/templates', label: '— 템플릿' },
      { href: '/admin/ai-profiles/generator/prompt-versions', label: '— 프롬프트 버전' },
      { href: '/admin/ai-profiles/generator/batch', label: '— 배치' },
      { href: '/admin/ghost-chat', label: 'AI 매칭 채팅 관리' },
      { href: '/admin/ai-profiles/ghosts', label: '가상 프로필 (유저 위장)' },
      { href: '/admin/ai-profiles/ghosts/exposures', label: 'Ghost 노출 관리' },
      { href: '/admin/ai-profiles/reference-pool', label: '레퍼런스 풀' },
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
      { href: '/admin/app-preview', label: '앱 UI 시연' },
    ],
  },
];

function flattenNavLinks(): FavoriteNavLink[] {
  return NAV_CATEGORIES.flatMap((category) =>
    category.items.flatMap((item) => {
      const links = isExpandable(item) ? item.children : [item];
      return links.map((link) => ({
        ...link,
        category: category.label,
        icon: category.icon,
      }));
    }),
  );
}

function readFavoriteHrefs(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(FAVORITE_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((value): value is string => typeof value === 'string')
      : [];
  } catch {
    return [];
  }
}

function useFavoriteMenuItems() {
  const [favoriteHrefs, setFavoriteHrefs] = useState<string[]>([]);

  useEffect(() => {
    setFavoriteHrefs(readFavoriteHrefs());
  }, []);

  const toggleFavorite = (href: string) => {
    setFavoriteHrefs((current) => {
      const next = current.includes(href)
        ? current.filter((item) => item !== href)
        : [...current, href];
      try {
        window.localStorage.setItem(FAVORITE_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // ignore quota/access errors
      }
      return next;
    });
  };

  return { favoriteHrefs, toggleFavorite };
}

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
  favoriteHrefs: string[];
  onToggleFavorite: (href: string) => void;
}

function FavoriteButton({
  label,
  active,
  onClick,
  activeRow,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  activeRow?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={`${label} 즐겨찾기 ${active ? '해제' : '추가'}`}
      aria-pressed={active}
      title={`즐겨찾기 ${active ? '해제' : '추가'}`}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onClick();
      }}
      className={`mx-1 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors ${
        active
          ? 'text-[#ffd166] hover:bg-white/10'
          : activeRow
            ? 'text-white/80 hover:bg-white/15 hover:text-white'
            : 'text-[#8fb0d6] hover:bg-white/10 hover:text-[#e6f0ff]'
      }`}
    >
      <Star className="h-4 w-4" fill={active ? 'currentColor' : 'none'} />
    </button>
  );
}

function SidebarLinkRow({
  href,
  label,
  pathname,
  onNavigate,
  favorite,
  onToggleFavorite,
  nested = false,
}: NavLink & {
  pathname: string;
  onNavigate?: () => void;
  favorite: boolean;
  onToggleFavorite: (href: string) => void;
  nested?: boolean;
}) {
  const active = pathname === href;

  return (
    <div
      className={`flex items-center overflow-hidden rounded-lg transition-colors ${
        active
          ? 'bg-[#2563eb] text-white shadow-sm shadow-blue-950/30'
          : 'text-[#d2e0f3] hover:bg-[#10345f] hover:text-white'
      }`}
    >
      <Link
        href={href}
        onClick={onNavigate}
        className={`min-w-0 flex-1 py-3 text-[15px] font-medium leading-6 ${nested ? 'pl-9 pr-2' : 'px-4 pr-2'}`}
      >
        <span className="block truncate">{label}</span>
      </Link>
      <FavoriteButton
        label={label}
        active={favorite}
        activeRow={active}
        onClick={() => onToggleFavorite(href)}
      />
    </div>
  );
}

function ExpandableGroup({
  item,
  pathname,
  onNavigate,
  favoriteHrefs,
  onToggleFavorite,
}: ExpandableGroupProps) {
  const childHrefs = item.children.map((c) => c.href);
  const containsActive = childHrefs.some((href) => pathname === href || pathname.startsWith(`${href}/`));
  const [open, setOpen] = useExpandableState(item.id, item.defaultOpen ?? false, containsActive);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg px-4 py-3 text-[15px] font-semibold leading-6 text-[#d2e0f3] transition-colors hover:bg-[#10345f] hover:text-white">
        <span>{item.label}</span>
        <ChevronDown
          className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <ul>
          {item.children.map((child) => (
            <li key={child.href} className="mt-1">
              <SidebarLinkRow
                href={child.href}
                label={child.label}
                pathname={pathname}
                onNavigate={onNavigate}
                favorite={favoriteHrefs.includes(child.href)}
                onToggleFavorite={onToggleFavorite}
                nested
              />
            </li>
          ))}
        </ul>
      </CollapsibleContent>
    </Collapsible>
  );
}

function FavoriteMenuPanel({
  items,
  onNavigate,
  onToggleFavorite,
}: {
  items: FavoriteNavLink[];
  onNavigate?: () => void;
  onToggleFavorite: (href: string) => void;
}) {
  if (items.length === 0) return null;

  return (
    <section className="mb-4 rounded-xl border border-[#1f4b7a] bg-[#0b2748] p-3">
      <div className="mb-2 flex items-center justify-between px-1">
        <h3 className="text-[13px] font-semibold uppercase tracking-normal text-[#b3d6ff]">
          즐겨찾기
        </h3>
        <span className="rounded-full bg-[#06162b] px-2 py-0.5 text-xs font-medium text-[#d8e6f8]">
          {items.length}
        </span>
      </div>
      <div className="grid grid-cols-1 gap-2">
        {items.map((item) => (
          <div
            key={item.href}
            className="group flex items-center gap-2 rounded-lg border border-[#1f4b7a] bg-[#071a33] px-3 py-2.5 shadow-sm transition-colors hover:border-[#4f8fd8] hover:bg-[#10345f]"
          >
            <Link href={item.href} onClick={onNavigate} className="min-w-0 flex-1">
              <span className="mb-0.5 flex items-center gap-1.5 text-xs font-medium text-[#a9c2df]">
                <span>{item.icon}</span>
                <span className="truncate">{item.category}</span>
              </span>
              <span className="block truncate text-[15px] font-semibold leading-6 text-white">
                {item.label}
              </span>
            </Link>
            <FavoriteButton
              label={item.label}
              active
              onClick={() => onToggleFavorite(item.href)}
            />
          </div>
        ))}
      </div>
    </section>
  );
}

export function AdminSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { favoriteHrefs, toggleFavorite } = useFavoriteMenuItems();
  const favoriteItems = useMemo(() => {
    const allItems = flattenNavLinks();
    return favoriteHrefs
      .map((href) => allItems.find((item) => item.href === href))
      .filter((item): item is FavoriteNavLink => Boolean(item));
  }, [favoriteHrefs]);

  return (
    <nav className="flex-1 overflow-y-auto bg-[#071a33] px-4 py-4">
      <FavoriteMenuPanel
        items={favoriteItems}
        onNavigate={onNavigate}
        onToggleFavorite={toggleFavorite}
      />
      {NAV_CATEGORIES.map((category) => (
        <div key={category.label}>
          <div className="mt-4 px-3 py-2 text-[13px] font-semibold uppercase tracking-normal text-[#a9c7eb]">
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
                      favoriteHrefs={favoriteHrefs}
                      onToggleFavorite={toggleFavorite}
                    />
                  </li>
                );
              }
              return (
                <li key={item.href} className="mt-1">
                  <SidebarLinkRow
                    href={item.href}
                    label={item.label}
                    pathname={pathname ?? ''}
                    onNavigate={onNavigate}
                    favorite={favoriteHrefs.includes(item.href)}
                    onToggleFavorite={toggleFavorite}
                  />
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
