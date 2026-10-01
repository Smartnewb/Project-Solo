"use client";

import Link from "next/link";
import { Button, Input, Label, TextField } from "@heroui/react";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
	ChevronDown,
	Star,
	Search,
	X,
	ChartNoAxesCombined,
	Users,
	HeartHandshake,
	Wallet,
	Megaphone,
	RefreshCw,
	Bot,
	Settings,
	type LucideIcon,
} from "lucide-react";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/shared/ui/collapsible";

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

const FAVORITE_STORAGE_KEY = "admin-sidebar.favorite-hrefs.v1";

function isExpandable(item: NavItem): item is NavExpandable {
	return "children" in item;
}

export const NAV_CATEGORIES: NavCategory[] = [
	{
		icon: "📊",
		label: "대시보드",
		items: [
			{ href: "/admin/dashboard", label: "대시보드" },
			{ href: "/admin/dashboard/member-stats", label: "회원 통계" },
			{ href: "/admin/kpi-report", label: "KPI 리포트" },
			{ href: "/admin/app-reviews", label: "앱 리뷰 관리" },
		],
	},
	{
		icon: "👥",
		label: "회원 관리",
		items: [
			{ href: "/admin/users/appearance", label: "사용자 관리" },
			{ href: "/admin/unapproved-users", label: "미승인 유저" },
			{ href: "/admin/profile-review", label: "프로필 심사" },
			{ href: "/admin/profile-image-audit", label: "프로필 이미지 전수검사" },
			{ href: "/admin/eta-mission-review", label: "에타 미션 인증 심사" },
			{ href: "/admin/jp-identity", label: "일본 신분증 심사" },
			{ href: "/admin/reports", label: "프로필 신고 관리" },
			{ href: "/admin/blacklist", label: "블랙리스트" },
			{ href: "/admin/review-inbox", label: "검토 인박스" },
			{
				id: "community-automation",
				label: "커뮤니티 관리",
				children: [
					{
						href: "/admin/community-automation/target-posts",
						label: "게시글/AI 활동",
					},
					{ href: "/admin/community-automation/questions", label: "주간 질문" },
					{
						href: "/admin/community-automation/love-court",
						label: "오늘의 상담",
					},
					{
						href: "/admin/community-automation/review-queue",
						label: "검수 대기",
					},
					{ href: "/admin/community-automation/metrics", label: "예약/메트릭" },
				],
			},
			{
				id: "support-chat",
				label: "고객 지원",
				children: [
					{ href: "/admin/support-chat", label: "상담" },
					{ href: "/admin/support-chat/playground", label: "CS Playground" },
					{ href: "/admin/support-chat/kb-review", label: "KB 검수큐" },
				],
			},
			{ href: "/admin/universities", label: "대학교 관리" },
			{ href: "/admin/universities/clusters", label: "대학교 클러스터" },
			{ href: "/admin/reset-password", label: "비밀번호 초기화" },
		],
	},
	{
		icon: "💕",
		label: "매칭/채팅",
		items: [
			{ href: "/admin/matching-management", label: "매칭 관리" },
			{ href: "/admin/matching-monitor", label: "매칭 모니터" },
			{ href: "/admin/likes", label: "좋아요 관리" },
			{ href: "/admin/scheduled-matching", label: "정기 매칭" },
			{ href: "/admin/chat", label: "채팅 관리" },
			{ href: "/admin/somemate-chat", label: "썸메이트 대화" },
			{ href: "/admin/ghost-chat", label: "AI 매칭 채팅" },
			{ href: "/admin/style-reference", label: "V4 스타일 관리" },
			{ href: "/admin/keywords", label: "키워드 관리" },
			{ href: "/admin/moment", label: "모먼트" },
			{ href: "/admin/pixel-campus", label: "픽셀 캠퍼스" },
			{ href: "/admin/meeting", label: "2:2 미팅" },
		],
	},
	{
		icon: "💰",
		label: "결제/매출",
		items: [
			{ href: "/admin/sales", label: "매출 조회" },
			{ href: "/admin/gems", label: "구슬 관리" },
			{ href: "/admin/gems/pricing", label: "구슬 가격 관리" },
			{ href: "/admin/promotions", label: "프로모션 관리" },
			{ href: "/admin/iap-catalog", label: "상품 카탈로그" },
			{ href: "/admin/ios-refund", label: "iOS 환불 관리" },
		],
	},
	{
		icon: "📢",
		label: "마케팅",
		items: [
			{
				id: "sms",
				label: "SMS 관리",
				children: [
					{ href: "/admin/sms", label: "SMS 발송" },
					{ href: "/admin/sms/registry", label: "문자 명부" },
					{ href: "/admin/sms/jobs", label: "대량 발송 이력" },
				],
			},
			{ href: "/admin/push-notifications", label: "푸시 알림 관리" },
			{ href: "/admin/push-groups", label: "푸시 타겟 그룹" },
			{ href: "/admin/broadcast-push", label: "예약 푸시 발송" },
			{ href: "/admin/fcm-tokens", label: "FCM 토큰 현황" },
			{ href: "/admin/content", label: "운영 콘텐츠 관리" },
			{ href: "/admin/seo", label: "SEO 상태" },
			{ href: "/admin/banners", label: "배너 관리" },
			{ href: "/admin/policy-documents", label: "정책 개정 등록" },
			{
				id: "utm-management",
				label: "UTM 추적 관리",
				children: [
					{ href: "/admin/utm-management", label: "링크 생성/관리" },
					{ href: "/admin/utm-management/dashboard", label: "성과 대시보드" },
				],
			},
			{
				id: "x-marketing",
				label: "X 마케팅 관리",
				children: [
					{ href: "/admin/x-marketing/dashboard", label: "대시보드" },
					{ href: "/admin/x-marketing/collected-posts", label: "수집 게시글" },
					{ href: "/admin/x-marketing/reply-candidates", label: "답변 후보" },
					{ href: "/admin/x-marketing/own-posts", label: "독립 게시글" },
					{ href: "/admin/x-marketing/actions", label: "액션 이력" },
					{ href: "/admin/x-marketing/settings", label: "설정" },
				],
			},
		],
	},
	{
		icon: "🔄",
		label: "리텐션",
		items: [
			{ href: "/admin/female-retention", label: "여성 유저 리텐션" },
			{ href: "/admin/deleted-females", label: "탈퇴 회원 복구" },
			{ href: "/admin/dormant-likes", label: "파묘 좋아요" },
			{ href: "/admin/dormant-likes/logs", label: "처리 이력" },
			{ href: "/admin/incentive-campaign", label: "인센티브 캠페인" },
			{ href: "/admin/care", label: "유저 케어" },
			{ href: "/admin/care/logs", label: "케어 이력" },
		],
	},
	{
		icon: "🤖",
		label: "가상 매칭",
		items: [
			{ href: "/admin/ai-profiles/generator", label: "AI 인연 프로필 (채팅)" },
			{ href: "/admin/ai-profiles/generator/templates", label: "— 템플릿" },
			{
				href: "/admin/ai-profiles/generator/prompt-versions",
				label: "— 프롬프트 버전",
			},
			{ href: "/admin/ai-profiles/generator/batch", label: "— 배치" },
			{ href: "/admin/ghost-chat", label: "AI 매칭 채팅 관리" },
			{ href: "/admin/ai-profiles/ghosts", label: "가상 프로필 (유저 위장)" },
			{ href: "/admin/ai-profiles/ghosts/exposures", label: "Ghost 노출 관리" },
			{ href: "/admin/ai-profiles/reference-pool", label: "레퍼런스 풀" },
			{ href: "/admin/ai-profiles/candidates", label: "매칭 후보" },
			{ href: "/admin/ai-profiles/policy", label: "노출 정책" },
			{ href: "/admin/ai-profiles/schools", label: "학교 설정" },
			{ href: "/admin/ai-profiles/rollback", label: "긴급 중단" },
		],
	},
	{
		icon: "⚙️",
		label: "설정",
		items: [
			{ href: "/admin/version-management", label: "버전 관리" },
			{ href: "/admin/access-logs", label: "개인정보 접속기록" },
			{ href: "/admin/feature-flags", label: "Feature Flags" },
			{ href: "/admin/lab", label: "실험실" },
			{ href: "/admin/app-preview", label: "앱 UI 시연" },
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
	if (typeof window === "undefined") return [];
	try {
		const raw = window.localStorage.getItem(FAVORITE_STORAGE_KEY);
		if (!raw) return [];
		const parsed = JSON.parse(raw);
		return Array.isArray(parsed)
			? parsed.filter((value): value is string => typeof value === "string")
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
		if (typeof window === "undefined") return;
		try {
			const stored = window.localStorage.getItem(storageKey);
			if (stored !== null) {
				setOpen(stored === "1");
			}
		} catch {
			// ignore quota/access errors
		}
	}, [storageKey]);

	const update = (next: boolean) => {
		setOpen(next);
		try {
			window.localStorage.setItem(storageKey, next ? "1" : "0");
		} catch {
			// ignore
		}
	};

	return [forceOpen || open, update];
}

const categoryIcons: Record<string, LucideIcon> = {
	대시보드: ChartNoAxesCombined,
	"회원 관리": Users,
	"매칭/채팅": HeartHandshake,
	"결제/매출": Wallet,
	마케팅: Megaphone,
	리텐션: RefreshCw,
	"가상 매칭": Bot,
	설정: Settings,
};
const rowClass = "h-10 [@media(pointer:coarse)]:h-11";
function FavoriteButton({
	label,
	active,
	onPress,
}: { label: string; active: boolean; onPress: () => void }) {
	return (
		<Button
			variant="ghost"
			isIconOnly
			size="sm"
			aria-label={`${label} 즐겨찾기 ${active ? "해제" : "추가"}`}
			aria-pressed={active}
			onPress={onPress}
			className={`!h-10 !w-9 [@media(pointer:coarse)]:!h-11 [@media(pointer:coarse)]:!w-11 !min-w-0 !rounded-md !bg-transparent p-0 shadow-none transition-opacity ${active ? "text-amber-600" : "text-current opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 focus-visible:opacity-100 [@media(hover:none)]:opacity-100"}`}
		>
			<Star size={15} fill={active ? "currentColor" : "none"} />
		</Button>
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
			className={`group flex items-center overflow-hidden rounded-lg ${active ? "bg-[#7A4AE2] text-white" : "text-gray-700 hover:bg-gray-100"}`}
		>
			<Link
				href={href}
				aria-current={active ? "page" : undefined}
				onClick={onNavigate}
				className={`${rowClass} flex min-w-0 flex-1 items-center text-sm font-medium ${nested ? "pl-8" : "pl-3"}`}
			>
				<span className="truncate">{label}</span>
			</Link>
			<FavoriteButton
				label={label}
				active={favorite}
				onPress={() => onToggleFavorite(href)}
			/>
		</div>
	);
}
type MenuProps = {
	pathname: string;
	onNavigate?: () => void;
	favoriteHrefs: string[];
	onToggleFavorite: (href: string) => void;
	searching?: boolean;
};
function ExpandableGroup({
	item,
	...props
}: MenuProps & { item: NavExpandable }) {
	const containsActive = item.children.some(
		({ href }) =>
			props.pathname === href || props.pathname.startsWith(`${href}/`),
	);
	const [open, setOpen] = useExpandableState(
		item.id,
		item.defaultOpen ?? false,
		containsActive || Boolean(props.searching),
	);
	return (
		<Collapsible open={open} onOpenChange={setOpen}>
			<CollapsibleTrigger
				className={`${rowClass} flex w-full items-center justify-between rounded-lg px-3 text-sm font-medium text-gray-700 hover:bg-gray-100`}
			>
				<span>{item.label}</span>
				<ChevronDown size={15} className={open ? "rotate-180" : ""} />
			</CollapsibleTrigger>
			<CollapsibleContent>
				<ul className="space-y-0.5">
					{item.children.map((child) => (
						<li key={child.href}>
							<SidebarLinkRow
								{...child}
								{...props}
								favorite={props.favoriteHrefs.includes(child.href)}
								nested
							/>
						</li>
					))}
				</ul>
			</CollapsibleContent>
		</Collapsible>
	);
}
function CategoryGroup({
	category,
	...props
}: MenuProps & { category: NavCategory }) {
	const children = category.items.flatMap((item) =>
		isExpandable(item) ? item.children : [item],
	);
	const containsActive = children.some(
		({ href }) =>
			props.pathname === href || props.pathname.startsWith(`${href}/`),
	);
	const [open, setOpen] = useExpandableState(
		`category.${category.label}`,
		false,
		containsActive || Boolean(props.searching),
	);
	const Icon = categoryIcons[category.label] ?? Settings;
	return (
		<Collapsible open={open} onOpenChange={setOpen}>
			<CollapsibleTrigger
				className={`${rowClass} flex w-full items-center gap-2 rounded-lg px-3 text-xs font-semibold text-gray-600 hover:bg-gray-100`}
			>
				<Icon size={16} />
				<span className="flex-1 text-left">{category.label}</span>
				<ChevronDown size={14} className={open ? "rotate-180" : ""} />
			</CollapsibleTrigger>
			<CollapsibleContent>
				<ul className="space-y-0.5">
					{category.items.map((item) => (
						<li key={isExpandable(item) ? item.id : item.href}>
							{isExpandable(item) ? (
								<ExpandableGroup item={item} {...props} />
							) : (
								<SidebarLinkRow
									{...item}
									{...props}
									favorite={props.favoriteHrefs.includes(item.href)}
								/>
							)}
						</li>
					))}
				</ul>
			</CollapsibleContent>
		</Collapsible>
	);
}
export function AdminSidebar({ onNavigate }: { onNavigate?: () => void }) {
	const pathname = usePathname() ?? "";
	const [query, setQuery] = useState("");
	const { favoriteHrefs, toggleFavorite } = useFavoriteMenuItems();
	const allItems = useMemo(() => flattenNavLinks(), []);
	const favoriteItems = favoriteHrefs
		.map((href) => allItems.find((item) => item.href === href))
		.filter((item): item is FavoriteNavLink => Boolean(item));
	const term = query.trim().toLocaleLowerCase();
	const results = term
		? Array.from(
				new Map(
					allItems
						.filter((item) =>
							`${item.label} ${item.category} ${item.href}`
								.toLocaleLowerCase()
								.includes(term),
						)
						.map((item) => [item.href, item]),
				).values(),
			)
		: [];
	const props = {
		pathname,
		onNavigate,
		favoriteHrefs,
		onToggleFavorite: toggleFavorite,
	};
	return (
		<nav
			aria-label="운영 메뉴"
			className="flex min-h-0 flex-1 flex-col bg-white"
		>
			<div className="shrink-0 px-3 py-3">
				<TextField>
					<Label className="sr-only">메뉴 검색</Label>
					<div className="relative">
						<Search
							size={15}
							className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-gray-400"
						/>
						<Input
							value={query}
							onChange={(event) => setQuery(event.target.value)}
							placeholder="메뉴 검색"
							className="h-10 w-full pl-9 pr-10 text-sm"
						/>
						{query && (
							<Button
								variant="ghost"
								isIconOnly
								size="sm"
								aria-label="메뉴 검색 지우기"
								onPress={() => setQuery("")}
								className="absolute right-1 top-1 h-8 w-8 min-w-0"
							>
								<X size={14} />
							</Button>
						)}
					</div>
				</TextField>
			</div>
			<div className="min-h-0 flex-1 overflow-y-auto px-2 pb-3">
				{term ? (
					<section aria-label="메뉴 검색 결과">
						<ul className="space-y-0.5">
							{results.map((item) => (
								<li key={item.href}>
									<SidebarLinkRow
										{...item}
										{...props}
										favorite={favoriteHrefs.includes(item.href)}
									/>
								</li>
							))}
						</ul>
						{results.length === 0 && (
							<p role="status" className="px-3 py-4 text-sm text-gray-500">
								일치하는 메뉴가 없습니다.
							</p>
						)}
					</section>
				) : (
					<>
						{favoriteItems.length > 0 && (
							<section
								aria-label="즐겨찾기"
								className="mb-2 border-b border-gray-100 pb-2"
							>
								<h3 className="px-3 py-1 text-xs font-semibold text-gray-500">
									즐겨찾기
								</h3>
								<ul className="space-y-0.5">
									{favoriteItems.map((item) => (
										<li key={item.href}>
											<SidebarLinkRow {...item} {...props} favorite />
										</li>
									))}
								</ul>
							</section>
						)}
						<div className="space-y-1">
							{NAV_CATEGORIES.map((category) => (
								<CategoryGroup
									key={category.label}
									category={category}
									{...props}
								/>
							))}
						</div>
					</>
				)}
			</div>
		</nav>
	);
}
