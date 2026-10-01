"use client";
import {
	Avatar,
	Button,
	Chip,
	Input,
	Label,
	ListBox,
	Select,
	Separator,
	Spinner,
	TextField,
	Tooltip,
} from "@heroui/react";
import {
	CalendarDays,
	ChevronLeft,
	ChevronRight,
	RefreshCw,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
	Bar,
	BarChart,
	CartesianGrid,
	Legend,
	ResponsiveContainer,
	Tooltip as RechartsTooltip,
	XAxis,
	YAxis,
} from "recharts";
import type {
	CampaignCalendarAssignment,
	CampaignCalendarDay,
	EngagementCacheMode,
	EngagementFlowDailyResponse,
	EngagementFlowResponse,
	EngagementSegment,
	IncentiveCampaignCountry,
} from "@/app/services/admin/incentive-campaign";
import {
	useIncentiveCampaignCalendar,
	useIncentiveCampaignEngagementFlow,
	useIncentiveCampaignEngagementFlowDaily,
} from "@/app/admin/hooks";
import { getAdminErrorMessage } from "@/shared/lib/http/admin-fetch";
const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];
const COUNTRY_OPTIONS: Array<{
	value: IncentiveCampaignCountry;
	label: string;
}> = [
	{ value: "kr", label: "KR" },
	{ value: "jp", label: "JP" },
	{ value: "all", label: "전체" },
];
const SEGMENT_OPTIONS: Array<{
	value: EngagementSegment;
	label: string;
}> = [
	{ value: "all", label: "전체" },
	{ value: "campaign_assigned_female", label: "캠페인 배정 여성" },
	{ value: "campaign_participated_female", label: "캠페인 참여 여성" },
	{ value: "non_campaign_female", label: "비캠페인 여성" },
	{ value: "male_received_campaign_like", label: "캠페인 좋아요 받은 남성" },
	{
		value: "male_not_received_campaign_like",
		label: "캠페인 좋아요 미수신 남성",
	},
];
function toDateKey(date: Date): string {
	const y = date.getFullYear();
	const m = String(date.getMonth() + 1).padStart(2, "0");
	const d = String(date.getDate()).padStart(2, "0");
	return `${y}-${m}-${d}`;
}
function parseDateKey(value: string): Date {
	const [year, month, day] = value.split("-").map(Number);
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
	if (!value) return "-";
	return new Intl.DateTimeFormat("ko-KR", {
		month: "2-digit",
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
	}).format(new Date(value));
}
function formatGeneratedAt(value: string | null | undefined): string {
	if (!value) return "-";
	return new Intl.DateTimeFormat("ko-KR", {
		month: "2-digit",
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
		second: "2-digit",
	}).format(new Date(value));
}
function formatNumber(value: number | null | undefined): string {
	return Number(value ?? 0).toLocaleString();
}
function formatRate(value: number | null | undefined): string {
	if (value == null || Number.isNaN(value)) return "-";
	const percent = Math.abs(value) <= 1 ? value * 100 : value;
	return `${percent.toFixed(1)}%`;
}
function maskPhone(phone: string | null): string {
	if (!phone) return "-";
	return phone.replace(/(\d{3})\d+(\d{4})/, "$1****$2");
}
function shortId(id: string | null): string {
	if (!id) return "-";
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
		"캠페인 좋아요": bucket.likes.campaign,
		상호좋아요: bucket.mutualLikes.total,
		"캠페인 기여 상호좋아요": bucket.mutualLikes.fromCampaignLike,
		매칭: bucket.matches.total,
		"정기배치 매칭": bucket.matches.scheduledBatch,
		재매칭: bucket.matches.rematching,
		"프로필 조회": bucket.profileViews.total,
	}));
}
function buildDailyBucketChartData(data?: EngagementFlowDailyResponse | null) {
	return (data?.buckets ?? []).map((bucket) => ({
		label: bucket.label,
		"캠페인 좋아요": bucket.campaignLikes,
		상호좋아요: bucket.mutualLikes.total,
		"정기배치 매칭": bucket.matches.scheduledBatch,
		재매칭: bucket.matches.rematching,
		"여성→남성 조회": bucket.profileViews.femaleToMale,
		"남성→여성 조회": bucket.profileViews.maleToFemale,
	}));
}
function buildInsights(data?: EngagementFlowResponse | null): string[] {
	if (!data) return [];
	const { summary, buckets } = data;
	const insights: string[] = [];
	const topCampaignBucket = [...buckets].sort(
		(a, b) => b.likes.campaign - a.likes.campaign,
	)[0];
	const topMatchBucket = [...buckets].sort(
		(a, b) => b.matches.total - a.matches.total,
	)[0];
	if (summary.campaign.assignments > 0) {
		insights.push(
			`배정 대비 캠페인 좋아요 전환은 ${formatRate(summary.campaign.assignmentToCampaignLikeRate)}입니다.`,
		);
	}
	if (summary.likes.campaign > 0) {
		insights.push(
			`캠페인 좋아요 중 상호좋아요로 이어진 비율은 ${formatRate(summary.conversion.campaignLikeToMutualRate)}입니다.`,
		);
	}
	if (topCampaignBucket) {
		insights.push(
			`캠페인 좋아요가 가장 많은 시간대는 ${topCampaignBucket.label}입니다.`,
		);
	}
	if (topMatchBucket) {
		insights.push(
			`매칭이 가장 많이 발생한 시간대는 ${topMatchBucket.label}입니다.`,
		);
	}
	return insights.slice(0, 4);
}
function AssignmentRows({
	assignments,
}: {
	assignments: CampaignCalendarAssignment[];
}) {
	return (
		<table
			className={
				"w-full text-sm text-left [&_td]:p-3 [&_th]:p-3 [&_thead]:bg-neutral-50 [&_tr]:border-b"
			}
		>
			<thead>
				<tr>
					<th scope="col">남성 프로필</th>
					<th scope="col">학교/학과</th>
					<th scope="col">상태</th>
					<th scope="col">좋아요 시각</th>
					<th scope="col">좋아요 ID</th>
				</tr>
			</thead>
			<tbody>
				{assignments.map((assignment) => (
					<tr key={assignment.id}>
						<td>
							<div className="flex flex-wrap items-center gap-2">
								<Avatar style={{ width: 44, height: 44 }}>
									<Avatar.Image
										src={assignment.maleProfile.profileImageUrl ?? undefined}
										alt={assignment.maleProfile.name}
									/>
									<Avatar.Fallback></Avatar.Fallback>
								</Avatar>
								<div>
									<p className={"text-sm text-neutral-700"}>
										{assignment.maleProfile.name}({assignment.maleProfile.age})
									</p>
									<span className={"text-sm text-neutral-700"}>
										{assignment.maleProfile.rank ?? "rank 없음"}·{" "}
										{shortId(assignment.maleProfile.userId)}
									</span>
								</div>
							</div>
						</td>
						<td>
							<p className={"text-sm text-neutral-700"}>
								{assignment.maleProfile.universityName ?? "-"}
							</p>
							<span className={"text-sm text-neutral-700"}>
								{assignment.maleProfile.departmentName ?? "-"}
							</span>
						</td>
						<td>
							<Chip size={"sm"} variant={"soft"}>
								<Chip.Label>
									{assignment.isLiked ? "발송 완료" : "미발송"}
								</Chip.Label>
							</Chip>
						</td>
						<td>{formatDateTime(assignment.likedAt)}</td>
						<td>
							<Tooltip>
								<Tooltip.Trigger tabIndex={0}>
									<span>{shortId(assignment.matchLikeId)}</span>
								</Tooltip.Trigger>
								<Tooltip.Content>
									{assignment.matchLikeId ?? ""}
								</Tooltip.Content>
							</Tooltip>
						</td>
					</tr>
				))}
			</tbody>
		</table>
	);
}
function MetricCard({
	label,
	value,
	helper,
	color = "text.primary",
}: {
	label: string;
	value: string;
	helper?: string;
	color?: string;
}) {
	return (
		<section style={{ padding: 16, flex: 1, minWidth: 180 }}>
			<p className={"text-sm text-neutral-700"}>{label}</p>
			<h2 className={"text-lg font-semibold text-neutral-900"}>{value}</h2>
			{helper ? (
				<span className={"text-sm text-neutral-700"}>{helper}</span>
			) : null}
		</section>
	);
}
export default function IncentiveCampaignClient() {
	const today = useMemo(() => new Date(), []);
	const [startDate, setStartDate] = useState(() =>
		toDateKey(startOfMonth(today)),
	);
	const [endDate, setEndDate] = useState(() => toDateKey(endOfMonth(today)));
	const [month, setMonth] = useState(() => startOfMonth(today));
	const [selectedDate, setSelectedDate] = useState(() => toDateKey(today));
	const [country, setCountry] = useState<IncentiveCampaignCountry>("kr");
	const [segment, setSegment] = useState<EngagementSegment>("all");
	const [cacheMode, setCacheMode] = useState<EngagementCacheMode>("auto");
	const flowQueryParams = useMemo(
		() => ({
			startDate,
			endDate,
			country,
			timezone: "Asia/Seoul" as const,
			segment,
			cache: cacheMode,
		}),
		[startDate, endDate, country, segment, cacheMode],
	);
	const dailyQueryParams = useMemo(
		() => ({
			date: selectedDate,
			country,
			timezone: "Asia/Seoul" as const,
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
		if (
			cacheMode === "refresh" &&
			!flowQuery.isFetching &&
			!dailyQuery.isFetching
		) {
			setCacheMode("auto");
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
	const handleCountryChange = (value: string) => {
		setCountry(value as IncentiveCampaignCountry);
	};
	const handleSegmentChange = (value: string) => {
		setSegment(value as EngagementSegment);
	};
	const refreshData = () => {
		setCacheMode("refresh");
	};
	return (
		<div>
			<div
				style={{
					marginBottom: 24,
					display: "flex",
					justifyContent: "space-between",
					gap: 16,
					alignItems: "center",
					flexWrap: "wrap",
				}}
			>
				<div>
					<h2 className={"text-lg font-semibold text-neutral-900"}>
						인센티브 캠페인 성과 흐름
					</h2>
					<p style={{ marginTop: 4 }} className={"text-sm text-neutral-700"}>
						배정 이후 좋아요, 상호좋아요, 프로필 조회, 시간대별 매칭 전환을
						확인합니다.
					</p>
				</div>
				<div className="flex flex-wrap items-center gap-2">
					<Tooltip>
						<Button
							onClick={goToday}
							variant={"tertiary"}
							isIconOnly={true}
							aria-label={"자세히 보기"}
							size={"md"}
						>
							<CalendarDays size={18} />
						</Button>
						<Tooltip.Content>{"오늘"}</Tooltip.Content>
					</Tooltip>
					<Tooltip>
						<Button
							onClick={refreshData}
							variant={"tertiary"}
							isDisabled={flowQuery.isFetching || dailyQuery.isFetching}
							isIconOnly={true}
							aria-label={"자세히 보기"}
							size={"md"}
						>
							<RefreshCw size={18} />
						</Button>
						<Tooltip.Content>{"캐시 새로 계산"}</Tooltip.Content>
					</Tooltip>
				</div>
			</div>
			<section style={{ padding: 16, marginBottom: 24 }}>
				<div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-4">
					<TextField className="w-full">
						<Label>{"시작일"}</Label>
						<Input
							type="date"
							value={startDate}
							onChange={(event) => handleStartDateChange(event.target.value)}
						/>
					</TextField>
					<TextField className="w-full">
						<Label>{"종료일"}</Label>
						<Input
							type="date"
							value={endDate}
							onChange={(event) => setEndDate(event.target.value)}
						/>
					</TextField>
					<div style={{ minWidth: 120 }}>
						<Select
							value={country}
							onChange={(value) => handleCountryChange(String(value ?? "ALL"))}
							className="w-full"
						>
							<Label>{"국가"}</Label>
							<Select.Trigger>
								<Select.Value />
								<Select.Indicator />
							</Select.Trigger>
							<Select.Popover>
								<ListBox>
									{COUNTRY_OPTIONS.map((option) => (
										<ListBox.Item
											id={option.value}
											textValue={String(option.label)}
											key={option.value}
										>
											{option.label}
										</ListBox.Item>
									))}
								</ListBox>
							</Select.Popover>
						</Select>
					</div>
					<div style={{ minWidth: 260 }}>
						<Select
							value={segment}
							onChange={(value) => handleSegmentChange(String(value ?? "ALL"))}
							className="w-full"
						>
							<Label>{"세그먼트"}</Label>
							<Select.Trigger>
								<Select.Value />
								<Select.Indicator />
							</Select.Trigger>
							<Select.Popover>
								<ListBox>
									{SEGMENT_OPTIONS.map((option) => (
										<ListBox.Item
											id={option.value}
											textValue={String(option.label)}
											key={option.value}
										>
											{option.label}
										</ListBox.Item>
									))}
								</ListBox>
							</Select.Popover>
						</Select>
					</div>
					<Button
						onClick={refreshData}
						variant={"secondary"}
						isDisabled={flowQuery.isFetching || dailyQuery.isFetching}
						size={"md"}
					>
						{<RefreshCw size={18} />}새로고침
					</Button>
					<div style={{ flex: 1 }}></div>
					<Chip size={"sm"} variant={"soft"}>
						<Chip.Label>{`캐시 ${flowQuery.data?.cache.hit ? "사용" : "계산"} · ${formatGeneratedAt(flowQuery.data?.cache.generatedAt)}`}</Chip.Label>
					</Chip>
				</div>
			</section>
			{flowQuery.error ? (
				<section style={{ padding: 16, marginBottom: 24, color: "#dc2626" }}>
					{getAdminErrorMessage(
						flowQuery.error,
						"성과 흐름을 불러오지 못했습니다.",
					)}
				</section>
			) : null}
			<div
				style={{ marginBottom: 24 }}
				className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-4"
			>
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
			</div>
			<div
				style={{ marginBottom: 24 }}
				className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-4"
			>
				<section style={{ padding: 16, flex: 2, minHeight: 360 }}>
					<div
						style={{ marginBottom: 16 }}
						className="flex flex-wrap items-center gap-4"
					>
						<div>
							<h2 className={"text-lg font-semibold text-neutral-900"}>
								시간대별 좋아요·매칭 흐름
							</h2>
							<p className={"text-sm text-neutral-700"}>
								5개 시간 bucket 기준으로 캠페인 좋아요와 시간별 매칭을 함께
								봅니다.
							</p>
						</div>
						{flowQuery.isFetching ? (
							<Spinner aria-label="불러오는 중" size="sm" />
						) : null}
					</div>
					<div style={{ height: 280 }}>
						<ResponsiveContainer width="100%" height="100%">
							<BarChart
								data={bucketChartData}
								margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
							>
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
					</div>
				</section>
				<section style={{ padding: 16, flex: 1 }}>
					<h2
						style={{ marginBottom: 16 }}
						className={"text-lg font-semibold text-neutral-900"}
					>
						운영 인사이트
					</h2>
					<div className="flex flex-col gap-2">
						{insights.length > 0 ? (
							insights.map((insight) => (
								<div
									key={insight}
									style={{
										padding: 12,
										borderRadius: 8,
										backgroundColor: "#fafafa",
									}}
								>
									<p className={"text-sm text-neutral-700"}>{insight}</p>
								</div>
							))
						) : (
							<p className={"text-sm text-neutral-700"}>
								데이터를 불러오면 주요 흐름을 표시합니다.
							</p>
						)}
					</div>
				</section>
			</div>
			<div
				style={{ marginBottom: 24 }}
				className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-4"
			>
				<section style={{ padding: 16, flex: 1 }}>
					<p style={{ marginBottom: 8 }} className={"text-sm text-neutral-700"}>
						좋아요
					</p>
					<div className="flex flex-col gap-4">
						<p className={"text-sm text-neutral-700"}>
							전체 {formatNumber(flowQuery.data?.summary.likes.total)}
						</p>
						<p className={"text-sm text-neutral-700"}>
							여성→남성{" "}
							{formatNumber(flowQuery.data?.summary.likes.femaleToMale)}
						</p>
						<p className={"text-sm text-neutral-700"}>
							남성→여성{" "}
							{formatNumber(flowQuery.data?.summary.likes.maleToFemale)}
						</p>
						<p className={"text-sm text-neutral-700"}>
							캠페인 {formatNumber(flowQuery.data?.summary.likes.campaign)}·
							비캠페인 {formatNumber(flowQuery.data?.summary.likes.nonCampaign)}
						</p>
						<span className={"text-sm text-neutral-700"}>
							발신자 {formatNumber(flowQuery.data?.summary.likes.uniqueSenders)}
							명 · 수신자{" "}
							{formatNumber(flowQuery.data?.summary.likes.uniqueReceivers)}명
						</span>
					</div>
				</section>
				<section style={{ padding: 16, flex: 1 }}>
					<p style={{ marginBottom: 8 }} className={"text-sm text-neutral-700"}>
						프로필 조회
					</p>
					<div className="flex flex-col gap-4">
						<p className={"text-sm text-neutral-700"}>
							전체 {formatNumber(flowQuery.data?.summary.profileViews.total)}
						</p>
						<p className={"text-sm text-neutral-700"}>
							여성→남성{" "}
							{formatNumber(flowQuery.data?.summary.profileViews.femaleToMale)}
						</p>
						<p className={"text-sm text-neutral-700"}>
							남성→여성{" "}
							{formatNumber(flowQuery.data?.summary.profileViews.maleToFemale)}
						</p>
						<span className={"text-sm text-neutral-700"}>
							조회자{" "}
							{formatNumber(flowQuery.data?.summary.profileViews.uniqueViewers)}
							명 · 조회 대상{" "}
							{formatNumber(
								flowQuery.data?.summary.profileViews.uniqueViewedUsers,
							)}
							명
						</span>
					</div>
				</section>
				<section style={{ padding: 16, flex: 1 }}>
					<p style={{ marginBottom: 8 }} className={"text-sm text-neutral-700"}>
						매칭 출처
					</p>
					<div className="flex flex-col gap-4">
						<p className={"text-sm text-neutral-700"}>
							정기배치{" "}
							{formatNumber(flowQuery.data?.summary.matches.scheduledBatch)}
						</p>
						<p className={"text-sm text-neutral-700"}>
							재매칭 {formatNumber(flowQuery.data?.summary.matches.rematching)}
						</p>
						<p className={"text-sm text-neutral-700"}>
							관리자 {formatNumber(flowQuery.data?.summary.matches.admin)}·
							프로필뷰어{" "}
							{formatNumber(flowQuery.data?.summary.matches.profileViewer)}
						</p>
						<span className={"text-sm text-neutral-700"}>
							캠페인 여성 포함{" "}
							{formatNumber(flowQuery.data?.summary.matches.withCampaignFemale)}
							· 캠페인 남성 포함{" "}
							{formatNumber(flowQuery.data?.summary.matches.withCampaignMale)}
						</span>
					</div>
				</section>
				<section style={{ padding: 16, flex: 1 }}>
					<p style={{ marginBottom: 8 }} className={"text-sm text-neutral-700"}>
						전환율
					</p>
					<div className="flex flex-col gap-4">
						<p className={"text-sm text-neutral-700"}>
							캠페인 좋아요→상호좋아요{" "}
							{formatRate(
								flowQuery.data?.summary.conversion.campaignLikeToMutualRate,
							)}
						</p>
						<p className={"text-sm text-neutral-700"}>
							프로필조회→좋아요{" "}
							{formatRate(
								flowQuery.data?.summary.conversion.profileViewToLikeRate,
							)}
						</p>
						<p className={"text-sm text-neutral-700"}>
							프로필조회→매칭{" "}
							{formatRate(
								flowQuery.data?.summary.conversion.profileViewToMatchRate,
							)}
						</p>
						<p className={"text-sm text-neutral-700"}>
							좋아요→매칭{" "}
							{formatRate(flowQuery.data?.summary.conversion.likeToMatchRate)}
						</p>
					</div>
				</section>
			</div>
			<section style={{ padding: 16, marginBottom: 24 }}>
				<div
					style={{ marginBottom: 16 }}
					className="flex flex-wrap items-center gap-4"
				>
					<Button
						onClick={() => moveMonth(-1)}
						variant={"tertiary"}
						isIconOnly={true}
						aria-label="이전 달"
						size={"md"}
					>
						<ChevronLeft size={18} />
					</Button>
					<div style={{ textAlign: "center" }}>
						<h2 className={"text-lg font-semibold text-neutral-900"}>
							{formatMonthLabel(month)}
						</h2>
						<span className={"text-sm text-neutral-700"}>
							기존 배정 관제와 일자별 성과 상세
						</span>
					</div>
					<Button
						onClick={() => moveMonth(1)}
						variant={"tertiary"}
						isIconOnly={true}
						aria-label="다음 달"
						size={"md"}
					>
						<ChevronRight size={18} />
					</Button>
				</div>
				<div
					style={{ marginBottom: 16 }}
					className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-4"
				>
					{[
						["월 배정", monthSummary.assignments],
						["월 좋아요 발송", monthSummary.likes],
						["일별 배정 여성 합", monthSummary.assignedFemales],
						["일별 참여 여성 합", monthSummary.participatedFemales],
					].map(([label, value]) => (
						<MetricCard
							key={label}
							label={String(label)}
							value={formatNumber(Number(value))}
						/>
					))}
				</div>
				{calendarQuery.error ? (
					<section style={{ padding: 16, marginBottom: 24, color: "#dc2626" }}>
						{getAdminErrorMessage(
							calendarQuery.error,
							"캠페인 캘린더를 불러오지 못했습니다.",
						)}
					</section>
				) : null}
				<div
					style={{
						display: "grid",
						gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
						border: "1px solid",
						borderRadius: 8,
						overflow: "hidden",
					}}
				>
					{WEEKDAYS.map((weekday) => (
						<div
							key={weekday}
							style={{
								padding: 8,
								backgroundColor: "#fafafa",
								borderBottom: "1px solid",
							}}
						>
							<span className={"text-sm text-neutral-700"}>{weekday}</span>
						</div>
					))}
					{calendarDays.map((date) => {
						const key = toDateKey(date);
						const day = daysByDate.get(key);
						const inMonth = date.getMonth() === month.getMonth();
						const selected = key === selectedDate;
						const dailyMetrics =
							dailySummaryByDate?.date === key ? dailySummaryByDate : null;
						return (
							<Button
								variant="ghost"
								className="h-auto block w-full rounded-none"
								aria-pressed={selected}
								aria-label={`${key} 캠페인 조회`}
								key={key}
								onClick={() => setSelectedDate(key)}
								style={{
									minHeight: 132,
									padding: 8,
									textAlign: "left",
									border: "0px solid #e5e5e5",
									borderRight: "1px solid",
									borderBottom: "1px solid",
									backgroundColor: selected ? "#F5F5F5" : "#FFFFFF",
									color: inMonth ? "#171717" : "#A3A3A3",
									cursor: "pointer",
								}}
							>
								<p className={"text-sm text-neutral-700"}>{date.getDate()}</p>
								<div style={{ marginTop: 8 }} className="flex flex-col gap-4">
									<Chip size={"sm"} variant={"soft"}>
										<Chip.Label>{`배정 ${day?.totalAssignments ?? 0}`}</Chip.Label>
									</Chip>
									<Chip size={"sm"} variant={"soft"}>
										<Chip.Label>{`발송 ${day?.totalLikesSent ?? 0}`}</Chip.Label>
									</Chip>
									{dailyMetrics ? (
										<>
											<span className={"text-sm text-neutral-700"}>
												상호 {dailyMetrics.mutualLikes}· 매칭{" "}
												{dailyMetrics.matches}
											</span>
											<span className={"text-sm text-neutral-700"}>
												캠페인 좋아요 {dailyMetrics.campaignLikes}
											</span>
										</>
									) : (
										<span className={"text-sm text-neutral-700"}>
											여성 {day?.uniqueFemalesAssigned ?? 0}명
										</span>
									)}
								</div>
							</Button>
						);
					})}
				</div>
			</section>
			<section style={{ padding: 16, marginBottom: 24 }}>
				<div
					style={{ marginBottom: 16 }}
					className="flex flex-wrap items-center gap-4"
				>
					<div>
						<h2 className={"text-lg font-semibold text-neutral-900"}>
							{selectedDate}시간대별 상세
						</h2>
						<p className={"text-sm text-neutral-700"}>
							캠페인 좋아요{" "}
							{formatNumber(dailyQuery.data?.summary.campaignLikes)}건 ·
							상호좋아요 {formatNumber(dailyQuery.data?.summary.mutualLikes)}건
							· 매칭 {formatNumber(dailyQuery.data?.summary.matches)}건
						</p>
					</div>
					{dailyQuery.isFetching ? (
						<Spinner aria-label="불러오는 중" size="sm" />
					) : null}
				</div>
				{dailyQuery.error ? (
					<section style={{ padding: 16, marginBottom: 16, color: "#dc2626" }}>
						{getAdminErrorMessage(
							dailyQuery.error,
							"일자 상세를 불러오지 못했습니다.",
						)}
					</section>
				) : null}
				<div style={{ height: 260, marginBottom: 16 }}>
					<ResponsiveContainer width="100%" height="100%">
						<BarChart
							data={dailyBucketChartData}
							margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
						>
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
				</div>
				<div className={"overflow-x-auto"}>
					<table
						className={
							"w-full text-sm text-left [&_td]:p-3 [&_th]:p-3 [&_thead]:bg-neutral-50 [&_tr]:border-b"
						}
					>
						<thead>
							<tr>
								<th scope="col">시간대</th>
								<th scope="col">캠페인 좋아요</th>
								<th scope="col">여성→남성 좋아요</th>
								<th scope="col">남성→여성 좋아요</th>
								<th scope="col">상호좋아요</th>
								<th scope="col">캠페인 기여</th>
								<th scope="col">프로필 조회</th>
								<th scope="col">정기배치 매칭</th>
								<th scope="col">재매칭</th>
							</tr>
						</thead>
						<tbody>
							{dailyQuery.data?.buckets.map((bucket) => (
								<tr key={bucket.key}>
									<td>{bucket.label}</td>
									<td>{formatNumber(bucket.campaignLikes)}</td>
									<td>{formatNumber(bucket.likes.femaleToMale)}</td>
									<td>{formatNumber(bucket.likes.maleToFemale)}</td>
									<td>{formatNumber(bucket.mutualLikes.total)}</td>
									<td>{formatNumber(bucket.mutualLikes.fromCampaignLike)}</td>
									<td>
										{formatNumber(
											bucket.profileViews.femaleToMale +
												bucket.profileViews.maleToFemale,
										)}
									</td>
									<td>{formatNumber(bucket.matches.scheduledBatch)}</td>
									<td>{formatNumber(bucket.matches.rematching)}</td>
								</tr>
							)) ?? null}
						</tbody>
					</table>
				</div>
			</section>
			<section style={{ padding: 16 }}>
				<div
					style={{ marginBottom: 16 }}
					className="flex flex-wrap items-center gap-4"
				>
					<div>
						<h2 className={"text-lg font-semibold text-neutral-900"}>
							{selectedDate}배정 내역
						</h2>
						<p className={"text-sm text-neutral-700"}>
							배정 {selectedDay?.totalAssignments ?? 0}건 · 좋아요 발송{" "}
							{selectedDay?.totalLikesSent ?? 0}건
						</p>
					</div>
					{calendarQuery.isFetching ? (
						<Spinner aria-label="불러오는 중" size="sm" />
					) : null}
				</div>
				{calendarQuery.isLoading ? (
					<div
						style={{
							paddingTop: 64,
							paddingBottom: 64,
							display: "flex",
							justifyContent: "center",
						}}
					>
						<Spinner aria-label="불러오는 중" size="sm" />
					</div>
				) : selectedDay &&
					selectedDay.totalAssignments > 0 &&
					selectedDay.femaleGroups.length === 0 &&
					calendarQuery.isFetching ? (
					<div
						style={{
							paddingTop: 64,
							paddingBottom: 64,
							display: "flex",
							justifyContent: "center",
						}}
					>
						<Spinner aria-label="불러오는 중" size="sm" />
					</div>
				) : !selectedDay || selectedDay.femaleGroups.length === 0 ? (
					<div
						style={{
							paddingTop: 64,
							paddingBottom: 64,
							textAlign: "center",
							color: "#525252",
						}}
					>
						해당 날짜에 배정된 항목이 없습니다.
					</div>
				) : (
					<div className="flex flex-col gap-4">
						{selectedDay.femaleGroups.map((group) => (
							<div key={group.femaleUser.userId}>
								<div
									style={{ marginBottom: 8 }}
									className="flex flex-wrap items-center gap-2"
								>
									<Avatar style={{ width: 36, height: 36 }}>
										<Avatar.Image alt={"프로필"} />
										<Avatar.Fallback>
											{group.femaleUser.name.slice(0, 1)}
										</Avatar.Fallback>
									</Avatar>
									<div style={{ flex: 1 }}>
										<p className={"text-sm text-neutral-700"}>
											{group.femaleUser.name}
										</p>
										<span className={"text-sm text-neutral-700"}>
											{maskPhone(group.femaleUser.phoneNumber)}·{" "}
											{shortId(group.femaleUser.userId)}
										</span>
									</div>
									<Chip size={"sm"} variant={"soft"}>
										<Chip.Label>{`${group.assignments.filter((a) => a.isLiked).length}/${group.assignments.length} 발송`}</Chip.Label>
									</Chip>
								</div>
								<div className={"overflow-x-auto"}>
									<AssignmentRows assignments={group.assignments} />
								</div>
								<Separator style={{ marginTop: 16 }}></Separator>
							</div>
						))}
					</div>
				)}
			</section>
		</div>
	);
}
