'use client';

import { useMemo } from 'react';
import { Box, Card, CardContent, Typography, Chip } from '@mui/material';
import {
	BarChart,
	Bar,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	ResponsiveContainer,
	Cell,
} from 'recharts';
import type { PipelineTransparency } from '../types';

const FILTER_COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#6366f1', '#ef4444'];

export default function PipelineAnalysis({ data }: { data: PipelineTransparency }) {
	const filterData = useMemo(
		() => [...data.byFilter].sort((a, b) => b.totalEliminated - a.totalEliminated).slice(0, 10),
		[data.byFilter],
	);

	const relaxData = useMemo(
		() => data.byRelaxationStep.map((s) => ({ name: `Step ${s.step}`, count: s.count })),
		[data.byRelaxationStep],
	);

	return (
		<Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
			<Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
				<StatCard label="총 실패 로그" value={data.totalFailureLogs} />
				<StatCard label="필터 전 평균 후보" value={data.avgCandidatesBeforeFilter} />
				<StatCard label="필터 후 평균 후보" value={data.avgCandidatesAfterFilter} />
				<StatCard label="후보 0명 건수" value={data.zeroCandidateCount} highlight={data.zeroCandidateCount > 0} />
			</Box>

			<Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
				<Card sx={{ flex: 2, minWidth: 400 }}>
					<CardContent>
						<Typography variant="subtitle1" fontWeight={700} gutterBottom>
							필터별 탈락 건수
						</Typography>
						{filterData.length > 0 ? (
							<ResponsiveContainer width="100%" height={300}>
								<BarChart data={filterData} layout="vertical" margin={{ left: 20, right: 20 }}>
									<CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
									<XAxis type="number" tick={{ fontSize: 12 }} />
									<YAxis
										type="category"
										dataKey="filterName"
										tick={{ fontSize: 11 }}
										width={160}
									/>
									<Tooltip
										formatter={(value: number) => [
											value.toLocaleString(),
											'탈락 건수',
										]}
									/>
									<Bar dataKey="totalEliminated" radius={[0, 4, 4, 0]}>
										{filterData.map((_, i) => (
											<Cell key={i} fill={FILTER_COLORS[i % FILTER_COLORS.length]} />
										))}
									</Bar>
								</BarChart>
							</ResponsiveContainer>
						) : (
							<Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
								데이터 없음
							</Typography>
						)}
					</CardContent>
				</Card>

				<Card sx={{ flex: 1, minWidth: 280 }}>
					<CardContent>
						<Typography variant="subtitle1" fontWeight={700} gutterBottom>
							릴랙세이션 단계 분포
						</Typography>
						{relaxData.length > 0 ? (
							<ResponsiveContainer width="100%" height={300}>
								<BarChart data={relaxData} margin={{ left: 0, right: 10 }}>
									<CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
									<XAxis dataKey="name" tick={{ fontSize: 12 }} />
									<YAxis tick={{ fontSize: 12 }} />
									<Tooltip />
									<Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
								</BarChart>
							</ResponsiveContainer>
						) : (
							<Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
								데이터 없음
							</Typography>
						)}
					</CardContent>
				</Card>
			</Box>
		</Box>
	);
}

function StatCard({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
	return (
		<Card sx={{ flex: 1, minWidth: 160 }}>
			<CardContent sx={{ textAlign: 'center', py: 2 }}>
				<Typography variant="caption" color="text.secondary">
					{label}
				</Typography>
				<Typography
					variant="h5"
					fontWeight={700}
					color={highlight ? 'error.main' : 'text.primary'}
				>
					{value.toLocaleString()}
				</Typography>
			</CardContent>
		</Card>
	);
}
