'use client';

import { useEffect, useMemo, useState } from 'react';
import {
	Avatar,
	Box,
	Button,
	Chip,
	CircularProgress,
	Divider,
	FormControl,
	IconButton,
	InputLabel,
	MenuItem,
	Paper,
	Select,
	Stack,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	TextField,
	Tooltip,
	Typography,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material/Select';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import RefreshIcon from '@mui/icons-material/Refresh';
import TodayIcon from '@mui/icons-material/Today';
import {
	Bar,
	BarChart,
	CartesianGrid,
	Legend,
	ResponsiveContainer,
	Tooltip as RechartsTooltip,
	XAxis,
	YAxis,
} from 'recharts';
import type {
	CampaignCalendarAssignment,
	CampaignCalendarDay,
	EngagementCacheMode,
	EngagementFlowDailyResponse,
	EngagementFlowResponse,
	EngagementSegment,
	IncentiveCampaignCountry,
} from '@/app/services/admin/incentive-campaign';
import {
	useIncentiveCampaignCalendar,
	useIncentiveCampaignEngagementFlow,
	useIncentiveCampaignEngagementFlowDaily,
} from '@/app/admin/hooks';
import { getAdminErrorMessage } from '@/shared/lib/http/admin-fetch';

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

const COUNTRY_OPTIONS: Array<{ value: IncentiveCampaignCountry; label: string }> = [
	{ value: 'kr', label: 'KR' },
	{ value: 'jp', label: 'JP' },
	{ value: 'all', label: '전체' },
];

const SEGMENT_OPTIONS: Array<{ value: EngagementSegment; label: string }> = [
	{ value: 'all', label: '전체' },
	{ value: 'campaign_assigned_female', label: '캠페인 배정 여성' },
	{ value: 'campaign_participated_female', label: '캠페인 참여 여성' },
	{ value: 'non_campaign_female', label: '비캠페인 여성' },
	{ value: 'male_received_campaign_like', label: '캠페인 좋아요 받은 남성' },
	{ value: 'male_not_received_campaign_like', label: '캠페인 좋아요 미수신 남성' },
];

function toDateKey(date: Date): string {
	const y = date.getFullYear();
	const m = String(date.getMonth() + 1).padStart(2, '0');
	const d = String(date.getDate()).padStart(2, '0');
	return `${y}-${m}-${d}`;
}

function parseDateKey(value: string): Date {
	const [year, month, day] = value.split('-').map(Number);
	return new Date(year, month - 1, day);
}

function startOfMonth(date: Date): Date {
	return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfMonth(date: Date): Date {
	return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

function addDays(date: Date, amount: number): Date {
	const next = new Date(date);
	next.setDate(next.getDate() + amount);
	return next;
}

function buildCalendarGrid(month: Date): Date[] {
	const first = startOfMonth(month);
	const last = endOfMonth(month);
	const gridStart = addDays(first, -first.getDay());
	const gridEnd = addDays(last, 6 - last.getDay());
	const days: Date[] = [];

	for (let cursor = gridStart; cursor <= gridEnd; cursor = addDays(cursor, 1)) {
		days.push(cursor);
	}

	return days;
}

function formatMonthLabel(date: Date): string {
	return `${date.getFullYear()}년 ${date.getMonth() + 1}월`;
}

function formatDateTime(value: string | null): string {
	if (!value) return '-';
	return new Intl.DateTimeFormat('ko-KR', {
		month: '2-digit',
		day: '2-digit',
		hour: '2-digit',
		minute: '2-digit',
	}).format(new Date(value));
}

function formatGeneratedAt(value: string | null | undefined): string {
	if (!value) return '-';
	return new Intl.DateTimeFormat('ko-KR', {
		month: '2-digit',
		day: '2-digit',
		hour: '2-digit',
		minute: '2-digit',
		second: '2-digit',
	}).format(new Date(value));
}

function formatNumber(value: number | null | undefined): string {
	return Number(value ?? 0).toLocaleString();
}

function formatRate(value: number | null | undefined): string {
	if (value == null || Number.isNaN(value)) return '-';
	const percent = Math.abs(value) <= 1 ? value * 100 : value;
	return `${percent.toFixed(1)}%`;
}

function maskPhone(phone: string | null): string {
	if (!phone) return '-';
	return phone.replace(/(\d{3})\d+(\d{4})/, '$1****$2');
}

function shortId(id: string | null): string {
	if (!id) return '-';
	return id.length <= 12 ? id : `${id.slice(0, 8)}...${id.slice(-4)}`;
}

function summarizeMonth(days: CampaignCalendarDay[]) {
	return days.reduce(
		(acc, day) => {
			acc.assignments += day.totalAssignments;
			acc.likes += day.totalLikesSent;
			acc.assignedFemales += day.uniqueFemalesAssigned;
			acc.participatedFemales += day.uniqueFemalesParticipated;
			return acc;
		},
		{ assignments: 0, likes: 0, assignedFemales: 0, participatedFemales: 0 },
	);
}

function buildBucketChartData(data?: EngagementFlowResponse | null) {
	return (data?.buckets ?? []).map((bucket) => ({
		label: bucket.label,
		'캠페인 좋아요': bucket.likes.campaign,
		'상호좋아요': bucket.mutualLikes.total,
		'캠페인 기여 상호좋아요': bucket.mutualLikes.fromCampaignLike,
		'매칭': bucket.matches.total,
		'정기배치 매칭': bucket.matches.scheduledBatch,
		'재매칭': bucket.matches.rematching,
		'프로필 조회': bucket.profileViews.total,
	}));
}

function buildDailyBucketChartData(data?: EngagementFlowDailyResponse | null) {
	return (data?.buckets ?? []).map((bucket) => ({
		label: bucket.label,
		'캠페인 좋아요': bucket.campaignLikes,
		'상호좋아요': bucket.mutualLikes.total,
		'정기배치 매칭': bucket.matches.scheduledBatch,
		'재매칭': bucket.matches.rematching,
		'여성→남성 조회': bucket.profileViews.femaleToMale,
		'남성→여성 조회': bucket.profileViews.maleToFemale,
	}));
}

function buildInsights(data?: EngagementFlowResponse | null): string[] {
	if (!data) return [];
	const { summary, buckets } = data;
	const insights: string[] = [];
	const topCampaignBucket = [...buckets].sort((a, b) => b.likes.campaign - a.likes.campaign)[0];
	const topMatchBucket = [...buckets].sort((a, b) => b.matches.total - a.matches.total)[0];

	if (summary.campaign.assignments > 0) {
		insights.push(`배정 대비 캠페인 좋아요 전환은 ${formatRate(summary.campaign.assignmentToCampaignLikeRate)}입니다.`);
	}
	if (summary.likes.campaign > 0) {
		insights.push(`캠페인 좋아요 중 상호좋아요로 이어진 비율은 ${formatRate(summary.conversion.campaignLikeToMutualRate)}입니다.`);
	}
	if (topCampaignBucket) {
		insights.push(`캠페인 좋아요가 가장 많은 시간대는 ${topCampaignBucket.label}입니다.`);
	}
	if (topMatchBucket) {
		insights.push(`매칭이 가장 많이 발생한 시간대는 ${topMatchBucket.label}입니다.`);
	}

	return insights.slice(0, 4);
}

function AssignmentRows({ assignments }: { assignments: CampaignCalendarAssignment[] }) {
	return (
		<Table size="small">
			<TableHead>
				<TableRow>
					<TableCell>남성 프로필</TableCell>
					<TableCell>학교/학과</TableCell>
					<TableCell>상태</TableCell>
					<TableCell>좋아요 시각</TableCell>
					<TableCell>좋아요 ID</TableCell>
				</TableRow>
			</TableHead>
			<TableBody>
				{assignments.map((assignment) => (
					<TableRow key={assignment.id} hover>
						<TableCell>
							<Stack direction="row" spacing={1.5} alignItems="center">
								<Avatar
									src={assignment.maleProfile.profileImageUrl ?? undefined}
									alt={assignment.maleProfile.name}
									sx={{ width: 44, height: 44 }}
								/>
								<Box>
									<Typography variant="body2" fontWeight={700}>
										{assignment.maleProfile.name} ({assignment.maleProfile.age})
									</Typography>
									<Typography variant="caption" color="text.secondary">
										{assignment.maleProfile.rank ?? 'rank 없음'} · {shortId(assignment.maleProfile.userId)}
									</Typography>
								</Box>
							</Stack>
						</TableCell>
						<TableCell>
							<Typography variant="body2">
								{assignment.maleProfile.universityName ?? '-'}
							</Typography>
							<Typography variant="caption" color="text.secondary">
								{assignment.maleProfile.departmentName ?? '-'}
							</Typography>
						</TableCell>
						<TableCell>
							<Chip
								size="small"
								color={assignment.isLiked ? 'success' : 'default'}
								label={assignment.isLiked ? '발송 완료' : '미발송'}
							/>
						</TableCell>
						<TableCell>{formatDateTime(assignment.likedAt)}</TableCell>
						<TableCell>
							<Tooltip title={assignment.matchLikeId ?? ''}>
								<span>{shortId(assignment.matchLikeId)}</span>
							</Tooltip>
						</TableCell>
					</TableRow>
				))}
			</TableBody>
		</Table>
	);
}

function MetricCard({
	label,
	value,
	helper,
	color = 'text.primary',
}: {
	label: string;
	value: string;
	helper?: string;
	color?: string;
}) {
	return (
		<Paper sx={{ p: 2, flex: 1, minWidth: 180 }}>
			<Typography variant="body2" color="text.secondary">
				{label}
			</Typography>
			<Typography variant="h5" fontWeight={800} color={color}>
				{value}
			</Typography>
			{helper ? (
				<Typography variant="caption" color="text.secondary">
					{helper}
				</Typography>
			) : null}
		</Paper>
	);
}

export default function IncentiveCampaignClient() {
	const today = useMemo(() => new Date(), []);
	const [startDate, setStartDate] = useState(() => toDateKey(startOfMonth(today)));
	const [endDate, setEndDate] = useState(() => toDateKey(endOfMonth(today)));
	const [month, setMonth] = useState(() => startOfMonth(today));
	const [selectedDate, setSelectedDate] = useState(() => toDateKey(today));
	const [country, setCountry] = useState<IncentiveCampaignCountry>('kr');
	const [segment, setSegment] = useState<EngagementSegment>('all');
	const [cacheMode, setCacheMode] = useState<EngagementCacheMode>('auto');

	const flowQueryParams = useMemo(
		() => ({
			startDate,
			endDate,
			country,
			timezone: 'Asia/Seoul' as const,
			segment,
			cache: cacheMode,
		}),
		[startDate, endDate, country, segment, cacheMode],
	);
	const dailyQueryParams = useMemo(
		() => ({
			date: selectedDate,
			country,
			timezone: 'Asia/Seoul' as const,
			segment,
			cache: cacheMode,
		}),
		[selectedDate, country, segment, cacheMode],
	);

	const calendarQuery = useIncentiveCampaignCalendar(
		toDateKey(startOfMonth(month)),
		toDateKey(endOfMonth(month)),
		country,
		selectedDate,
	);
	const flowQuery = useIncentiveCampaignEngagementFlow(flowQueryParams);
	const dailyQuery = useIncentiveCampaignEngagementFlowDaily(dailyQueryParams);

	useEffect(() => {
		if (cacheMode === 'refresh' && !flowQuery.isFetching && !dailyQuery.isFetching) {
			setCacheMode('auto');
		}
	}, [cacheMode, dailyQuery.isFetching, flowQuery.isFetching]);

	const daysByDate = useMemo(() => {
		const map = new Map<string, CampaignCalendarDay>();
		for (const day of calendarQuery.data?.days ?? []) map.set(day.date, day);
		return map;
	}, [calendarQuery.data?.days]);

	const dailySummaryByDate = useMemo(() => {
		if (!dailyQuery.data) return null;
		return {
			date: dailyQuery.data.date,
			campaignLikes: dailyQuery.data.summary.campaignLikes,
			mutualLikes: dailyQuery.data.summary.mutualLikes,
			matches: dailyQuery.data.summary.matches,
		};
	}, [dailyQuery.data]);

	const calendarDays = useMemo(() => buildCalendarGrid(month), [month]);
	const monthSummary = summarizeMonth(calendarQuery.data?.days ?? []);
	const selectedDay = daysByDate.get(selectedDate);
	const bucketChartData = buildBucketChartData(flowQuery.data);
	const dailyBucketChartData = buildDailyBucketChartData(dailyQuery.data);
	const insights = buildInsights(flowQuery.data);

	const moveMonth = (amount: number) => {
		const next = new Date(month.getFullYear(), month.getMonth() + amount, 1);
		setMonth(next);
		setSelectedDate(toDateKey(next));
	};

	const goToday = () => {
		const now = new Date();
		const key = toDateKey(now);
		setMonth(startOfMonth(now));
		setSelectedDate(key);
		setStartDate(toDateKey(startOfMonth(now)));
		setEndDate(toDateKey(endOfMonth(now)));
	};

	const handleStartDateChange = (value: string) => {
		setStartDate(value);
		if (value) {
			const nextMonth = startOfMonth(parseDateKey(value));
			setMonth(nextMonth);
			setSelectedDate(value);
		}
	};

	const handleCountryChange = (event: SelectChangeEvent) => {
		setCountry(event.target.value as IncentiveCampaignCountry);
	};

	const handleSegmentChange = (event: SelectChangeEvent) => {
		setSegment(event.target.value as EngagementSegment);
	};

	const refreshData = () => {
		setCacheMode('refresh');
	};

	return (
		<Box>
			<Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
				<Box>
					<Typography variant="h5" fontWeight={800}>
						인센티브 캠페인 성과 흐름
					</Typography>
					<Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
						배정 이후 좋아요, 상호좋아요, 프로필 조회, 시간대별 매칭 전환을 확인합니다.
					</Typography>
				</Box>
				<Stack direction="row" spacing={1}>
					<Tooltip title="오늘">
						<IconButton onClick={goToday}>
							<TodayIcon />
						</IconButton>
					</Tooltip>
					<Tooltip title="캐시 새로 계산">
						<span>
							<IconButton onClick={refreshData} disabled={flowQuery.isFetching || dailyQuery.isFetching}>
								<RefreshIcon />
							</IconButton>
						</span>
					</Tooltip>
				</Stack>
			</Box>

			<Paper sx={{ p: 2, mb: 3 }}>
				<Stack direction={{ xs: 'column', lg: 'row' }} spacing={2} alignItems={{ xs: 'stretch', lg: 'center' }}>
					<TextField
						label="시작일"
						type="date"
						size="small"
						value={startDate}
						onChange={(event) => handleStartDateChange(event.target.value)}
						InputLabelProps={{ shrink: true }}
					/>
					<TextField
						label="종료일"
						type="date"
						size="small"
						value={endDate}
						onChange={(event) => setEndDate(event.target.value)}
						InputLabelProps={{ shrink: true }}
					/>
					<FormControl size="small" sx={{ minWidth: 120 }}>
						<InputLabel id="incentive-country-label">국가</InputLabel>
						<Select labelId="incentive-country-label" label="국가" value={country} onChange={handleCountryChange}>
							{COUNTRY_OPTIONS.map((option) => (
								<MenuItem key={option.value} value={option.value}>
									{option.label}
								</MenuItem>
							))}
						</Select>
					</FormControl>
					<FormControl size="small" sx={{ minWidth: 260 }}>
						<InputLabel id="incentive-segment-label">세그먼트</InputLabel>
						<Select labelId="incentive-segment-label" label="세그먼트" value={segment} onChange={handleSegmentChange}>
							{SEGMENT_OPTIONS.map((option) => (
								<MenuItem key={option.value} value={option.value}>
									{option.label}
								</MenuItem>
							))}
						</Select>
					</FormControl>
					<Button
						variant="outlined"
						startIcon={<RefreshIcon />}
						onClick={refreshData}
						disabled={flowQuery.isFetching || dailyQuery.isFetching}
					>
						새로고침
					</Button>
					<Box sx={{ flex: 1 }} />
					<Chip
						size="small"
						color={flowQuery.data?.cache.hit ? 'success' : 'default'}
						label={`캐시 ${flowQuery.data?.cache.hit ? '사용' : '계산'} · ${formatGeneratedAt(flowQuery.data?.cache.generatedAt)}`}
					/>
				</Stack>
			</Paper>

			{flowQuery.error ? (
				<Paper sx={{ p: 2, mb: 3, color: 'error.main' }}>
					{getAdminErrorMessage(flowQuery.error, '성과 흐름을 불러오지 못했습니다.')}
				</Paper>
			) : null}

			<Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 3 }}>
				<MetricCard
					label="배정"
					value={formatNumber(flowQuery.data?.summary.campaign.assignments)}
					helper={`참여 여성 ${formatNumber(flowQuery.data?.summary.campaign.participatingFemales)}명`}
				/>
				<MetricCard
					label="캠페인 좋아요"
					value={formatNumber(flowQuery.data?.summary.campaign.campaignLikes)}
					helper={`배정→좋아요 ${formatRate(flowQuery.data?.summary.campaign.assignmentToCampaignLikeRate)}`}
					color="primary.main"
				/>
				<MetricCard
					label="상호좋아요"
					value={formatNumber(flowQuery.data?.summary.mutualLikes.total)}
					helper={`캠페인 기여 ${formatNumber(flowQuery.data?.summary.mutualLikes.fromCampaignLike)}`}
					color="success.main"
				/>
				<MetricCard
					label="매칭"
					value={formatNumber(flowQuery.data?.summary.matches.total)}
					helper={`좋아요→매칭 ${formatRate(flowQuery.data?.summary.conversion.likeToMatchRate)}`}
					color="warning.main"
				/>
			</Stack>

			<Stack direction={{ xs: 'column', lg: 'row' }} spacing={2} sx={{ mb: 3 }}>
				<Paper sx={{ p: 2, flex: 2, minHeight: 360 }}>
					<Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
						<Box>
							<Typography variant="h6" fontWeight={800}>
								시간대별 좋아요·매칭 흐름
							</Typography>
							<Typography variant="body2" color="text.secondary">
								5개 시간 bucket 기준으로 캠페인 좋아요와 시간별 매칭을 함께 봅니다.
							</Typography>
						</Box>
						{flowQuery.isFetching ? <CircularProgress size={22} /> : null}
					</Stack>
					<Box sx={{ height: 280 }}>
						<ResponsiveContainer width="100%" height="100%">
							<BarChart data={bucketChartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
								<CartesianGrid strokeDasharray="3 3" />
								<XAxis dataKey="label" />
								<YAxis allowDecimals={false} />
								<RechartsTooltip />
								<Legend />
								<Bar dataKey="캠페인 좋아요" fill="#2563eb" />
								<Bar dataKey="상호좋아요" fill="#16a34a" />
								<Bar dataKey="매칭" fill="#f97316" />
							</BarChart>
						</ResponsiveContainer>
					</Box>
				</Paper>
				<Paper sx={{ p: 2, flex: 1 }}>
					<Typography variant="h6" fontWeight={800} sx={{ mb: 2 }}>
						운영 인사이트
					</Typography>
					<Stack spacing={1.2}>
						{insights.length > 0 ? (
							insights.map((insight) => (
								<Box key={insight} sx={{ p: 1.5, borderRadius: 1, bgcolor: 'grey.50' }}>
									<Typography variant="body2">{insight}</Typography>
								</Box>
							))
						) : (
							<Typography variant="body2" color="text.secondary">
								데이터를 불러오면 주요 흐름을 표시합니다.
							</Typography>
						)}
					</Stack>
				</Paper>
			</Stack>

			<Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 3 }}>
				<Paper sx={{ p: 2, flex: 1 }}>
					<Typography variant="subtitle1" fontWeight={800} sx={{ mb: 1 }}>
						좋아요
					</Typography>
					<Stack spacing={0.7}>
						<Typography variant="body2">전체 {formatNumber(flowQuery.data?.summary.likes.total)}</Typography>
						<Typography variant="body2">여성→남성 {formatNumber(flowQuery.data?.summary.likes.femaleToMale)}</Typography>
						<Typography variant="body2">남성→여성 {formatNumber(flowQuery.data?.summary.likes.maleToFemale)}</Typography>
						<Typography variant="body2">캠페인 {formatNumber(flowQuery.data?.summary.likes.campaign)} · 비캠페인 {formatNumber(flowQuery.data?.summary.likes.nonCampaign)}</Typography>
						<Typography variant="caption" color="text.secondary">
							발신자 {formatNumber(flowQuery.data?.summary.likes.uniqueSenders)}명 · 수신자 {formatNumber(flowQuery.data?.summary.likes.uniqueReceivers)}명
						</Typography>
					</Stack>
				</Paper>
				<Paper sx={{ p: 2, flex: 1 }}>
					<Typography variant="subtitle1" fontWeight={800} sx={{ mb: 1 }}>
						프로필 조회
					</Typography>
					<Stack spacing={0.7}>
						<Typography variant="body2">전체 {formatNumber(flowQuery.data?.summary.profileViews.total)}</Typography>
						<Typography variant="body2">여성→남성 {formatNumber(flowQuery.data?.summary.profileViews.femaleToMale)}</Typography>
						<Typography variant="body2">남성→여성 {formatNumber(flowQuery.data?.summary.profileViews.maleToFemale)}</Typography>
						<Typography variant="caption" color="text.secondary">
							조회자 {formatNumber(flowQuery.data?.summary.profileViews.uniqueViewers)}명 · 조회 대상 {formatNumber(flowQuery.data?.summary.profileViews.uniqueViewedUsers)}명
						</Typography>
					</Stack>
				</Paper>
				<Paper sx={{ p: 2, flex: 1 }}>
					<Typography variant="subtitle1" fontWeight={800} sx={{ mb: 1 }}>
						매칭 출처
					</Typography>
					<Stack spacing={0.7}>
						<Typography variant="body2">정기배치 {formatNumber(flowQuery.data?.summary.matches.scheduledBatch)}</Typography>
						<Typography variant="body2">재매칭 {formatNumber(flowQuery.data?.summary.matches.rematching)}</Typography>
						<Typography variant="body2">관리자 {formatNumber(flowQuery.data?.summary.matches.admin)} · 프로필뷰어 {formatNumber(flowQuery.data?.summary.matches.profileViewer)}</Typography>
						<Typography variant="caption" color="text.secondary">
							캠페인 여성 포함 {formatNumber(flowQuery.data?.summary.matches.withCampaignFemale)} · 캠페인 남성 포함 {formatNumber(flowQuery.data?.summary.matches.withCampaignMale)}
						</Typography>
					</Stack>
				</Paper>
				<Paper sx={{ p: 2, flex: 1 }}>
					<Typography variant="subtitle1" fontWeight={800} sx={{ mb: 1 }}>
						전환율
					</Typography>
					<Stack spacing={0.7}>
						<Typography variant="body2">캠페인 좋아요→상호좋아요 {formatRate(flowQuery.data?.summary.conversion.campaignLikeToMutualRate)}</Typography>
						<Typography variant="body2">프로필조회→좋아요 {formatRate(flowQuery.data?.summary.conversion.profileViewToLikeRate)}</Typography>
						<Typography variant="body2">프로필조회→매칭 {formatRate(flowQuery.data?.summary.conversion.profileViewToMatchRate)}</Typography>
						<Typography variant="body2">좋아요→매칭 {formatRate(flowQuery.data?.summary.conversion.likeToMatchRate)}</Typography>
					</Stack>
				</Paper>
			</Stack>

			<Paper sx={{ p: 2, mb: 3 }}>
				<Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
					<IconButton onClick={() => moveMonth(-1)}>
						<ChevronLeftIcon />
					</IconButton>
					<Box sx={{ textAlign: 'center' }}>
						<Typography variant="h6" fontWeight={800}>
							{formatMonthLabel(month)}
						</Typography>
						<Typography variant="caption" color="text.secondary">
							기존 배정 관제와 일자별 성과 상세
						</Typography>
					</Box>
					<IconButton onClick={() => moveMonth(1)}>
						<ChevronRightIcon />
					</IconButton>
				</Stack>

				<Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 2 }}>
					{[
						['월 배정', monthSummary.assignments],
						['월 좋아요 발송', monthSummary.likes],
						['일별 배정 여성 합', monthSummary.assignedFemales],
						['일별 참여 여성 합', monthSummary.participatedFemales],
					].map(([label, value]) => (
						<MetricCard key={label} label={String(label)} value={formatNumber(Number(value))} />
					))}
				</Stack>

				{calendarQuery.error ? (
					<Paper sx={{ p: 2, mb: 3, color: 'error.main' }}>
						{getAdminErrorMessage(calendarQuery.error, '캠페인 캘린더를 불러오지 못했습니다.')}
					</Paper>
				) : null}

				<Box
					sx={{
						display: 'grid',
						gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
						border: '1px solid',
						borderColor: 'divider',
						borderRadius: 1,
						overflow: 'hidden',
					}}
				>
					{WEEKDAYS.map((weekday) => (
						<Box key={weekday} sx={{ p: 1, bgcolor: 'grey.50', borderBottom: '1px solid', borderColor: 'divider' }}>
							<Typography variant="caption" fontWeight={700}>
								{weekday}
							</Typography>
						</Box>
					))}
					{calendarDays.map((date) => {
						const key = toDateKey(date);
						const day = daysByDate.get(key);
						const inMonth = date.getMonth() === month.getMonth();
						const selected = key === selectedDate;
						const dailyMetrics = dailySummaryByDate?.date === key ? dailySummaryByDate : null;
						return (
							<Box
								key={key}
								component="button"
								onClick={() => setSelectedDate(key)}
								sx={{
									minHeight: 132,
									p: 1,
									textAlign: 'left',
									border: 0,
									borderRight: '1px solid',
									borderBottom: '1px solid',
									borderColor: 'divider',
									bgcolor: selected ? 'primary.50' : 'background.paper',
									color: inMonth ? 'text.primary' : 'text.disabled',
									cursor: 'pointer',
									'&:hover': { bgcolor: selected ? 'primary.50' : 'grey.50' },
								}}
							>
								<Typography variant="body2" fontWeight={800}>
									{date.getDate()}
								</Typography>
								<Stack spacing={0.5} sx={{ mt: 1 }}>
									<Chip size="small" label={`배정 ${day?.totalAssignments ?? 0}`} />
									<Chip size="small" color={(day?.totalLikesSent ?? 0) > 0 ? 'success' : 'default'} label={`발송 ${day?.totalLikesSent ?? 0}`} />
									{dailyMetrics ? (
										<>
											<Typography variant="caption" color="text.secondary">
												상호 {dailyMetrics.mutualLikes} · 매칭 {dailyMetrics.matches}
											</Typography>
											<Typography variant="caption" color="text.secondary">
												캠페인 좋아요 {dailyMetrics.campaignLikes}
											</Typography>
										</>
									) : (
										<Typography variant="caption" color="text.secondary">
											여성 {day?.uniqueFemalesAssigned ?? 0}명
										</Typography>
									)}
								</Stack>
							</Box>
						);
					})}
				</Box>
			</Paper>

			<Paper sx={{ p: 2, mb: 3 }}>
				<Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
					<Box>
						<Typography variant="h6" fontWeight={800}>
							{selectedDate} 시간대별 상세
						</Typography>
						<Typography variant="body2" color="text.secondary">
							캠페인 좋아요 {formatNumber(dailyQuery.data?.summary.campaignLikes)}건 · 상호좋아요 {formatNumber(dailyQuery.data?.summary.mutualLikes)}건 · 매칭 {formatNumber(dailyQuery.data?.summary.matches)}건
						</Typography>
					</Box>
					{dailyQuery.isFetching ? <CircularProgress size={22} /> : null}
				</Stack>

				{dailyQuery.error ? (
					<Paper sx={{ p: 2, mb: 2, color: 'error.main' }}>
						{getAdminErrorMessage(dailyQuery.error, '일자 상세를 불러오지 못했습니다.')}
					</Paper>
				) : null}

				<Box sx={{ height: 260, mb: 2 }}>
					<ResponsiveContainer width="100%" height="100%">
						<BarChart data={dailyBucketChartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
							<CartesianGrid strokeDasharray="3 3" />
							<XAxis dataKey="label" />
							<YAxis allowDecimals={false} />
							<RechartsTooltip />
							<Legend />
							<Bar dataKey="캠페인 좋아요" fill="#2563eb" />
							<Bar dataKey="상호좋아요" fill="#16a34a" />
							<Bar dataKey="정기배치 매칭" fill="#f97316" />
							<Bar dataKey="재매칭" fill="#dc2626" />
						</BarChart>
					</ResponsiveContainer>
				</Box>

				<TableContainer>
					<Table size="small">
						<TableHead>
							<TableRow>
								<TableCell>시간대</TableCell>
								<TableCell align="right">캠페인 좋아요</TableCell>
								<TableCell align="right">여성→남성 좋아요</TableCell>
								<TableCell align="right">남성→여성 좋아요</TableCell>
								<TableCell align="right">상호좋아요</TableCell>
								<TableCell align="right">캠페인 기여</TableCell>
								<TableCell align="right">프로필 조회</TableCell>
								<TableCell align="right">정기배치 매칭</TableCell>
								<TableCell align="right">재매칭</TableCell>
							</TableRow>
						</TableHead>
						<TableBody>
							{dailyQuery.data?.buckets.map((bucket) => (
								<TableRow key={bucket.key} hover>
									<TableCell>{bucket.label}</TableCell>
									<TableCell align="right">{formatNumber(bucket.campaignLikes)}</TableCell>
									<TableCell align="right">{formatNumber(bucket.likes.femaleToMale)}</TableCell>
									<TableCell align="right">{formatNumber(bucket.likes.maleToFemale)}</TableCell>
									<TableCell align="right">{formatNumber(bucket.mutualLikes.total)}</TableCell>
									<TableCell align="right">{formatNumber(bucket.mutualLikes.fromCampaignLike)}</TableCell>
									<TableCell align="right">{formatNumber(bucket.profileViews.femaleToMale + bucket.profileViews.maleToFemale)}</TableCell>
									<TableCell align="right">{formatNumber(bucket.matches.scheduledBatch)}</TableCell>
									<TableCell align="right">{formatNumber(bucket.matches.rematching)}</TableCell>
								</TableRow>
							)) ?? null}
						</TableBody>
					</Table>
				</TableContainer>
			</Paper>

			<Paper sx={{ p: 2 }}>
				<Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
					<Box>
						<Typography variant="h6" fontWeight={800}>
							{selectedDate} 배정 내역
						</Typography>
						<Typography variant="body2" color="text.secondary">
							배정 {selectedDay?.totalAssignments ?? 0}건 · 좋아요 발송 {selectedDay?.totalLikesSent ?? 0}건
						</Typography>
					</Box>
					{calendarQuery.isFetching ? <CircularProgress size={22} /> : null}
				</Stack>

				{calendarQuery.isLoading ? (
					<Box sx={{ py: 8, display: 'flex', justifyContent: 'center' }}>
						<CircularProgress />
					</Box>
				) : selectedDay && selectedDay.totalAssignments > 0 && selectedDay.femaleGroups.length === 0 && calendarQuery.isFetching ? (
					<Box sx={{ py: 8, display: 'flex', justifyContent: 'center' }}>
						<CircularProgress />
					</Box>
				) : !selectedDay || selectedDay.femaleGroups.length === 0 ? (
					<Box sx={{ py: 8, textAlign: 'center', color: 'text.secondary' }}>
						해당 날짜에 배정된 항목이 없습니다.
					</Box>
				) : (
					<Stack spacing={2}>
						{selectedDay.femaleGroups.map((group) => (
							<Box key={group.femaleUser.userId}>
								<Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
									<Avatar sx={{ width: 36, height: 36 }}>
										{group.femaleUser.name.slice(0, 1)}
									</Avatar>
									<Box sx={{ flex: 1 }}>
										<Typography variant="subtitle2" fontWeight={800}>
											{group.femaleUser.name}
										</Typography>
										<Typography variant="caption" color="text.secondary">
											{maskPhone(group.femaleUser.phoneNumber)} · {shortId(group.femaleUser.userId)}
										</Typography>
									</Box>
									<Chip
										size="small"
										label={`${group.assignments.filter((a) => a.isLiked).length}/${group.assignments.length} 발송`}
										color={group.assignments.some((a) => a.isLiked) ? 'success' : 'default'}
									/>
								</Stack>
								<TableContainer>
									<AssignmentRows assignments={group.assignments} />
								</TableContainer>
								<Divider sx={{ mt: 2 }} />
							</Box>
						))}
					</Stack>
				)}
			</Paper>
		</Box>
	);
}
