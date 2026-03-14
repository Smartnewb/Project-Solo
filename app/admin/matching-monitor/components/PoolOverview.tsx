'use client';

import {
	Box,
	Card,
	CardContent,
	Typography,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	LinearProgress,
	Chip,
} from '@mui/material';
import type { PoolOverview as PoolOverviewType, SegmentStat } from '../types';

const PROGRESS_SX = {
	height: 8,
	borderRadius: 1,
	bgcolor: '#fce7f3',
	'& .MuiLinearProgress-bar': { bgcolor: '#3b82f6' },
} as const;

interface Props {
	pool: PoolOverviewType;
	segments: SegmentStat[];
}

export default function PoolOverviewSection({ pool, segments }: Props) {
	const maleCount = pool.male.maleCount;
	const femaleCount = pool.female.femaleCount;
	const total = maleCount + femaleCount;
	const malePercent = total > 0 ? (maleCount / total) * 100 : 50;

	return (
		<Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
			<Card sx={{ flex: 1, minWidth: 340 }}>
				<CardContent>
					<Typography variant="subtitle1" fontWeight={700} gutterBottom>
						매칭 풀 현황
					</Typography>

					<Box sx={{ mb: 2 }}>
						<Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
							<Typography variant="body2" color="primary">
								남성 {maleCount.toLocaleString()}명
							</Typography>
							<Typography variant="body2" color="error">
								여성 {femaleCount.toLocaleString()}명
							</Typography>
						</Box>
						<Box sx={{ display: 'flex', height: 12, borderRadius: 1, overflow: 'hidden' }}>
							<Box sx={{ width: `${malePercent}%`, bgcolor: '#3b82f6' }} />
							<Box sx={{ width: `${100 - malePercent}%`, bgcolor: '#ec4899' }} />
						</Box>
						<Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
							성비 {pool.male.genderRatio}
						</Typography>
					</Box>

					<Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
						{Object.entries(pool.byRank).map(([rank, count]) => (
							<Chip
								key={rank}
								label={`${rank}: ${count.toLocaleString()}`}
								size="small"
								variant="outlined"
							/>
						))}
					</Box>

					{pool.prefOptionZeroCount > 0 && (
						<Typography variant="body2" color="warning.main">
							온보딩 미완료 (선호 0개): {pool.prefOptionZeroCount}명
						</Typography>
					)}
				</CardContent>
			</Card>

			<Card sx={{ flex: 1, minWidth: 340 }}>
				<CardContent>
					<Typography variant="subtitle1" fontWeight={700} gutterBottom>
						랭크별 성별 분포
					</Typography>
					<TableContainer>
						<Table size="small">
							<TableHead>
								<TableRow>
									<TableCell>랭크</TableCell>
									<TableCell align="right">남성</TableCell>
									<TableCell align="right">여성</TableCell>
									<TableCell align="right">합계</TableCell>
									<TableCell sx={{ width: 120 }}>비율</TableCell>
								</TableRow>
							</TableHead>
							<TableBody>
								{segments.map((seg) => {
									const segTotal = seg.maleCount + seg.femaleCount;
									const malePct = segTotal > 0 ? (seg.maleCount / segTotal) * 100 : 50;
									return (
										<TableRow key={seg.rank}>
											<TableCell>
												<Chip label={seg.rank} size="small" />
											</TableCell>
											<TableCell align="right">{seg.maleCount.toLocaleString()}</TableCell>
											<TableCell align="right">{seg.femaleCount.toLocaleString()}</TableCell>
											<TableCell align="right">{segTotal.toLocaleString()}</TableCell>
											<TableCell>
												<LinearProgress
													variant="determinate"
													value={malePct}
													sx={PROGRESS_SX}
												/>
											</TableCell>
										</TableRow>
									);
								})}
							</TableBody>
						</Table>
					</TableContainer>
				</CardContent>
			</Card>
		</Box>
	);
}
