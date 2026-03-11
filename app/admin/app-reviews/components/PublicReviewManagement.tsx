'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import {
	Box,
	Card,
	CardContent,
	Typography,
	Chip,
	Button,
	CircularProgress,
	Alert,
	Skeleton,
	Rating,
	ToggleButton,
	ToggleButtonGroup,
	Tooltip,
	Divider,
	Snackbar,
	Tab,
	Tabs,
} from '@mui/material';
import AppleIcon from '@mui/icons-material/Apple';
import ShopIcon from '@mui/icons-material/Shop';
import ForumIcon from '@mui/icons-material/Forum';
import WhatshotIcon from '@mui/icons-material/Whatshot';
import PhoneAndroidIcon from '@mui/icons-material/PhoneAndroid';
import PublicIcon from '@mui/icons-material/Public';
import PublicOffIcon from '@mui/icons-material/PublicOff';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditNoteIcon from '@mui/icons-material/EditNote';
import { SvgIconComponent } from '@mui/icons-material';
import AdminService, {
	type AppReviewItem,
	type CommunityReviewArticle,
	type PublicReviewItem,
	type PublicReviewSource,
} from '@/app/services/admin';
import { RATING_COLORS } from './ReviewList';
import { formatSimpleDate } from '@/app/utils/formatters';

type ManageSourceFilter = 'ALL' | 'APP_STORE' | 'PLAY_STORE' | 'COMMUNITY' | 'INAPP';
type FeaturedFilter = 'ALL' | 'FEATURED' | 'UNFEATURED';
type PublicSourceFilter = 'ALL' | 'app' | 'community' | 'inapp' | 'hot' | 'review';
type ViewMode = 'manage' | 'public';

const SOURCE_CONFIG: Record<
	'APP_STORE' | 'PLAY_STORE' | 'COMMUNITY' | 'HOT',
	{ label: string; color: string; bg: string; Icon: SvgIconComponent }
> = {
	APP_STORE: { label: 'App Store', color: '#007AFF', bg: '#f0f4ff', Icon: AppleIcon },
	PLAY_STORE: { label: 'Play Store', color: '#34A853', bg: '#f0fdf4', Icon: ShopIcon },
	COMMUNITY: { label: '커뮤니티', color: '#8b5cf6', bg: '#f5f3ff', Icon: ForumIcon },
	HOT: { label: '인기 게시글', color: '#ef4444', bg: '#fef2f2', Icon: WhatshotIcon },
};

const CARD_CONTENT_SX = { p: 2.5, '&:last-child': { pb: 2.5 } } as const;

function applyFeaturedFilter(isFeatured: boolean | undefined, filter: FeaturedFilter): boolean {
	if (filter === 'FEATURED') return !!isFeatured;
	if (filter === 'UNFEATURED') return !isFeatured;
	return true;
}

// ─── 메인 컴포넌트 ────────────────────────────────────
export default function PublicReviewManagement() {
	const [viewMode, setViewMode] = useState<ViewMode>('manage');

	return (
		<Box className="space-y-4">
			<Card>
				<Tabs
					value={viewMode}
					onChange={(_, val) => setViewMode(val)}
					sx={{ px: 2 }}
				>
					<Tab
						value="manage"
						label={
							<Box className="flex items-center gap-1">
								<EditNoteIcon sx={{ fontSize: 18 }} />
								공개 관리
							</Box>
						}
					/>
					<Tab
						value="public"
						label={
							<Box className="flex items-center gap-1">
								<VisibilityIcon sx={{ fontSize: 18 }} />
								공개 리뷰 조회
							</Box>
						}
					/>
				</Tabs>
			</Card>

			{viewMode === 'manage' ? <ManageView /> : <PublicView />}
		</Box>
	);
}

// ═══════════════════════════════════════════════════════
// 관리 뷰: 기존 리뷰를 공개/비공개 토글
// ═══════════════════════════════════════════════════════
function ManageView() {
	const [appReviews, setAppReviews] = useState<AppReviewItem[]>([]);
	const [communityArticles, setCommunityArticles] = useState<CommunityReviewArticle[]>([]);
	const [appNextCursor, setAppNextCursor] = useState<string | null>(null);
	const [communityNextCursor, setCommunityNextCursor] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);
	const [loadingMoreApp, setLoadingMoreApp] = useState(false);
	const [loadingMoreCommunity, setLoadingMoreCommunity] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [togglingId, setTogglingId] = useState<string | null>(null);
	const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; isPublic: boolean }>({
		open: false,
		message: '',
		isPublic: false,
	});

	const [sourceFilter, setSourceFilter] = useState<ManageSourceFilter>('ALL');
	const [featuredFilter, setFeaturedFilter] = useState<FeaturedFilter>('ALL');

	const showSnackbar = useCallback((isFeatured: boolean) => {
		setSnackbar({
			open: true,
			message: isFeatured ? '외부 공개 처리되었습니다.' : '외부 공개가 해제되었습니다.',
			isPublic: isFeatured,
		});
	}, []);

	const fetchAll = useCallback(async () => {
		try {
			setLoading(true);
			setError(null);
			const [appRes, communityRes] = await Promise.all([
				AdminService.appReviews.getList({ limit: 20 }),
				AdminService.communityReviewArticles.getList({ limit: 20 }),
			]);
			setAppReviews(appRes.items);
			setAppNextCursor(appRes.nextCursor);
			setCommunityArticles(communityRes.items);
			setCommunityNextCursor(communityRes.nextCursor);
		} catch (err: any) {
			setError(err.message || '데이터를 불러오는데 실패했습니다.');
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		fetchAll();
	}, [fetchAll]);

	const handleLoadMoreApp = async () => {
		if (!appNextCursor) return;
		try {
			setLoadingMoreApp(true);
			const res = await AdminService.appReviews.getList({ limit: 20, cursor: appNextCursor });
			setAppReviews((prev) => [...prev, ...res.items]);
			setAppNextCursor(res.nextCursor);
		} finally {
			setLoadingMoreApp(false);
		}
	};

	const handleLoadMoreCommunity = async () => {
		if (!communityNextCursor) return;
		try {
			setLoadingMoreCommunity(true);
			const res = await AdminService.communityReviewArticles.getList({
				limit: 20,
				cursor: communityNextCursor,
			});
			setCommunityArticles((prev) => [...prev, ...res.items]);
			setCommunityNextCursor(res.nextCursor);
		} finally {
			setLoadingMoreCommunity(false);
		}
	};

	const handleToggleAppFeatured = async (review: AppReviewItem) => {
		setTogglingId(review.pk);
		try {
			const result = await AdminService.appReviews.toggleFeatured(review.pk);
			setAppReviews((prev) =>
				prev.map((r) =>
					r.pk === review.pk
						? {
								...r,
								isFeatured: result.isFeatured,
								featuredAt: result.isFeatured ? new Date().toISOString() : undefined,
							}
						: r,
				),
			);
			showSnackbar(result.isFeatured);
		} catch {
			setSnackbar({ open: true, message: '처리 중 오류가 발생했습니다.', isPublic: false });
		} finally {
			setTogglingId(null);
		}
	};

	const handleToggleCommunityFeatured = async (article: CommunityReviewArticle) => {
		setTogglingId(article.id);
		try {
			const result = await AdminService.communityReviewArticles.toggleFeatured(article.id);
			setCommunityArticles((prev) =>
				prev.map((a) =>
					a.id === article.id
						? { ...a, isFeatured: result.isFeatured, featuredAt: result.featuredAt }
						: a,
				),
			);
			showSnackbar(result.isFeatured);
		} catch {
			setSnackbar({ open: true, message: '처리 중 오류가 발생했습니다.', isPublic: false });
		} finally {
			setTogglingId(null);
		}
	};

	const showAppReviews =
		sourceFilter === 'ALL' || sourceFilter === 'APP_STORE' || sourceFilter === 'PLAY_STORE';
	const showCommunity =
		sourceFilter === 'ALL' || sourceFilter === 'COMMUNITY' || sourceFilter === 'INAPP';

	const { filteredAppReviews, filteredCommunity, featuredAppCount, featuredCommunityCount } =
		useMemo(() => {
			const apps = appReviews ?? [];
			const comms = communityArticles ?? [];
			const filteredApp = apps.filter(
				(r) =>
					(sourceFilter === 'ALL' || sourceFilter === r.store) &&
					applyFeaturedFilter(r.isFeatured, featuredFilter),
			);
			const filteredComm = comms.filter(
				(a) =>
					(sourceFilter === 'ALL' || sourceFilter === 'COMMUNITY' || sourceFilter === 'INAPP') &&
					applyFeaturedFilter(a.isFeatured, featuredFilter),
			);
			return {
				filteredAppReviews: filteredApp,
				filteredCommunity: filteredComm,
				featuredAppCount: apps.filter((r) => r.isFeatured).length,
				featuredCommunityCount: comms.filter((a) => a.isFeatured).length,
			};
		}, [appReviews, communityArticles, sourceFilter, featuredFilter]);

	if (error) {
		return (
			<Alert severity="error" sx={{ mb: 2 }}>
				{error}
			</Alert>
		);
	}

	return (
		<Box className="space-y-4">
			{/* 공개 현황 요약 */}
			{!loading && (
				<Box className="flex gap-3 flex-wrap">
					<SummaryBadge
						label="스토어 리뷰 공개 중"
						count={featuredAppCount}
						total={appReviews.length}
						color="#007AFF"
					/>
					<SummaryBadge
						label="커뮤니티 리뷰 공개 중"
						count={featuredCommunityCount}
						total={communityArticles.length}
						color="#8b5cf6"
					/>
				</Box>
			)}

			{/* 필터 바 */}
			<Card>
				<CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
					<Box className="flex flex-wrap items-center gap-3">
						<ToggleButtonGroup
							value={sourceFilter}
							exclusive
							onChange={(_, val) => val && setSourceFilter(val)}
							size="small"
						>
							<ToggleButton value="ALL" sx={{ px: 2, py: 0.5 }}>
								<PhoneAndroidIcon sx={{ fontSize: 18, mr: 0.5 }} />
								전체
							</ToggleButton>
							<ToggleButton value="APP_STORE" sx={{ px: 2, py: 0.5 }}>
								<AppleIcon sx={{ fontSize: 18, mr: 0.5 }} />
								App Store
							</ToggleButton>
							<ToggleButton value="PLAY_STORE" sx={{ px: 2, py: 0.5 }}>
								<ShopIcon sx={{ fontSize: 18, mr: 0.5 }} />
								Play Store
							</ToggleButton>
							<ToggleButton value="INAPP" sx={{ px: 2, py: 0.5 }}>
								<WhatshotIcon sx={{ fontSize: 18, mr: 0.5 }} />
								인앱
							</ToggleButton>
							<ToggleButton value="COMMUNITY" sx={{ px: 2, py: 0.5 }}>
								<ForumIcon sx={{ fontSize: 18, mr: 0.5 }} />
								커뮤니티
							</ToggleButton>
						</ToggleButtonGroup>

						<ToggleButtonGroup
							value={featuredFilter}
							exclusive
							onChange={(_, val) => val && setFeaturedFilter(val)}
							size="small"
						>
							<ToggleButton value="ALL" sx={{ px: 2, py: 0.5 }}>
								전체
							</ToggleButton>
							<ToggleButton value="FEATURED" sx={{ px: 2, py: 0.5 }}>
								<PublicIcon sx={{ fontSize: 16, mr: 0.5, color: '#22c55e' }} />
								공개 중
							</ToggleButton>
							<ToggleButton value="UNFEATURED" sx={{ px: 2, py: 0.5 }}>
								<PublicOffIcon sx={{ fontSize: 16, mr: 0.5, color: '#9ca3af' }} />
								비공개
							</ToggleButton>
						</ToggleButtonGroup>
					</Box>
				</CardContent>
			</Card>

			{/* 리뷰 목록 */}
			{loading ? (
				<LoadingSkeletons />
			) : (
				<Box className="space-y-6">
					{showAppReviews && (
						<ReviewListSection
							title="스토어 리뷰"
							count={filteredAppReviews.length}
							hasMore={!!appNextCursor}
							loadingMore={loadingMoreApp}
							onLoadMore={handleLoadMoreApp}
							loadMoreLabel="스토어 리뷰 더 보기"
							emptyLabel="해당하는 리뷰가 없습니다"
						>
							{filteredAppReviews.map((review) => (
								<AppReviewCard
									key={review.pk}
									review={review}
									toggling={togglingId === review.pk}
									onToggle={() => handleToggleAppFeatured(review)}
								/>
							))}
						</ReviewListSection>
					)}

					{showAppReviews && showCommunity && <Divider />}

					{showCommunity && (
						<ReviewListSection
							title="커뮤니티 리뷰"
							count={filteredCommunity.length}
							hasMore={!!communityNextCursor}
							loadingMore={loadingMoreCommunity}
							onLoadMore={handleLoadMoreCommunity}
							loadMoreLabel="커뮤니티 리뷰 더 보기"
							emptyLabel="해당하는 게시글이 없습니다"
						>
							{filteredCommunity.map((article) => (
								<CommunityReviewCard
									key={article.id}
									article={article}
									toggling={togglingId === article.id}
									onToggle={() => handleToggleCommunityFeatured(article)}
								/>
							))}
						</ReviewListSection>
					)}
				</Box>
			)}

			<Snackbar
				open={snackbar.open}
				autoHideDuration={3000}
				onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
				anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
			>
				<Alert
					severity={snackbar.isPublic ? 'success' : 'info'}
					onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
					sx={{ width: '100%' }}
				>
					{snackbar.message}
				</Alert>
			</Snackbar>
		</Box>
	);
}

// ═══════════════════════════════════════════════════════
// 공개 리뷰 조회 뷰: /public-reviews API로 공개된 리뷰 확인
// ═══════════════════════════════════════════════════════
function PublicView() {
	const [reviews, setReviews] = useState<PublicReviewItem[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [sourceFilter, setSourceFilter] = useState<PublicSourceFilter>('ALL');

	const fetchPublicReviews = useCallback(async (type?: 'app' | 'community') => {
		try {
			setLoading(true);
			setError(null);
			const res = await AdminService.publicReviews.getList({ type, limit: 100 });
			setReviews(res.items);
		} catch (err: any) {
			setError(err.message || '공개 리뷰를 불러오는데 실패했습니다.');
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		fetchPublicReviews(sourceFilter === 'ALL' ? undefined : sourceFilter);
	}, [fetchPublicReviews, sourceFilter]);

	const sourceCounts = useMemo(
		() =>
			reviews.reduce<Partial<Record<PublicReviewSource, number>>>((acc, r) => {
				acc[r.source] = (acc[r.source] || 0) + 1;
				return acc;
			}, {}),
		[reviews],
	);

	if (error) {
		return (
			<Alert severity="error" sx={{ mb: 2 }}>
				{error}
			</Alert>
		);
	}

	return (
		<Box className="space-y-4">
			{!loading && (
				<Box className="flex gap-3 flex-wrap">
					<SummaryBadge
						label="전체 공개 리뷰"
						count={reviews.length}
						total={reviews.length}
						color="#6941C6"
					/>
					{(Object.entries(sourceCounts) as [PublicReviewSource, number][]).map(
						([source, count]) => {
							const cfg = SOURCE_CONFIG[source];
							return cfg ? (
								<SummaryBadge
									key={source}
									label={cfg.label}
									count={count}
									total={reviews.length}
									color={cfg.color}
								/>
							) : null;
						},
					)}
				</Box>
			)}

			<Card>
				<CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
					<Box className="flex items-center gap-3">
						<Typography variant="body2" color="text.secondary" fontWeight={500}>
							소스 필터:
						</Typography>
						<ToggleButtonGroup
							value={sourceFilter}
							exclusive
							onChange={(_, val) => val && setSourceFilter(val)}
							size="small"
						>
							<ToggleButton value="ALL" sx={{ px: 2, py: 0.5 }}>
								전체
							</ToggleButton>
							<ToggleButton value="app" sx={{ px: 2, py: 0.5 }}>
								<PhoneAndroidIcon sx={{ fontSize: 18, mr: 0.5 }} />
								스토어 + 인기글
							</ToggleButton>
							<ToggleButton value="inapp" sx={{ px: 2, py: 0.5 }}>
								<WhatshotIcon sx={{ fontSize: 18, mr: 0.5 }} />
								인앱 리뷰
							</ToggleButton>
							<ToggleButton value="hot" sx={{ px: 2, py: 0.5 }}>
								<WhatshotIcon sx={{ fontSize: 18, mr: 0.5 }} />
								인기글만
							</ToggleButton>
							<ToggleButton value="review" sx={{ px: 2, py: 0.5 }}>
								<ForumIcon sx={{ fontSize: 18, mr: 0.5 }} />
								리뷰만
							</ToggleButton>
							<ToggleButton value="community" sx={{ px: 2, py: 0.5 }}>
								<ForumIcon sx={{ fontSize: 18, mr: 0.5 }} />
								커뮤니티
							</ToggleButton>
						</ToggleButtonGroup>
					</Box>
				</CardContent>
			</Card>

			{loading ? (
				<LoadingSkeletons />
			) : reviews.length === 0 ? (
				<Card>
					<CardContent>
						<Typography variant="body2" color="text.secondary" className="text-center py-8">
							공개 처리된 리뷰가 없습니다
						</Typography>
					</CardContent>
				</Card>
			) : (
				<Box className="space-y-3">
					{reviews.map((review) => (
						<PublicReviewCard key={review.id} review={review} />
					))}
				</Box>
			)}
		</Box>
	);
}

// ─── 공통 컴포넌트 ───────────────────────────────────

function LoadingSkeletons() {
	return (
		<Box className="space-y-3">
			{Array.from({ length: 6 }).map((_, i) => (
				<Skeleton key={i} variant="rectangular" height={130} sx={{ borderRadius: 2 }} />
			))}
		</Box>
	);
}

function ReviewListSection({
	title,
	count,
	hasMore,
	loadingMore,
	onLoadMore,
	loadMoreLabel,
	emptyLabel,
	children,
}: {
	title: string;
	count: number;
	hasMore: boolean;
	loadingMore: boolean;
	onLoadMore: () => void;
	loadMoreLabel: string;
	emptyLabel: string;
	children: React.ReactNode;
}) {
	return (
		<Box className="space-y-3">
			<Box className="flex items-center gap-2">
				<Typography variant="subtitle1" fontWeight={600} color="text.secondary">
					{title}
				</Typography>
				<Chip label={`${count}건`} size="small" sx={{ height: 22 }} />
				{hasMore && (
					<Typography variant="caption" color="text.disabled">
						(추가 로드 가능)
					</Typography>
				)}
			</Box>

			{count === 0 ? (
				<Card>
					<CardContent>
						<Typography variant="body2" color="text.secondary" className="text-center py-6">
							{emptyLabel}
						</Typography>
					</CardContent>
				</Card>
			) : (
				children
			)}

			{hasMore && (
				<Box className="flex justify-center">
					<Button
						variant="outlined"
						size="small"
						onClick={onLoadMore}
						disabled={loadingMore}
						startIcon={loadingMore ? <CircularProgress size={16} /> : <ExpandMoreIcon />}
					>
						{loadingMore ? '불러오는 중...' : loadMoreLabel}
					</Button>
				</Box>
			)}
		</Box>
	);
}

function SummaryBadge({
	label,
	count,
	total,
	color,
}: {
	label: string;
	count: number;
	total: number;
	color: string;
}) {
	return (
		<Box
			sx={{
				display: 'flex',
				alignItems: 'center',
				gap: 1.5,
				px: 2,
				py: 1,
				borderRadius: 2,
				backgroundColor: '#fff',
				border: '1px solid #e5e7eb',
				boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
			}}
		>
			<CheckCircleIcon sx={{ color, fontSize: 20 }} />
			<Box>
				<Typography variant="caption" color="text.secondary">
					{label}
				</Typography>
				<Typography variant="body2" fontWeight={700}>
					{count}
					<Typography component="span" variant="caption" color="text.disabled" sx={{ ml: 0.5 }}>
						/ {total}건
					</Typography>
				</Typography>
			</Box>
		</Box>
	);
}

function FeaturedToggleButton({
	isFeatured,
	toggling,
	onToggle,
}: {
	isFeatured: boolean | undefined;
	toggling: boolean;
	onToggle: () => void;
}) {
	return (
		<Tooltip title={isFeatured ? '외부 공개 해제' : '외부 공개 처리'}>
			<span>
				<Button
					variant={isFeatured ? 'contained' : 'outlined'}
					size="small"
					onClick={onToggle}
					disabled={toggling}
					startIcon={
						toggling ? (
							<CircularProgress size={14} />
						) : isFeatured ? (
							<PublicIcon />
						) : (
							<PublicOffIcon />
						)
					}
					color={isFeatured ? 'success' : 'inherit'}
					sx={{ minWidth: 100, flexShrink: 0, whiteSpace: 'nowrap', fontWeight: 600 }}
				>
					{isFeatured ? '공개 중' : '비공개'}
				</Button>
			</span>
		</Tooltip>
	);
}

function FeaturedBadge({ children }: { children: React.ReactNode }) {
	return (
		<Box
			sx={{
				mt: 1,
				px: 1.5,
				py: 0.75,
				borderRadius: 1.5,
				backgroundColor: '#f0fdf4',
				border: '1px solid #bbf7d0',
				display: 'inline-flex',
				alignItems: 'center',
				gap: 1,
			}}
		>
			<CheckCircleIcon sx={{ fontSize: 14, color: '#22c55e' }} />
			<Typography variant="caption" color="success.main">
				{children}
			</Typography>
		</Box>
	);
}

function SourceChip({ source }: { source: keyof typeof SOURCE_CONFIG }) {
	const cfg = SOURCE_CONFIG[source];
	const { Icon } = cfg;
	return (
		<Chip
			label={cfg.label}
			size="small"
			icon={<Icon />}
			sx={{
				backgroundColor: cfg.bg,
				color: cfg.color,
				fontWeight: 500,
				'& .MuiChip-icon': { color: cfg.color },
			}}
		/>
	);
}

function ReviewMeta({ items }: { items: string[] }) {
	return (
		<Box className="flex items-center gap-2 flex-wrap">
			{items.map((item, i) => (
				<Typography key={i} variant="caption" color={i % 2 === 0 ? 'text.secondary' : 'text.disabled'}>
					{i > 0 && i % 2 === 1 ? '·' : item}
				</Typography>
			))}
		</Box>
	);
}

// ─── 카드 컴포넌트 ───────────────────────────────────

function AppReviewCard({
	review,
	toggling,
	onToggle,
}: {
	review: AppReviewItem;
	toggling: boolean;
	onToggle: () => void;
}) {
	const cfg = SOURCE_CONFIG[review.store];

	return (
		<Card
			sx={{
				borderLeft: `4px solid ${cfg.color}`,
				opacity: toggling ? 0.7 : 1,
				transition: 'opacity 0.2s',
			}}
		>
			<CardContent sx={CARD_CONTENT_SX}>
				<Box className="flex items-start justify-between gap-3">
					<Box className="flex-1 min-w-0">
						<Box className="flex items-center gap-2 mb-1.5 flex-wrap">
							<Rating
								value={review.rating}
								readOnly
								size="small"
								sx={{
									'& .MuiRating-iconFilled': { color: RATING_COLORS[review.rating] ?? '#eab308' },
								}}
							/>
							{review.title && (
								<Typography variant="subtitle2" fontWeight={600} noWrap>
									{review.title}
								</Typography>
							)}
							<SourceChip source={review.store} />
						</Box>

						{review.body && (
							<Typography
								variant="body2"
								color="text.primary"
								sx={{
									mb: 1.5,
									lineHeight: 1.6,
									display: '-webkit-box',
									WebkitLineClamp: 3,
									WebkitBoxOrient: 'vertical',
									overflow: 'hidden',
								}}
							>
								{review.body}
							</Typography>
						)}

						<Box className="flex items-center gap-2 flex-wrap">
							<Typography variant="caption" color="text.secondary">
								{review.author}
							</Typography>
							<Typography variant="caption" color="text.disabled">·</Typography>
							<Typography variant="caption" color="text.secondary">
								v{review.appVersion}
							</Typography>
							<Typography variant="caption" color="text.disabled">·</Typography>
							<Typography variant="caption" color="text.secondary">
								{formatSimpleDate(review.createdAt)}
							</Typography>
						</Box>

						{review.isFeatured && review.displayNickname && (
							<FeaturedBadge>
								공개 닉네임: {review.displayNickname}
								{review.displayUniversity && ` · ${review.displayUniversity.name}`}
							</FeaturedBadge>
						)}
					</Box>

					<FeaturedToggleButton
						isFeatured={review.isFeatured}
						toggling={toggling}
						onToggle={onToggle}
					/>
				</Box>
			</CardContent>
		</Card>
	);
}

function CommunityReviewCard({
	article,
	toggling,
	onToggle,
}: {
	article: CommunityReviewArticle;
	toggling: boolean;
	onToggle: () => void;
}) {
	const cfg = SOURCE_CONFIG.COMMUNITY;

	return (
		<Card
			sx={{
				borderLeft: `4px solid ${cfg.color}`,
				opacity: toggling ? 0.7 : 1,
				transition: 'opacity 0.2s',
			}}
		>
			<CardContent sx={CARD_CONTENT_SX}>
				<Box className="flex items-start justify-between gap-3">
					<Box className="flex-1 min-w-0">
						<Box className="flex items-center gap-2 mb-1.5 flex-wrap">
							{article.title && (
								<Typography variant="subtitle2" fontWeight={600} noWrap>
									{article.title}
								</Typography>
							)}
							<SourceChip source="COMMUNITY" />
						</Box>

						<Typography
							variant="body2"
							color="text.primary"
							sx={{
								mb: 1.5,
								lineHeight: 1.6,
								display: '-webkit-box',
								WebkitLineClamp: 3,
								WebkitBoxOrient: 'vertical',
								overflow: 'hidden',
							}}
						>
							{article.body}
						</Typography>

						<Box className="flex items-center gap-2 flex-wrap">
							<Typography variant="caption" color="text.secondary">
								{article.author?.nickname ?? '익명'}
							</Typography>
							{article.author?.university && (
								<>
									<Typography variant="caption" color="text.disabled">·</Typography>
									<Typography variant="caption" color="text.secondary">
										{article.author.university.name}
									</Typography>
								</>
							)}
							<Typography variant="caption" color="text.disabled">·</Typography>
							<Typography variant="caption" color="text.secondary">
								{formatSimpleDate(article.createdAt)}
							</Typography>
						</Box>

						{article.isFeatured && article.featuredAt && (
							<FeaturedBadge>
								공개일: {formatSimpleDate(article.featuredAt)}
							</FeaturedBadge>
						)}
					</Box>

					<FeaturedToggleButton
						isFeatured={article.isFeatured}
						toggling={toggling}
						onToggle={onToggle}
					/>
				</Box>
			</CardContent>
		</Card>
	);
}

function PublicReviewCard({ review }: { review: PublicReviewItem }) {
	const cfg = SOURCE_CONFIG[review.source];

	return (
		<Card sx={{ borderLeft: `4px solid ${cfg?.color ?? '#9ca3af'}` }}>
			<CardContent sx={CARD_CONTENT_SX}>
				<Box className="flex items-start justify-between gap-3">
					<Box className="flex-1 min-w-0">
						<Box className="flex items-center gap-2 mb-1.5 flex-wrap">
							{review.rating != null && (
								<Rating
									value={review.rating}
									readOnly
									size="small"
									sx={{
										'& .MuiRating-iconFilled': {
											color: RATING_COLORS[review.rating] ?? '#eab308',
										},
									}}
								/>
							)}
							{review.title && (
								<Typography variant="subtitle2" fontWeight={600} noWrap>
									{review.title}
								</Typography>
							)}
							<SourceChip source={review.source} />
						</Box>

						<Typography
							variant="body2"
							color="text.primary"
							sx={{
								mb: 1.5,
								lineHeight: 1.6,
								display: '-webkit-box',
								WebkitLineClamp: 3,
								WebkitBoxOrient: 'vertical',
								overflow: 'hidden',
							}}
						>
							{review.body}
						</Typography>

						<Box className="flex items-center gap-2 flex-wrap">
							<Typography variant="caption" color="text.secondary">
								{review.author?.nickname ?? '익명'}
							</Typography>
							{review.author?.university && (
								<>
									<Typography variant="caption" color="text.disabled">·</Typography>
									<Typography variant="caption" color="text.secondary">
										{review.author.university.name}
									</Typography>
								</>
							)}
							<Typography variant="caption" color="text.disabled">·</Typography>
							<Typography variant="caption" color="text.secondary">
								{formatSimpleDate(review.createdAt)}
							</Typography>
						</Box>

						<FeaturedBadge>
							공개일: {formatSimpleDate(review.featuredAt)}
						</FeaturedBadge>
					</Box>

					<Chip
						label="공개 중"
						icon={<PublicIcon />}
						size="small"
						color="success"
						sx={{ fontWeight: 600, flexShrink: 0 }}
					/>
				</Box>
			</CardContent>
		</Card>
	);
}
