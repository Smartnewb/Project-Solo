'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import {
	Box,
	Card,
	CardContent,
	Typography,
	Chip,
	Alert,
	Skeleton,
	Rating,
	ToggleButton,
	ToggleButtonGroup,
} from '@mui/material';
import AppleIcon from '@mui/icons-material/Apple';
import ShopIcon from '@mui/icons-material/Shop';
import ForumIcon from '@mui/icons-material/Forum';
import WhatshotIcon from '@mui/icons-material/Whatshot';
import PhoneAndroidIcon from '@mui/icons-material/PhoneAndroid';
import PublicIcon from '@mui/icons-material/Public';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { SvgIconComponent } from '@mui/icons-material';
import AdminService, {
	type PublicReviewItem,
	type PublicReviewSource,
} from '@/app/services/admin';
import { RATING_COLORS } from './ReviewList';
import { formatSimpleDate } from '@/app/utils/formatters';

type PublicSourceFilter = 'ALL' | 'app' | 'community' | 'inapp' | 'hot' | 'review';

const SOURCE_CONFIG: Record<
	'APP_STORE' | 'PLAY_STORE' | 'COMMUNITY' | 'HOT',
	{ label: string; color: string; bg: string; Icon: SvgIconComponent }
> = {
	APP_STORE: { label: 'App Store', color: '#007AFF', bg: '#f0f4ff', Icon: AppleIcon },
	PLAY_STORE: { label: 'Play Store', color: '#34A853', bg: '#f0fdf4', Icon: ShopIcon },
	COMMUNITY: { label: '커뮤니티', color: '#8b5cf6', bg: '#f5f3ff', Icon: ForumIcon },
	HOT: { label: '인기 게시글', color: '#ef4444', bg: '#fef2f2', Icon: WhatshotIcon },
};

export default function PublicReviewManagement() {
	const [reviews, setReviews] = useState<PublicReviewItem[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [sourceFilter, setSourceFilter] = useState<PublicSourceFilter>('ALL');

	const fetchPublicReviews = useCallback(async (type?: string) => {
		try {
			setLoading(true);
			setError(null);
			const res = await AdminService.publicReviews.getList({
				type: type as any,
				limit: 100,
			});
			setReviews(res?.items ?? []);
		} catch (err: any) {
			setError(err.message || '공개 리뷰를 불러오는데 실패했습니다.');
			setReviews([]);
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		fetchPublicReviews(sourceFilter === 'ALL' ? undefined : sourceFilter);
	}, [fetchPublicReviews, sourceFilter]);

	const sourceCounts = useMemo(
		() =>
			(reviews ?? []).reduce<Partial<Record<PublicReviewSource, number>>>((acc, r) => {
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
			{/* 공개 현황 요약 */}
			{!loading && (
				<Box className="flex gap-3 flex-wrap">
					<SummaryBadge
						label="전체 공개 리뷰"
						count={reviews.length}
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
									color={cfg.color}
								/>
							) : null;
						},
					)}
				</Box>
			)}

			{/* 필터 */}
			<Card>
				<CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
					<Box className="flex items-center gap-3 flex-wrap">
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

			{/* 리뷰 목록 */}
			{loading ? (
				<Box className="space-y-3">
					{Array.from({ length: 6 }).map((_, i) => (
						<Skeleton key={i} variant="rectangular" height={130} sx={{ borderRadius: 2 }} />
					))}
				</Box>
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

// ─── 공개 현황 배지 ───────────────────────────────────
function SummaryBadge({
	label,
	count,
	color,
}: {
	label: string;
	count: number;
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
					{count}건
				</Typography>
			</Box>
		</Box>
	);
}

// ─── 공개 리뷰 카드 ──────────────────────────────────
function PublicReviewCard({ review }: { review: PublicReviewItem }) {
	const cfg = SOURCE_CONFIG[review.source];
	const Icon = cfg?.Icon;

	return (
		<Card sx={{ borderLeft: `4px solid ${cfg?.color ?? '#9ca3af'}` }}>
			<CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
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
							{cfg && Icon && (
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
							)}
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
								공개일: {formatSimpleDate(review.featuredAt)}
							</Typography>
						</Box>
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
