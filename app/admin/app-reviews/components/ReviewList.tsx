'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
	Box,
	Card,
	CardContent,
	Typography,
	ToggleButton,
	ToggleButtonGroup,
	Chip,
	Button,
	CircularProgress,
	Alert,
	Skeleton,
	Rating,
	FormControl,
	InputLabel,
	Select,
	MenuItem,
	TextField,
} from '@mui/material';
import AppleIcon from '@mui/icons-material/Apple';
import ShopIcon from '@mui/icons-material/Shop';
import PhoneAndroidIcon from '@mui/icons-material/PhoneAndroid';
import FilterListIcon from '@mui/icons-material/FilterList';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import StarIcon from '@mui/icons-material/Star';
import AdminService, {
	type AppReviewItem,
	type AppReviewsParams,
} from '@/app/services/admin';

interface ReviewListProps {
	initialFilter?: { rating?: number; store?: 'APP_STORE' | 'PLAY_STORE' } | null;
	onFilterClear?: () => void;
}

const STORE_LABELS: Record<string, string> = {
	APP_STORE: 'App Store',
	PLAY_STORE: 'Play Store',
};

const RATING_COLORS: Record<number, string> = {
	1: '#ef4444',
	2: '#f97316',
	3: '#eab308',
	4: '#84cc16',
	5: '#22c55e',
};

export default function ReviewList({ initialFilter, onFilterClear }: ReviewListProps) {
	const [reviews, setReviews] = useState<AppReviewItem[]>([]);
	const [loading, setLoading] = useState(true);
	const [loadingMore, setLoadingMore] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [nextCursor, setNextCursor] = useState<string | null>(null);

	// 필터 상태
	const [store, setStore] = useState<'APP_STORE' | 'PLAY_STORE' | 'ALL'>(
		initialFilter?.store || 'ALL',
	);
	const [rating, setRating] = useState<number | 0>(initialFilter?.rating || 0);
	const [startDate, setStartDate] = useState('');
	const [endDate, setEndDate] = useState('');

	const isInitialMount = useRef(true);

	// initialFilter가 변경되면 필터 적용
	useEffect(() => {
		if (initialFilter) {
			if (initialFilter.store) setStore(initialFilter.store);
			if (initialFilter.rating) setRating(initialFilter.rating);
		}
	}, [initialFilter]);

	const buildParams = useCallback((): AppReviewsParams => {
		const params: AppReviewsParams = { limit: 20 };
		if (store !== 'ALL') params.store = store;
		if (rating > 0) params.rating = rating;
		if (startDate) params.startDate = startDate;
		if (endDate) params.endDate = endDate;
		return params;
	}, [store, rating, startDate, endDate]);

	const fetchReviews = useCallback(
		async (isLoadMore = false) => {
			try {
				if (isLoadMore) {
					setLoadingMore(true);
				} else {
					setLoading(true);
				}
				setError(null);

				const params = buildParams();
				if (isLoadMore && nextCursor) {
					params.cursor = nextCursor;
				}

				const data = await AdminService.appReviews.getList(params);

				if (isLoadMore) {
					setReviews((prev) => [...prev, ...data.items]);
				} else {
					setReviews(data.items);
				}
				setNextCursor(data.nextCursor);
			} catch (err: any) {
				setError(err.message || '리뷰를 불러오는데 실패했습니다.');
			} finally {
				setLoading(false);
				setLoadingMore(false);
			}
		},
		[buildParams, nextCursor],
	);

	// 필터 변경 시 재조회
	useEffect(() => {
		if (isInitialMount.current) {
			isInitialMount.current = false;
			fetchReviews();
			return;
		}
		fetchReviews();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [store, rating, startDate, endDate]);

	const handleClearAllFilters = () => {
		setStore('ALL');
		setRating(0);
		setStartDate('');
		setEndDate('');
		onFilterClear?.();
	};

	const activeFilterCount =
		(store !== 'ALL' ? 1 : 0) +
		(rating > 0 ? 1 : 0) +
		(startDate ? 1 : 0) +
		(endDate ? 1 : 0);

	const formatDate = (dateStr: string) => {
		return new Date(dateStr).toLocaleDateString('ko-KR', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
		});
	};

	return (
		<Box className="space-y-4">
			{/* 필터 바 */}
			<Card>
				<CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
					<Box className="flex items-center gap-2 mb-3">
						<FilterListIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
						<Typography variant="subtitle2" color="text.secondary">
							필터
						</Typography>
						{activeFilterCount > 0 && (
							<Chip
								label={`${activeFilterCount}개 활성`}
								size="small"
								color="primary"
								sx={{ height: 22 }}
							/>
						)}
					</Box>
					<Box className="flex flex-wrap items-center gap-3">
						{/* 스토어 토글 */}
						<ToggleButtonGroup
							value={store}
							exclusive
							onChange={(_, val) => val && setStore(val)}
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
						</ToggleButtonGroup>

						{/* 별점 필터 */}
						<FormControl size="small" sx={{ minWidth: 120 }}>
							<InputLabel>별점</InputLabel>
							<Select
								value={rating}
								label="별점"
								onChange={(e) => setRating(Number(e.target.value))}
							>
								<MenuItem value={0}>전체</MenuItem>
								{[5, 4, 3, 2, 1].map((r) => (
									<MenuItem key={r} value={r}>
										<Box className="flex items-center gap-1">
											{'★'.repeat(r)}
											<Typography variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>
												({r}점)
											</Typography>
										</Box>
									</MenuItem>
								))}
							</Select>
						</FormControl>

						{/* 날짜 범위 */}
						<TextField
							size="small"
							type="date"
							label="시작일"
							value={startDate}
							onChange={(e) => setStartDate(e.target.value)}
							InputLabelProps={{ shrink: true }}
							sx={{ width: 160 }}
						/>
						<Typography variant="body2" color="text.secondary">
							~
						</Typography>
						<TextField
							size="small"
							type="date"
							label="종료일"
							value={endDate}
							onChange={(e) => setEndDate(e.target.value)}
							InputLabelProps={{ shrink: true }}
							sx={{ width: 160 }}
						/>

						{activeFilterCount > 0 && (
							<Button
								size="small"
								variant="text"
								color="inherit"
								onClick={handleClearAllFilters}
								sx={{ ml: 'auto' }}
							>
								필터 초기화
							</Button>
						)}
					</Box>

					{/* 활성 필터 Chip */}
					{activeFilterCount > 0 && (
						<Box className="flex flex-wrap gap-1 mt-2">
							{store !== 'ALL' && (
								<Chip
									label={STORE_LABELS[store]}
									size="small"
									onDelete={() => setStore('ALL')}
									icon={store === 'APP_STORE' ? <AppleIcon /> : <ShopIcon />}
								/>
							)}
							{rating > 0 && (
								<Chip
									label={`${'★'.repeat(rating)} (${rating}점)`}
									size="small"
									onDelete={() => setRating(0)}
									icon={<StarIcon sx={{ color: RATING_COLORS[rating] }} />}
								/>
							)}
							{startDate && (
								<Chip
									label={`시작: ${startDate}`}
									size="small"
									onDelete={() => setStartDate('')}
								/>
							)}
							{endDate && (
								<Chip
									label={`종료: ${endDate}`}
									size="small"
									onDelete={() => setEndDate('')}
								/>
							)}
						</Box>
					)}
				</CardContent>
			</Card>

			{/* 에러 */}
			{error && (
				<Alert severity="error" sx={{ mb: 2 }}>
					{error}
				</Alert>
			)}

			{/* 리뷰 카드 목록 */}
			{loading ? (
				<Box className="space-y-3">
					{Array.from({ length: 5 }).map((_, i) => (
						<Skeleton key={i} variant="rectangular" height={120} sx={{ borderRadius: 2 }} />
					))}
				</Box>
			) : reviews.length === 0 ? (
				<Card>
					<CardContent>
						<Box className="text-center py-12">
							<Typography variant="h6" color="text.secondary">
								리뷰가 없습니다
							</Typography>
							<Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
								필터 조건을 변경해보세요
							</Typography>
						</Box>
					</CardContent>
				</Card>
			) : (
				<Box className="space-y-3">
					{reviews.map((review) => (
						<ReviewCard key={review.pk} review={review} />
					))}
				</Box>
			)}

			{/* 더 보기 버튼 */}
			{nextCursor && !loading && (
				<Box className="flex justify-center pt-2 pb-4">
					<Button
						variant="outlined"
						onClick={() => fetchReviews(true)}
						disabled={loadingMore}
						startIcon={loadingMore ? <CircularProgress size={18} /> : <ExpandMoreIcon />}
						sx={{
							px: 4,
							py: 1,
							borderRadius: 3,
							textTransform: 'none',
						}}
					>
						{loadingMore ? '불러오는 중...' : '더 보기'}
					</Button>
				</Box>
			)}
		</Box>
	);
}

// ─── 리뷰 카드 컴포넌트 ─────────────────────────────────
function ReviewCard({ review }: { review: AppReviewItem }) {
	const isAppStore = review.store === 'APP_STORE';
	const storeColor = isAppStore ? '#007AFF' : '#34A853';

	return (
		<Card
			sx={{
				borderLeft: `4px solid ${storeColor}`,
				'&:hover': {
					boxShadow: 3,
					transform: 'translateY(-1px)',
					transition: 'all 0.15s ease',
				},
			}}
		>
			<CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
				{/* 상단: 별점 + 스토어 배지 */}
				<Box className="flex items-center justify-between mb-1.5">
					<Box className="flex items-center gap-2">
						<Rating
							value={review.rating}
							readOnly
							size="small"
							sx={{
								'& .MuiRating-iconFilled': {
									color: RATING_COLORS[review.rating] || '#eab308',
								},
							}}
						/>
						{review.title && (
							<Typography variant="subtitle2" fontWeight={600}>
								{review.title}
							</Typography>
						)}
					</Box>
					<Chip
						label={isAppStore ? 'App Store' : 'Play Store'}
						size="small"
						icon={isAppStore ? <AppleIcon /> : <ShopIcon />}
						sx={{
							backgroundColor: isAppStore ? '#f0f4ff' : '#f0fdf4',
							color: storeColor,
							fontWeight: 500,
							'& .MuiChip-icon': { color: storeColor },
						}}
					/>
				</Box>

				{/* 본문 */}
				{review.body && (
					<Typography
						variant="body2"
						color="text.primary"
						sx={{
							mb: 1.5,
							lineHeight: 1.6,
							whiteSpace: 'pre-wrap',
						}}
					>
						{review.body}
					</Typography>
				)}

				{/* 메타 정보 */}
				<Box className="flex items-center gap-3 flex-wrap">
					<Typography variant="caption" color="text.secondary">
						{review.author}
					</Typography>
					<Typography variant="caption" color="text.disabled">
						|
					</Typography>
					<Typography variant="caption" color="text.secondary">
						v{review.appVersion}
					</Typography>
					<Typography variant="caption" color="text.disabled">
						|
					</Typography>
					<Typography variant="caption" color="text.secondary">
						{new Date(review.createdAt).toLocaleDateString('ko-KR', {
							year: 'numeric',
							month: 'short',
							day: 'numeric',
						})}
					</Typography>
					{review.language && review.language !== 'ko' && (
						<>
							<Typography variant="caption" color="text.disabled">
								|
							</Typography>
							<Chip
								label={review.language.toUpperCase()}
								size="small"
								variant="outlined"
								sx={{ height: 20, fontSize: '0.65rem' }}
							/>
						</>
					)}
				</Box>
			</CardContent>
		</Card>
	);
}
