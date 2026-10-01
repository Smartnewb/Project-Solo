"use client";
import {
	Alert,
	Button,
	ButtonGroup,
	Label,
	Spinner,
	Switch,
	Tooltip,
} from "@heroui/react";
import {
	CircleHelp,
	Heart,
	MessageCircle,
	ThumbsUp,
	TrendingUp,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import AdminService from "@/app/services/admin";
type PeriodType = "all" | "year" | "month" | "week" | "day";
interface StatMetric {
	mean: number;
	median: number;
}
interface EngagementRate {
	activeUsers: number;
	totalUsers: number;
	rate: number;
}
interface PeriodEngagement {
	likeEngagement: EngagementRate;
	mutualLikeEngagement: EngagementRate;
	chatOpenEngagement: EngagementRate;
}
interface UserEngagementStatsData {
	stats: {
		likesPerUser: StatMetric;
		mutualLikesPerUser: StatMetric;
		chatOpensPerUser: StatMetric;
		likeEngagement: EngagementRate;
		mutualLikeEngagement: EngagementRate;
		chatOpenEngagement: EngagementRate;
		periodEngagement?: PeriodEngagement;
	};
	startDate: string | null;
	endDate: string;
	periodType: "all" | "custom";
}
interface StatCardProps {
	title: string;
	icon: React.ReactNode;
	color: string;
	metric: StatMetric;
	engagement: EngagementRate;
	periodEngagement?: EngagementRate;
}
const PERIOD_LABELS: Record<PeriodType, string> = {
	all: "전체",
	year: "올해",
	month: "이번 달",
	week: "이번 주",
	day: "오늘",
};
const PERIOD_DESCRIPTIONS: Record<PeriodType, string> = {
	all: "서비스 시작부터 현재까지 가입한 전체 유저 대비 참여율",
	year: "올해 가입한 유저 중 참여율",
	month: "이번 달 가입한 유저 중 참여율",
	week: "이번 주 가입한 유저 중 참여율",
	day: "오늘 가입한 유저 중 참여율",
};
const getDateRange = (
	period: PeriodType,
): {
	startDate?: string;
	endDate?: string;
} => {
	const now = new Date();
	const formatDate = (d: Date) => d.toISOString().split("T")[0];
	switch (period) {
		case "all":
			return {};
		case "year": {
			const startOfYear = new Date(now.getFullYear(), 0, 1);
			return { startDate: formatDate(startOfYear), endDate: formatDate(now) };
		}
		case "month": {
			const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
			return { startDate: formatDate(startOfMonth), endDate: formatDate(now) };
		}
		case "week": {
			const dayOfWeek = now.getDay();
			const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
			const startOfWeek = new Date(now);
			startOfWeek.setDate(now.getDate() - diff);
			return { startDate: formatDate(startOfWeek), endDate: formatDate(now) };
		}
		case "day": {
			return { startDate: formatDate(now), endDate: formatDate(now) };
		}
	}
};
const EngagementRateDisplay = ({
	label,
	engagement,
	isPrimary = false,
}: {
	label: string;
	engagement: EngagementRate;
	isPrimary?: boolean;
}) => (
	<div style={{ flex: 1 }}>
		<Tooltip>
			<Tooltip.Trigger tabIndex={0}>
				<span
					style={{
						display: "block",
						marginBottom: 4,
						fontSize: isPrimary ? "0.75rem" : "0.7rem",
					}}
					className={"text-sm text-neutral-700"}
				>
					{label}
				</span>
			</Tooltip.Trigger>
			<Tooltip.Content>{label}</Tooltip.Content>
		</Tooltip>
		<div
			style={{
				display: "flex",
				alignItems: "baseline",
				gap: 4,
				flexWrap: "wrap",
			}}
		>
			<p className={"text-lg font-semibold text-neutral-900"}>
				{engagement.rate}%
			</p>
			<span
				style={{ fontSize: "0.65rem" }}
				className={"text-sm text-neutral-700"}
			>
				({(engagement.activeUsers ?? 0).toLocaleString()}/
				{(engagement.totalUsers ?? 0).toLocaleString()})
			</span>
		</div>
	</div>
);
const StatCard = ({
	title,
	icon,
	color,
	metric,
	engagement,
	periodEngagement,
}: StatCardProps) => {
	return (
		<section
			style={{ padding: 16, height: "100%", borderLeft: `4px solid ${color}` }}
		>
			<div
				style={{
					display: "flex",
					alignItems: "center",
					gap: 8,
					marginBottom: 16,
				}}
			>
				<div style={{}}>{icon}</div>
				<p className={"text-sm text-neutral-700"}>{title}</p>
			</div>
			<div style={{ marginBottom: 16 }}>
				<span className={"text-sm text-neutral-700"}>유저 1인당</span>
				<div style={{ display: "flex", gap: 24, marginTop: 4 }}>
					<Tooltip>
						<Tooltip.Trigger tabIndex={0}>
							<div>
								<span className={"text-sm text-neutral-700"}>평균</span>
								<h2 className={"text-lg font-semibold text-neutral-900"}>
									{metric.mean.toFixed(2)}
								</h2>
							</div>
						</Tooltip.Trigger>
						<Tooltip.Content>{"활동한 유저들의 평균값"}</Tooltip.Content>
					</Tooltip>
					<Tooltip>
						<Tooltip.Trigger tabIndex={0}>
							<div>
								<span className={"text-sm text-neutral-700"}>중앙값</span>
								<h2 className={"text-lg font-semibold text-neutral-900"}>
									{metric.median}
								</h2>
							</div>
						</Tooltip.Trigger>
						<Tooltip.Content>
							{"활동한 유저들의 중앙값 (상위 50% 기준)"}
						</Tooltip.Content>
					</Tooltip>
				</div>
			</div>
			<div
				style={{
					paddingTop: 16,
					borderTop: "1px solid",
					borderColor: "#e5e5e5",
				}}
			>
				<div
					style={{
						display: "flex",
						alignItems: "center",
						gap: 4,
						marginBottom: 8,
					}}
				>
					<TrendingUp style={{ fontSize: 16, color: "#525252" }} size={18} />
					<span className={"text-sm text-neutral-700"}>참여율</span>
				</div>
				<div style={{ display: "flex", gap: 16 }}>
					<EngagementRateDisplay
						label="전체 대상"
						engagement={engagement}
						isPrimary={!periodEngagement}
					/>
					{periodEngagement && (
						<EngagementRateDisplay
							label="기간 내 가입자"
							engagement={periodEngagement}
							isPrimary
						/>
					)}
				</div>
			</div>
		</section>
	);
};
export default function UserEngagementStats() {
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [data, setData] = useState<UserEngagementStatsData | null>(null);
	const [includeDeleted, setIncludeDeleted] = useState(false);
	const [period, setPeriod] = useState<PeriodType>("all");
	const dateRange = useMemo(() => getDateRange(period), [period]);
	const fetchData = useCallback(async () => {
		try {
			setLoading(true);
			setError(null);
			const response = await AdminService.userEngagement.getStats(
				dateRange.startDate,
				dateRange.endDate,
				includeDeleted,
			);
			setData(response);
		} catch (err) {
			setError("유저 참여 통계를 불러오는데 실패했습니다.");
		} finally {
			setLoading(false);
		}
	}, [dateRange.startDate, dateRange.endDate, includeDeleted]);
	useEffect(() => {
		fetchData();
	}, [fetchData]);
	const handleIncludeDeletedChange = (checked: boolean) => {
		setIncludeDeleted(checked);
	};
	const handlePeriodChange = (newPeriod: PeriodType | null) => {
		if (newPeriod !== null) {
			setPeriod(newPeriod);
		}
	};
	const periodDescription = PERIOD_DESCRIPTIONS[period];
	const displayDateRange = data
		? data.startDate
			? `${data.startDate} ~ ${data.endDate}`
			: `전체 기간 ~ ${data.endDate}`
		: "";
	if (loading && !data) {
		return (
			<section style={{ padding: 24 }}>
				<div
					style={{
						display: "flex",
						justifyContent: "center",
						alignItems: "center",
						paddingTop: 32,
						paddingBottom: 32,
					}}
				>
					<Spinner aria-label="불러오는 중" size="sm" />
					<p style={{ marginLeft: 16 }} className={"text-sm text-neutral-700"}>
						유저 참여 통계 로딩 중...
					</p>
				</div>
			</section>
		);
	}
	if (error) {
		return (
			<Alert style={{ marginBottom: 16 }} status={"danger"}>
				<Alert.Content>{error}</Alert.Content>
			</Alert>
		);
	}
	if (!data) {
		return null;
	}
	const { stats } = data;
	return (
		<section style={{ padding: 24 }}>
			<div
				style={{
					display: "flex",
					justifyContent: "space-between",
					alignItems: "flex-start",
					marginBottom: 16,
					flexWrap: "wrap",
					gap: 16,
				}}
			>
				<div style={{ display: "flex", alignItems: "center", gap: 8 }}>
					<h2 className={"text-lg font-semibold text-neutral-900"}>
						유저 참여 통계
					</h2>
					<Tooltip>
						<Button
							style={{ color: "#525252" }}
							variant={"tertiary"}
							isIconOnly={true}
							aria-label={"자세히 보기"}
							size={"sm"}
						>
							<CircleHelp size={18} />
						</Button>
						<Tooltip.Content>
							{
								<div>
									<p
										style={{ marginBottom: 8 }}
										className={"text-sm text-neutral-700"}
									>
										참여율 계산 기준
									</p>
									<p className={"text-sm text-neutral-700"}>
										{periodDescription}
									</p>
									<p
										style={{ marginTop: 8, color: "#a3a3a3" }}
										className={"text-sm text-neutral-700"}
									>
										• 평균/중앙값: 해당 활동을 1회 이상 한 유저 기준
									</p>
									<p
										style={{ color: "#a3a3a3" }}
										className={"text-sm text-neutral-700"}
									>
										• 참여율: 선택 기간 내 가입 유저 중 활동 유저 비율
									</p>
								</div>
							}
						</Tooltip.Content>
					</Tooltip>
				</div>
				<div
					style={{
						display: "flex",
						alignItems: "center",
						gap: 16,
						flexWrap: "wrap",
					}}
				>
					<ButtonGroup aria-label={"지표 필터"} className={"flex flex-wrap"}>
						{(Object.keys(PERIOD_LABELS) as PeriodType[]).map((key) => (
							<Button
								key={key}
								style={{
									paddingLeft: 12,
									paddingRight: 12,
									paddingTop: 4,
									paddingBottom: 4,
								}}
								variant={period === key ? "primary" : "secondary"}
								aria-pressed={period === key}
								onPress={() => handlePeriodChange(key)}
							>
								<span className={"text-sm text-neutral-700"}>
									{PERIOD_LABELS[key]}
								</span>
							</Button>
						))}
					</ButtonGroup>
					<Switch
						isSelected={includeDeleted}
						onChange={handleIncludeDeletedChange}
					>
						<Switch.Content>
							<Switch.Control>
								<Switch.Thumb />
							</Switch.Control>
							<Label>
								{
									<span className={"text-sm text-neutral-700"}>
										탈퇴자 포함
									</span>
								}
							</Label>
						</Switch.Content>
					</Switch>
				</div>
			</div>
			<span
				style={{ display: "block", marginBottom: 16 }}
				className={"text-sm text-neutral-700"}
			>
				{displayDateRange}
			</span>
			{loading ? (
				<div
					style={{
						display: "flex",
						justifyContent: "center",
						paddingTop: 32,
						paddingBottom: 32,
					}}
				>
					<Spinner aria-label="불러오는 중" size="sm" />
				</div>
			) : (
				<div className={"grid grid-cols-12 gap-4"}>
					<div className={"min-w-0 col-span-12 md:col-span-4"}>
						<StatCard
							title="좋아요"
							icon={<ThumbsUp size={18} />}
							color="#2196F3"
							metric={stats.likesPerUser}
							engagement={stats.likeEngagement}
							periodEngagement={stats.periodEngagement?.likeEngagement}
						/>
					</div>
					<div className={"min-w-0 col-span-12 md:col-span-4"}>
						<StatCard
							title="상호 좋아요"
							icon={<Heart size={18} />}
							color="#E91E63"
							metric={stats.mutualLikesPerUser}
							engagement={stats.mutualLikeEngagement}
							periodEngagement={stats.periodEngagement?.mutualLikeEngagement}
						/>
					</div>
					<div className={"min-w-0 col-span-12 md:col-span-4"}>
						<StatCard
							title="채팅 오픈"
							icon={<MessageCircle size={18} />}
							color="#4CAF50"
							metric={stats.chatOpensPerUser}
							engagement={stats.chatOpenEngagement}
							periodEngagement={stats.periodEngagement?.chatOpenEngagement}
						/>
					</div>
				</div>
			)}
		</section>
	);
}
