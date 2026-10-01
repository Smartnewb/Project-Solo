"use client";
import { Card, Label, Switch } from "@heroui/react";
import {
	ChartNoAxesCombined,
	GraduationCap,
	SlidersHorizontal,
	TrendingDown,
	TrendingUp,
	UserMinus,
	Users,
} from "lucide-react";
import { ko } from "date-fns/locale";
import TotalUsersCard from "@/components/admin/dashboard/TotalUsersCard";
import DailySignupsCard from "@/components/admin/dashboard/DailySignupsCard";
import WeeklySignupsCard from "@/components/admin/dashboard/WeeklySignupsCard";
import GenderStatsCard from "@/components/admin/dashboard/GenderStatsCard";
import UniversityStatsCard from "@/components/admin/dashboard/UniversityStatsCard";
import SignupStatsDashboard from "@/components/admin/dashboard/SignupStatsDashboard";
import WithdrawalStatsCard from "@/components/admin/dashboard/WithdrawalStatsCard";
import WithdrawalStatsDashboard from "@/components/admin/dashboard/WithdrawalStatsDashboard";
import WithdrawalReasonStats from "@/components/admin/dashboard/WithdrawalReasonStats";
import ChurnRateStats from "@/components/admin/dashboard/ChurnRateStats";
import RegionFilter, {
	useRegionFilter,
} from "@/components/admin/common/RegionFilter";
import IncludeDeletedFilter, {
	useIncludeDeletedFilter,
} from "@/components/admin/common/IncludeDeletedFilter";
interface SectionHeaderProps {
	icon: React.ReactNode;
	title: string;
	subtitle?: string;
	color?: string;
	bgColor?: string;
}
function SectionHeader({
	icon,
	title,
	subtitle,
	color = "#8b5cf6",
	bgColor = "#f5f3ff",
}: SectionHeaderProps) {
	return (
		<div className="flex items-center gap-3 mb-4">
			<div
				style={{
					padding: 12,
					borderRadius: 16,
					backgroundColor: bgColor,
					color: color,
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
				}}
			>
				{icon}
			</div>
			<div>
				<h2
					style={{ fontWeight: 600, color: "#111827" }}
					className={"text-lg font-semibold text-neutral-900"}
				>
					{title}
				</h2>
				{subtitle && (
					<span
						style={{ color: "#6b7280" }}
						className={"text-sm text-neutral-700"}
					>
						{subtitle}
					</span>
				)}
			</div>
		</div>
	);
}
function MemberStatsDashboardContent() {
	const {
		region,
		useCluster,
		setRegion: setRegionFilter,
		setUseCluster: setUseClusterMode,
		getRegionParam,
		getUseClusterParam,
	} = useRegionFilter();
	const { includeDeleted, setIncludeDeleted, getIncludeDeletedParam } =
		useIncludeDeletedFilter();
	const today = new Date();
	const formattedDate = `${today.getFullYear()}년 ${today.getMonth() + 1}월 ${today.getDate()}일`;
	const dayOfWeek = ["일", "월", "화", "수", "목", "금", "토"][today.getDay()];
	return (
		<>
			<div className="min-h-screen bg-gray-50">
				<div
					style={{
						background: "#ffffff",
						borderBottom: "1px solid #e5e7eb",
					}}
				>
					<div className="max-w-7xl mx-auto px-4 py-6">
						<div className="flex items-center justify-between">
							<div>
								<h2
									style={{ fontWeight: 700, color: "#171717", marginBottom: 4 }}
									className={"text-lg font-semibold text-neutral-900"}
								>
									회원 통계
								</h2>
								<p
									style={{ color: "#525252" }}
									className={"text-sm text-neutral-700"}
								>
									전체 회원 현황과 트렌드를 한눈에 확인하세요
								</p>
							</div>
							<div
								style={{
									paddingLeft: 24,
									paddingRight: 24,
									paddingTop: 12,
									paddingBottom: 12,
									borderRadius: 16,
									backgroundColor: "#f9fafb",
									backdropFilter: "blur(10px)",
								}}
							>
								<p
									style={{ color: "#171717", fontWeight: 500 }}
									className={"text-sm text-neutral-700"}
								>
									{formattedDate}({dayOfWeek})
								</p>
							</div>
						</div>
					</div>
				</div>
				<div className="max-w-7xl mx-auto px-4 -mt-4">
					<Card style={{ borderRadius: 24, border: "1px solid #e5e7eb" }}>
						<Card.Content style={{ paddingTop: 16, paddingBottom: 16 }}>
							<div className="flex items-center justify-between">
								<div className="flex items-center gap-4 flex-wrap">
									<div className="flex items-center gap-2">
										<SlidersHorizontal
											style={{ color: "#8b5cf6", fontSize: 20 }}
											size={18}
										/>
										<p
											style={{ fontWeight: 600, color: "#374151" }}
											className={"text-sm text-neutral-700"}
										>
											필터
										</p>
									</div>
									<RegionFilter
										value={region}
										onChange={setRegionFilter}
										useCluster={useCluster}
										onClusterModeChange={setUseClusterMode}
										showClusterToggle={false}
										size="small"
										sx={{ minWidth: 160 }}
									/>
									<IncludeDeletedFilter
										value={includeDeleted}
										onChange={setIncludeDeleted}
										size="small"
									/>
									<Switch isSelected={useCluster} onChange={setUseClusterMode}>
										<Switch.Content>
											<Switch.Control>
												<Switch.Thumb />
											</Switch.Control>
											<Label>
												{
													<p
														style={{ color: "#6b7280" }}
														className={"text-sm text-neutral-700"}
													>
														{useCluster ? "클러스터 단위" : "개별 지역"}
													</p>
												}
											</Label>
										</Switch.Content>
									</Switch>
								</div>
							</div>
						</Card.Content>
					</Card>
				</div>
				<div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
					<Card
						style={{
							borderRadius: 24,
							border: "1px solid #e5e7eb",
							overflow: "hidden",
						}}
					>
						<div
							style={{
								paddingLeft: 24,
								paddingRight: 24,
								paddingTop: 16,
								paddingBottom: 16,
								borderBottom: "1px solid #e5e7eb",
								backgroundColor: "#f9fafb",
							}}
						>
							<SectionHeader
								icon={<ChartNoAxesCombined size={18} />}
								title="실시간 회원 현황"
								subtitle="실시간으로 업데이트되는 회원 통계"
								color="#3b82f6"
								bgColor="#eff6ff"
							/>
						</div>
						<Card.Content style={{ padding: 24 }}>
							<div className={"grid grid-cols-12 gap-4"}>
								<div
									className={"min-w-0 col-span-12 sm:col-span-6 md:col-span-4"}
								>
									<TotalUsersCard
										region={getRegionParam()}
										includeDeleted={getIncludeDeletedParam()}
										useCluster={getUseClusterParam()}
									/>
								</div>
								<div
									className={"min-w-0 col-span-12 sm:col-span-6 md:col-span-4"}
								>
									<WeeklySignupsCard
										region={getRegionParam()}
										includeDeleted={getIncludeDeletedParam()}
										useCluster={getUseClusterParam()}
									/>
								</div>
								<div
									className={"min-w-0 col-span-12 sm:col-span-6 md:col-span-4"}
								>
									<DailySignupsCard
										region={getRegionParam()}
										includeDeleted={getIncludeDeletedParam()}
										useCluster={getUseClusterParam()}
									/>
								</div>
							</div>
						</Card.Content>
					</Card>
					<Card
						style={{
							borderRadius: 24,
							border: "1px solid #e5e7eb",
							overflow: "hidden",
						}}
					>
						<div
							style={{
								paddingLeft: 24,
								paddingRight: 24,
								paddingTop: 16,
								paddingBottom: 16,
								borderBottom: "1px solid #e5e7eb",
								backgroundColor: "#f9fafb",
							}}
						>
							<SectionHeader
								icon={<Users size={18} />}
								title="성별 분포"
								subtitle="회원 성비 현황"
								color="#ec4899"
								bgColor="#fdf2f8"
							/>
						</div>
						<Card.Content style={{ padding: 0 }}>
							<GenderStatsCard
								region={getRegionParam()}
								includeDeleted={getIncludeDeletedParam()}
								useCluster={getUseClusterParam()}
							/>
						</Card.Content>
					</Card>
					<Card
						style={{
							borderRadius: 24,
							border: "1px solid #e5e7eb",
							overflow: "hidden",
						}}
					>
						<div
							style={{
								paddingLeft: 24,
								paddingRight: 24,
								paddingTop: 16,
								paddingBottom: 16,
								borderBottom: "1px solid #e5e7eb",
								backgroundColor: "#f9fafb",
							}}
						>
							<SectionHeader
								icon={<TrendingUp size={18} />}
								title="가입 추이"
								subtitle="일별, 주별, 월별 가입 트렌드"
								color="#10b981"
								bgColor="#ecfdf5"
							/>
						</div>
						<Card.Content style={{ padding: 0 }}>
							<SignupStatsDashboard
								region={getRegionParam()}
								includeDeleted={getIncludeDeletedParam()}
								useCluster={getUseClusterParam()}
							/>
						</Card.Content>
					</Card>
					<Card
						style={{
							borderRadius: 24,
							border: "1px solid #e5e7eb",
							overflow: "hidden",
						}}
					>
						<div
							style={{
								paddingLeft: 24,
								paddingRight: 24,
								paddingTop: 16,
								paddingBottom: 16,
								borderBottom: "1px solid #e5e7eb",
								backgroundColor: "#f9fafb",
							}}
						>
							<SectionHeader
								icon={<GraduationCap size={18} />}
								title="대학별 통계"
								subtitle="대학교별 회원 분포"
								color="#f59e0b"
								bgColor="#fffbeb"
							/>
						</div>
						<Card.Content style={{ padding: 0 }}>
							<UniversityStatsCard
								region={getRegionParam()}
								includeDeleted={getIncludeDeletedParam()}
								useCluster={getUseClusterParam()}
							/>
						</Card.Content>
					</Card>
					<div style={{ paddingTop: 32, paddingBottom: 32 }}>
						<div style={{ display: "flex", alignItems: "center", gap: 24 }}>
							<div
								style={{
									flex: 1,
									height: 1,
									background: "linear-gradient(90deg, transparent, #e5e7eb)",
								}}
							></div>
							<div
								style={{
									display: "flex",
									alignItems: "center",
									gap: 16,
									paddingLeft: 32,
									paddingRight: 32,
									paddingTop: 16,
									paddingBottom: 16,
									borderRadius: 24,
									backgroundColor: "#fef2f2",
									border: "1px solid #fecaca",
								}}
							>
								<UserMinus style={{ color: "#ef4444" }} size={18} />
								<h2
									style={{ fontWeight: 600, color: "#991b1b" }}
									className={"text-lg font-semibold text-neutral-900"}
								>
									회원 탈퇴 분석
								</h2>
							</div>
							<div
								style={{
									flex: 1,
									height: 1,
									background: "linear-gradient(90deg, #e5e7eb, transparent)",
								}}
							></div>
						</div>
					</div>
					<Card
						style={{
							borderRadius: 24,
							border: "1px solid #fecaca",
							overflow: "hidden",
						}}
					>
						<div
							style={{
								paddingLeft: 24,
								paddingRight: 24,
								paddingTop: 16,
								paddingBottom: 16,
								borderBottom: "1px solid #fecaca",
								backgroundColor: "#fef2f2",
							}}
						>
							<SectionHeader
								icon={<UserMinus size={18} />}
								title="탈퇴 현황"
								subtitle="기간별 탈퇴자 수"
								color="#ef4444"
								bgColor="#fee2e2"
							/>
						</div>
						<Card.Content style={{ padding: 0 }}>
							<WithdrawalStatsCard
								region={getRegionParam()}
								useCluster={getUseClusterParam()}
							/>
						</Card.Content>
					</Card>
					<Card
						style={{
							borderRadius: 24,
							border: "1px solid #e5e7eb",
							overflow: "hidden",
						}}
					>
						<div
							style={{
								paddingLeft: 24,
								paddingRight: 24,
								paddingTop: 16,
								paddingBottom: 16,
								borderBottom: "1px solid #e5e7eb",
								backgroundColor: "#f9fafb",
							}}
						>
							<SectionHeader
								icon={<TrendingDown size={18} />}
								title="탈퇴 추이"
								subtitle="시간에 따른 탈퇴 패턴 분석"
								color="#ef4444"
								bgColor="#fef2f2"
							/>
						</div>
						<Card.Content style={{ padding: 0 }}>
							<WithdrawalStatsDashboard
								region={getRegionParam()}
								useCluster={getUseClusterParam()}
							/>
						</Card.Content>
					</Card>
					<div className={"grid grid-cols-12 gap-4"}>
						<div className={"min-w-0 col-span-12 lg:col-span-6"}>
							<Card
								style={{
									borderRadius: 24,
									border: "1px solid #e5e7eb",
									overflow: "hidden",
									height: "100%",
								}}
							>
								<div
									style={{
										paddingLeft: 24,
										paddingRight: 24,
										paddingTop: 16,
										paddingBottom: 16,
										borderBottom: "1px solid #e5e7eb",
										backgroundColor: "#f9fafb",
									}}
								>
									<SectionHeader
										icon={<ChartNoAxesCombined size={18} />}
										title="탈퇴 사유 분석"
										subtitle="회원들이 떠나는 이유"
										color="#f59e0b"
										bgColor="#fffbeb"
									/>
								</div>
								<Card.Content style={{ padding: 0 }}>
									<WithdrawalReasonStats />
								</Card.Content>
							</Card>
						</div>
						<div className={"min-w-0 col-span-12 lg:col-span-6"}>
							<Card
								style={{
									borderRadius: 24,
									border: "1px solid #e5e7eb",
									overflow: "hidden",
									height: "100%",
								}}
							>
								<div
									style={{
										paddingLeft: 24,
										paddingRight: 24,
										paddingTop: 16,
										paddingBottom: 16,
										borderBottom: "1px solid #e5e7eb",
										backgroundColor: "#f9fafb",
									}}
								>
									<SectionHeader
										icon={<TrendingDown size={18} />}
										title="이탈률 분석"
										subtitle="회원 유지율 모니터링"
										color="#8b5cf6"
										bgColor="#f5f3ff"
									/>
								</div>
								<Card.Content style={{ padding: 0 }}>
									<ChurnRateStats />
								</Card.Content>
							</Card>
						</div>
					</div>
				</div>
			</div>
		</>
	);
}
export default function MemberStatsDashboard() {
	return <MemberStatsDashboardContent />;
}
