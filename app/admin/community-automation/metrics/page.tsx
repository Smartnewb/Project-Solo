'use client';

import { useCallback, useEffect, useState } from 'react';
import {
	Alert,
	Box,
	Card,
	CardContent,
	CircularProgress,
	Divider,
	Grid,
	Paper,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	TextField,
	Typography,
} from '@mui/material';
import type { MetricsSummary, QueueDepth } from '@/app/services/admin/community-automation';
import { metrics as metricsApi } from '@/app/services/admin/community-automation';

function StatCard({ label, value, color }: { label: string; value: number; color?: string }) {
	return (
		<Card variant="outlined">
			<CardContent>
				<Typography variant="caption" color="text.secondary">{label}</Typography>
				<Typography variant="h4" fontWeight={700} color={color ?? 'text.primary'}>{value}</Typography>
			</CardContent>
		</Card>
	);
}

export default function MetricsPage() {
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [summary, setSummary] = useState<MetricsSummary | null>(null);
	const [depth, setDepth] = useState<QueueDepth | null>(null);

	const today = new Date();
	const thirtyDaysAgo = new Date(today);
	thirtyDaysAgo.setDate(today.getDate() - 30);

	const [from, setFrom] = useState(thirtyDaysAgo.toISOString().split('T')[0]);
	const [to, setTo] = useState(today.toISOString().split('T')[0]);

	const load = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const [s, d] = await Promise.all([
				metricsApi.summary(from ? `${from}T00:00:00Z` : undefined, to ? `${to}T23:59:59Z` : undefined),
				metricsApi.queueDepth(),
			]);
			setSummary(s);
			setDepth(d);
		} catch (e: unknown) {
			setError(e instanceof Error ? e.message : '불러오기 실패');
		} finally {
			setLoading(false);
		}
	}, [from, to]);

	useEffect(() => {
		load();
	}, [load]);

	return (
		<Box>
			<Box display="flex" gap={2} alignItems="center" mb={3}>
				<TextField
					label="시작일"
					type="date"
					size="small"
					InputLabelProps={{ shrink: true }}
					value={from}
					onChange={(e) => setFrom(e.target.value)}
				/>
				<TextField
					label="종료일"
					type="date"
					size="small"
					InputLabelProps={{ shrink: true }}
					value={to}
					onChange={(e) => setTo(e.target.value)}
				/>
			</Box>

			{error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

			{loading ? (
				<Box display="flex" justifyContent="center" py={6}>
					<CircularProgress />
				</Box>
			) : summary && depth ? (
				<>
					<Typography variant="h6" mb={1}>전체 현황</Typography>
					<Grid container spacing={2} mb={3}>
						<Grid item xs={6} sm={3}>
							<StatCard label="발화됨" value={summary.totalPublished} color="success.main" />
						</Grid>
						<Grid item xs={6} sm={3}>
							<StatCard label="검수 대기" value={summary.totalPendingReview} color="warning.main" />
						</Grid>
						<Grid item xs={6} sm={3}>
							<StatCard label="거절됨" value={summary.totalRejected} color="error.main" />
						</Grid>
						<Grid item xs={6} sm={3}>
							<StatCard label="회수됨" value={summary.totalWithdrawn} />
						</Grid>
					</Grid>

					<Typography variant="h6" mb={1}>큐 깊이</Typography>
					<Grid container spacing={2} mb={3}>
						<Grid item xs={6} sm={3}>
							<StatCard label="검수 대기" value={depth.pending_review} color="warning.main" />
						</Grid>
						<Grid item xs={6} sm={3}>
							<StatCard label="예약됨" value={depth.scheduled} color="info.main" />
						</Grid>
						<Grid item xs={6} sm={3}>
							<StatCard label="초안" value={depth.draft} />
						</Grid>
						<Grid item xs={6} sm={3}>
							<StatCard label="품질 실패" value={depth.quality_failed} color="error.main" />
						</Grid>
					</Grid>

					<Divider sx={{ my: 2 }} />

					<Typography variant="h6" mb={1}>상태별 콘텐츠 수</Typography>
					<TableContainer component={Paper} sx={{ mb: 3 }}>
						<Table size="small">
							<TableHead>
								<TableRow>
									<TableCell>상태</TableCell>
									<TableCell align="right">수량</TableCell>
								</TableRow>
							</TableHead>
							<TableBody>
								{summary.contentByStatus.map((row) => (
									<TableRow key={row.status}>
										<TableCell>{row.status}</TableCell>
										<TableCell align="right">{row.count}</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</TableContainer>

					<Typography variant="h6" mb={1}>일별 통계</Typography>
					<TableContainer component={Paper}>
						<Table size="small">
							<TableHead>
								<TableRow>
									<TableCell>날짜</TableCell>
									<TableCell align="right">발화됨</TableCell>
									<TableCell align="right">거절됨</TableCell>
									<TableCell align="right">회수됨</TableCell>
								</TableRow>
							</TableHead>
							<TableBody>
								{summary.dailyStats.length === 0 ? (
									<TableRow>
										<TableCell colSpan={4} align="center">데이터 없음</TableCell>
									</TableRow>
								) : summary.dailyStats.map((row) => (
									<TableRow key={row.date}>
										<TableCell>{row.date}</TableCell>
										<TableCell align="right">{row.published}</TableCell>
										<TableCell align="right">{row.rejected}</TableCell>
										<TableCell align="right">{row.withdrawn}</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</TableContainer>
				</>
			) : null}
		</Box>
	);
}
