'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
	Box,
	Paper,
	Typography,
	CircularProgress,
	Alert,
	Chip,
	LinearProgress,
	Collapse,
	IconButton,
	Tooltip,
	Grid,
	Card,
	CardContent,
} from '@mui/material';
import {
	Warning as WarningIcon,
	Error as ErrorIcon,
	Info as InfoIcon,
	ExpandMore as ExpandMoreIcon,
	ExpandLess as ExpandLessIcon,
	TrendingDown as TrendingDownIcon,
	TrendingUp as TrendingUpIcon,
	Speed as SpeedIcon,
	People as PeopleIcon,
	AttachMoney as MoneyIcon,
	Favorite as HeartIcon,
	SentimentSatisfied as SatisfactionIcon,
	Lightbulb as LightbulbIcon,
} from '@mui/icons-material';
import { dashboardService } from '@/app/services/dashboard';
import {
	ActionableInsightsResponse,
	InsightSeverity,
	ActionableInsight,
	FunnelBottleneck,
	UserPainPoint,
	UrgentAction,
	HealthScore,
	INSIGHT_CATEGORY_LABELS,
} from '../types';

const SEVERITY_CONFIG: Record<InsightSeverity, { color: string; bgColor: string; icon: React.ReactNode }> = {
	critical: { color: '#dc2626', bgColor: '#fef2f2', icon: <ErrorIcon fontSize="small" /> },
	warning: { color: '#f59e0b', bgColor: '#fffbeb', icon: <WarningIcon fontSize="small" /> },
	info: { color: '#3b82f6', bgColor: '#eff6ff', icon: <InfoIcon fontSize="small" /> },
};

interface HealthScoreGaugeProps {
	healthScore: HealthScore;
}

function HealthScoreGauge({ healthScore }: HealthScoreGaugeProps) {
	const getScoreColor = (score: number) => {
		if (score >= 70) return '#22c55e';
		if (score >= 50) return '#f59e0b';
		return '#dc2626';
	};

	const metrics = [
		{ label: '유저 성장', value: healthScore.userGrowth, icon: <PeopleIcon fontSize="small" /> },
		{ label: '리텐션', value: healthScore.retention, icon: <TrendingUpIcon fontSize="small" /> },
		{ label: '매출', value: healthScore.revenue, icon: <MoneyIcon fontSize="small" /> },
		{ label: '매칭 품질', value: healthScore.matchingQuality, icon: <HeartIcon fontSize="small" /> },
		{ label: '만족도', value: healthScore.userSatisfaction, icon: <SatisfactionIcon fontSize="small" /> },
	];

	return (
		<Paper sx={{ p: 3 }}>
			<Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
				<SpeedIcon sx={{ color: getScoreColor(healthScore.overall), fontSize: 32 }} />
				<Box>
					<Typography variant="h6" fontWeight="bold">
						서비스 건강 점수
					</Typography>
					<Typography variant="caption" color="text.secondary">
						주요 지표 기반 종합 점수
					</Typography>
				</Box>
				<Box sx={{ ml: 'auto', textAlign: 'right' }}>
					<Typography
						variant="h3"
						fontWeight="bold"
						sx={{ color: getScoreColor(healthScore.overall) }}
					>
						{healthScore.overall}
					</Typography>
					<Typography variant="caption" color="text.secondary">
						/ 100
					</Typography>
				</Box>
			</Box>

			<Grid container spacing={2}>
				{metrics.map((metric) => (
					<Grid item xs={6} sm={4} md={2.4} key={metric.label}>
						<Box sx={{ textAlign: 'center' }}>
							<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 0.5 }}>
								<Box sx={{ color: getScoreColor(metric.value), mr: 0.5 }}>{metric.icon}</Box>
								<Typography variant="caption" color="text.secondary">
									{metric.label}
								</Typography>
							</Box>
							<Typography variant="h6" fontWeight="bold" sx={{ color: getScoreColor(metric.value) }}>
								{metric.value}
							</Typography>
							<LinearProgress
								variant="determinate"
								value={metric.value}
								sx={{
									height: 4,
									borderRadius: 2,
									bgcolor: 'grey.200',
									'& .MuiLinearProgress-bar': {
										bgcolor: getScoreColor(metric.value),
										borderRadius: 2,
									},
								}}
							/>
						</Box>
					</Grid>
				))}
			</Grid>
		</Paper>
	);
}

interface UrgentActionsProps {
	actions: UrgentAction[];
}

function UrgentActions({ actions }: UrgentActionsProps) {
	if (actions.length === 0) return null;

	return (
		<Paper sx={{ p: 3, border: '2px solid #dc2626', bgcolor: '#fef2f2' }}>
			<Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
				<ErrorIcon sx={{ color: '#dc2626' }} />
				<Typography variant="h6" fontWeight="bold" color="#dc2626">
					긴급 조치 필요
				</Typography>
				<Chip
					label={`${actions.length}건`}
					size="small"
					sx={{ bgcolor: '#dc2626', color: 'white', fontWeight: 600 }}
				/>
			</Box>

			<Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
				{actions.map((action, index) => (
					<Link href={action.actionUrl} key={index}>
						<Card
							sx={{
								cursor: 'pointer',
								transition: 'all 0.2s',
								'&:hover': { transform: 'translateY(-2px)', boxShadow: 2 },
							}}
						>
							<CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
								<Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
									<Box>
										<Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
											<Chip
												label={action.urgency === 'critical' ? '긴급' : '주의'}
												size="small"
												sx={{
													bgcolor: action.urgency === 'critical' ? '#dc2626' : '#f59e0b',
													color: 'white',
													fontWeight: 600,
													fontSize: '0.7rem',
												}}
											/>
											<Typography variant="subtitle2" fontWeight="bold">
												{action.title}
											</Typography>
										</Box>
										<Typography variant="body2" color="text.secondary">
											{action.description}
										</Typography>
										{action.deadlineHours && (
											<Typography variant="caption" color="error">
												⏰ {action.deadlineHours}시간 내 처리 필요
											</Typography>
										)}
									</Box>
									<Typography variant="h5" fontWeight="bold" color="error">
										{action.count}
									</Typography>
								</Box>
							</CardContent>
						</Card>
					</Link>
				))}
			</Box>
		</Paper>
	);
}

interface InsightsListProps {
	insights: ActionableInsight[];
}

function InsightsList({ insights }: InsightsListProps) {
	const [expanded, setExpanded] = useState<string | null>(null);

	if (insights.length === 0) {
		return (
			<Paper sx={{ p: 3 }}>
				<Typography variant="body1" color="text.secondary" textAlign="center">
					현재 주요 인사이트가 없습니다. 서비스가 안정적으로 운영되고 있습니다.
				</Typography>
			</Paper>
		);
	}

	return (
		<Paper sx={{ p: 3 }}>
			<Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
				<LightbulbIcon sx={{ color: '#f59e0b' }} />
				<Typography variant="h6" fontWeight="bold">
					주요 인사이트
				</Typography>
			</Box>

			<Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
				{insights.map((insight) => {
					const config = SEVERITY_CONFIG[insight.severity];
					const isExpanded = expanded === insight.id;

					return (
						<Card key={insight.id} sx={{ border: `1px solid ${config.color}20` }}>
							<CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
								<Box
									sx={{ display: 'flex', alignItems: 'flex-start', cursor: 'pointer' }}
									onClick={() => setExpanded(isExpanded ? null : insight.id)}
								>
									<Box sx={{ p: 1, borderRadius: 1, bgcolor: config.bgColor, color: config.color, mr: 2 }}>
										{config.icon}
									</Box>
									<Box sx={{ flex: 1 }}>
										<Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
											<Typography variant="subtitle2" fontWeight="bold">
												{insight.title}
											</Typography>
											<Chip
												label={INSIGHT_CATEGORY_LABELS[insight.category]}
												size="small"
												variant="outlined"
												sx={{ fontSize: '0.65rem', height: 20 }}
											/>
										</Box>
										<Typography variant="body2" color="text.secondary">
											{insight.description}
										</Typography>
										{insight.changeRate !== undefined && (
											<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
												{insight.changeRate >= 0 ? (
													<TrendingUpIcon fontSize="small" color="success" />
												) : (
													<TrendingDownIcon fontSize="small" color="error" />
												)}
												<Typography
													variant="caption"
													color={insight.changeRate >= 0 ? 'success.main' : 'error.main'}
													fontWeight="bold"
												>
													{insight.changeRate > 0 ? '+' : ''}{insight.changeRate}%
												</Typography>
											</Box>
										)}
									</Box>
									<IconButton size="small">
										{isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
									</IconButton>
								</Box>

								<Collapse in={isExpanded}>
									<Box sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
										<Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>
											권장 조치
										</Typography>
										<Box sx={{ pl: 2 }}>
											{insight.recommendations.map((rec, i) => (
												<Typography key={i} variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
													• {rec}
												</Typography>
											))}
										</Box>
										{insight.affectedUsers > 0 && (
											<Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
												영향 받는 유저: {insight.affectedUsers.toLocaleString()}명
											</Typography>
										)}
										{insight.potentialRevenueImpact && (
											<Typography variant="caption" color="error" sx={{ display: 'block' }}>
												예상 매출 영향: ₩{insight.potentialRevenueImpact.toLocaleString()}
											</Typography>
										)}
										{insight.relatedDashboard && (
											<Link href={insight.relatedDashboard}>
												<Typography
													variant="caption"
													sx={{ color: 'primary.main', textDecoration: 'underline', cursor: 'pointer' }}
												>
													관련 대시보드 보기 →
												</Typography>
											</Link>
										)}
									</Box>
								</Collapse>
							</CardContent>
						</Card>
					);
				})}
			</Box>
		</Paper>
	);
}

interface BottlenecksListProps {
	bottlenecks: FunnelBottleneck[];
}

function BottlenecksList({ bottlenecks }: BottlenecksListProps) {
	if (bottlenecks.length === 0) return null;

	return (
		<Paper sx={{ p: 3 }}>
			<Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
				퍼널 병목 지점
			</Typography>

			<Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
				{bottlenecks.map((bottleneck, index) => {
					const gap = bottleneck.benchmarkRate - bottleneck.conversionRate;
					const severity = gap > 20 ? 'critical' : gap > 10 ? 'warning' : 'info';
					const config = SEVERITY_CONFIG[severity];

					return (
						<Box
							key={index}
							sx={{ p: 2, borderRadius: 1, bgcolor: config.bgColor, border: `1px solid ${config.color}40` }}
						>
							<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
								<Typography variant="subtitle2" fontWeight="bold">
									{bottleneck.stage}
								</Typography>
								<Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
									<Tooltip title="현재 전환율">
										<Typography variant="h6" fontWeight="bold" sx={{ color: config.color }}>
											{bottleneck.conversionRate}%
										</Typography>
									</Tooltip>
									<Typography variant="body2" color="text.secondary">
										/ 기준 {bottleneck.benchmarkRate}%
									</Typography>
								</Box>
							</Box>

							<LinearProgress
								variant="determinate"
								value={(bottleneck.conversionRate / bottleneck.benchmarkRate) * 100}
								sx={{
									height: 8,
									borderRadius: 4,
									bgcolor: 'white',
									mb: 1,
									'& .MuiLinearProgress-bar': { bgcolor: config.color, borderRadius: 4 },
								}}
							/>

							<Typography variant="caption" color="text.secondary">
								이탈 유저: {bottleneck.droppedUsers.toLocaleString()}명
							</Typography>

							<Box sx={{ mt: 1 }}>
								<Typography variant="caption" fontWeight="bold">
									예상 원인:
								</Typography>
								<Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
									{bottleneck.possibleCauses.map((cause, i) => (
										<Chip key={i} label={cause} size="small" variant="outlined" sx={{ fontSize: '0.65rem' }} />
									))}
								</Box>
							</Box>
						</Box>
					);
				})}
			</Box>
		</Paper>
	);
}

interface PainPointsListProps {
	painPoints: UserPainPoint[];
}

function PainPointsList({ painPoints }: PainPointsListProps) {
	if (painPoints.length === 0) return null;

	return (
		<Paper sx={{ p: 3 }}>
			<Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
				유저 페인포인트
			</Typography>

			<Grid container spacing={2}>
				{painPoints.map((point) => (
					<Grid item xs={12} md={4} key={point.id}>
						<Card sx={{ height: '100%', border: '1px solid', borderColor: 'divider' }}>
							<CardContent>
								<Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>
									{point.description}
								</Typography>

								<Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, mb: 2 }}>
									<Typography variant="h4" fontWeight="bold" color="error">
										{point.affectedUsers.toLocaleString()}
									</Typography>
									<Typography variant="body2" color="text.secondary">
										명 ({point.percentage}%)
									</Typography>
								</Box>

								{point.avgWaitDays !== undefined && (
									<Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
										평균 대기 기간: {point.avgWaitDays}일
									</Typography>
								)}

								<Box sx={{ mb: 2 }}>
									<Typography variant="caption" color="text.secondary">
										이탈 위험도
									</Typography>
									<LinearProgress
										variant="determinate"
										value={point.churnRisk}
										sx={{
											height: 6,
											borderRadius: 3,
											bgcolor: 'grey.200',
											'& .MuiLinearProgress-bar': {
												bgcolor: point.churnRisk >= 70 ? '#dc2626' : point.churnRisk >= 50 ? '#f59e0b' : '#22c55e',
												borderRadius: 3,
											},
										}}
									/>
									<Typography variant="caption" fontWeight="bold" color={point.churnRisk >= 70 ? 'error' : 'text.secondary'}>
										{point.churnRisk}%
									</Typography>
								</Box>

								<Typography variant="caption" fontWeight="bold" sx={{ display: 'block', mb: 0.5 }}>
									개선 방안:
								</Typography>
								{point.solutions.slice(0, 2).map((solution, i) => (
									<Typography key={i} variant="caption" color="text.secondary" sx={{ display: 'block' }}>
										• {solution}
									</Typography>
								))}
							</CardContent>
						</Card>
					</Grid>
				))}
			</Grid>
		</Paper>
	);
}

export default function ActionableInsights() {
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [data, setData] = useState<ActionableInsightsResponse | null>(null);
	const [showDetails, setShowDetails] = useState(true);

	const fetchData = useCallback(async () => {
		try {
			setLoading(true);
			setError(null);
			const response = await dashboardService.getActionableInsights();
			setData(response);
		} catch (err) {
			console.error('실행 가능한 인사이트 조회 실패:', err);
			setError('인사이트 데이터를 불러오는데 실패했습니다.');
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		fetchData();
	}, [fetchData]);

	if (loading) {
		return (
			<Paper sx={{ p: 3 }}>
				<Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
					<CircularProgress size={24} />
					<Typography variant="body2" sx={{ ml: 2 }}>
						인사이트 분석 중...
					</Typography>
				</Box>
			</Paper>
		);
	}

	if (error) {
		return (
			<Alert severity="error" sx={{ mb: 2 }}>
				{error}
			</Alert>
		);
	}

	if (!data) return null;

	return (
		<Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
			<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
				<Box>
					<Typography variant="h5" fontWeight="bold">
						실행 가능한 인사이트
					</Typography>
					<Typography variant="caption" color="text.secondary">
						{data.period.startDate} ~ {data.period.endDate} 기준
					</Typography>
				</Box>
				<IconButton onClick={() => setShowDetails(!showDetails)}>
					{showDetails ? <ExpandLessIcon /> : <ExpandMoreIcon />}
				</IconButton>
			</Box>

			<Paper sx={{ p: 2, bgcolor: data.healthScore.overall >= 70 ? '#f0fdf4' : data.healthScore.overall >= 50 ? '#fffbeb' : '#fef2f2' }}>
				<Typography variant="body2" fontWeight="medium">
					{data.summary}
				</Typography>
			</Paper>

			<HealthScoreGauge healthScore={data.healthScore} />

			<Collapse in={showDetails}>
				<Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
					<UrgentActions actions={data.urgentActions} />
					<InsightsList insights={data.insights} />
					<BottlenecksList bottlenecks={data.funnelBottlenecks} />
					<PainPointsList painPoints={data.userPainPoints} />
				</Box>
			</Collapse>
		</Box>
	);
}
