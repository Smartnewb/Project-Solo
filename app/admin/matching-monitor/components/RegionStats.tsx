'use client';

import {
	Card,
	CardContent,
	Typography,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	Chip,
} from '@mui/material';
import type { RegionStat } from '../types';

export default function RegionStats({ data }: { data: RegionStat[] }) {
	return (
		<Card>
			<CardContent>
				<Typography variant="subtitle1" fontWeight={700} gutterBottom>
					지역별 매칭 실패 현황
				</Typography>
				<TableContainer>
					<Table size="small">
						<TableHead>
							<TableRow>
								<TableCell>지역</TableCell>
								<TableCell align="right">실패 건수</TableCell>
								<TableCell align="right">후보 0명</TableCell>
								<TableCell align="right">지역 내 풀</TableCell>
								<TableCell align="right">광역 풀</TableCell>
								<TableCell align="right">전국 풀</TableCell>
							</TableRow>
						</TableHead>
						<TableBody>
							{data.length === 0 ? (
								<TableRow>
									<TableCell colSpan={6} align="center" sx={{ py: 4, color: 'text.secondary' }}>
										데이터 없음
									</TableCell>
								</TableRow>
							) : (
								data.map((region) => (
									<TableRow key={region.region}>
										<TableCell>{region.region}</TableCell>
										<TableCell align="right">
											<Chip
												label={region.failureCount.toLocaleString()}
												size="small"
												color={region.failureCount >= 10 ? 'error' : 'default'}
												variant="outlined"
											/>
										</TableCell>
										<TableCell align="right">
											{region.zeroCandidateCount > 0 ? (
												<Typography variant="body2" color="error.main" fontWeight={600}>
													{region.zeroCandidateCount}
												</Typography>
											) : (
												0
											)}
										</TableCell>
										<TableCell align="right">{region.avgPoolInRegion.toLocaleString()}</TableCell>
										<TableCell align="right">{region.avgPoolInMetro.toLocaleString()}</TableCell>
										<TableCell align="right">
											{region.avgPoolNationwide.toLocaleString()}
										</TableCell>
									</TableRow>
								))
							)}
						</TableBody>
					</Table>
				</TableContainer>
			</CardContent>
		</Card>
	);
}
