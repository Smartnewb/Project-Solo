'use client';

import { useState, useEffect } from 'react';
import {
	Box,
	Card,
	CardContent,
	Typography,
	TextField,
	Button,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	Chip,
	Alert,
	CircularProgress,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { safeFormat } from '@/app/utils/formatters';
import { useUserDiagnosis } from '../hooks';
import type { UserDiagnosisResponse } from '../types';

export default function UserDiagnosis({ initialUserId }: { initialUserId?: string }) {
	const [inputId, setInputId] = useState(initialUserId || '');
	const [searchId, setSearchId] = useState(initialUserId || '');

	useEffect(() => {
		if (initialUserId) {
			setInputId(initialUserId);
			setSearchId(initialUserId);
		}
	}, [initialUserId]);

	const { data, isLoading, error } = useUserDiagnosis(searchId);

	const handleSearch = () => {
		if (inputId.trim()) {
			setSearchId(inputId.trim());
		}
	};

	return (
		<Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
			<Card>
				<CardContent>
					<Typography variant="subtitle1" fontWeight={700} gutterBottom>
						유저 매칭 진단
					</Typography>
					<Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
						<TextField
							size="small"
							placeholder="유저 ID 입력"
							value={inputId}
							onChange={(e) => setInputId(e.target.value)}
							onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
							sx={{ flex: 1, maxWidth: 400 }}
						/>
						<Button
							variant="contained"
							startIcon={<SearchIcon />}
							onClick={handleSearch}
							disabled={!inputId.trim()}
						>
							진단
						</Button>
					</Box>
				</CardContent>
			</Card>

			{isLoading && (
				<Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
					<CircularProgress />
				</Box>
			)}

			{error && (
				<Alert severity="error">
					진단 조회 실패: {(error as Error).message}
				</Alert>
			)}

			{data && <DiagnosisResult data={data} />}
		</Box>
	);
}

function DiagnosisResult({ data }: { data: UserDiagnosisResponse }) {
	return (
		<Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
			<Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
				<Card sx={{ flex: 1, minWidth: 200 }}>
					<CardContent sx={{ textAlign: 'center' }}>
						<Typography variant="caption" color="text.secondary">
							30일 내 실패 횟수
						</Typography>
						<Typography variant="h4" fontWeight={700} color="error.main">
							{data.totalFailures30d}
						</Typography>
						<Typography variant="caption" color="text.secondary">
							{data.consecutiveFailureDays}일 연속
						</Typography>
					</CardContent>
				</Card>
				<Card sx={{ flex: 1, minWidth: 200 }}>
					<CardContent sx={{ textAlign: 'center' }}>
						<Typography variant="caption" color="text.secondary">
							이성 적격 유저
						</Typography>
						<Typography variant="h4" fontWeight={700} color="primary.main">
							{data.poolVisibility.eligibleOpponents.toLocaleString()}
						</Typography>
					</CardContent>
				</Card>
				<Card sx={{ flex: 1, minWidth: 200 }}>
					<CardContent sx={{ textAlign: 'center' }}>
						<Typography variant="caption" color="text.secondary">
							히스토리 제외
						</Typography>
						<Typography variant="h4" fontWeight={700} color="warning.main">
							{data.poolVisibility.excludedByHistory.toLocaleString()}
						</Typography>
					</CardContent>
				</Card>
				<Card sx={{ flex: 1, minWidth: 200 }}>
					<CardContent sx={{ textAlign: 'center' }}>
						<Typography variant="caption" color="text.secondary">
							실질 매칭 가능 풀
						</Typography>
						<Typography variant="h4" fontWeight={700} color="success.main">
							{data.poolVisibility.netEligible.toLocaleString()}
						</Typography>
					</CardContent>
				</Card>
			</Box>

			{data.dominantFailureReason && (
				<Alert severity="warning">
					주요 실패 사유: <strong>{data.dominantFailureReason}</strong>
				</Alert>
			)}

			<Card>
				<CardContent>
					<Typography variant="subtitle1" fontWeight={700} gutterBottom>
						최근 실패 이력 ({data.failureHistory.length}건)
					</Typography>
					<TableContainer sx={{ maxHeight: 500 }}>
						<Table size="small" stickyHeader>
							<TableHead>
								<TableRow>
									<TableCell>시각</TableCell>
									<TableCell>유형</TableCell>
									<TableCell>사유</TableCell>
									<TableCell>파이프라인</TableCell>
									<TableCell align="right">릴랙스</TableCell>
									<TableCell align="right">필터 전</TableCell>
									<TableCell align="right">필터 후</TableCell>
									<TableCell align="right">지역 풀</TableCell>
								</TableRow>
							</TableHead>
							<TableBody>
								{data.failureHistory.map((item, i) => (
									<TableRow key={i}>
										<TableCell>
											<Typography variant="caption">
												{safeFormat(item.failedAt, 'MM/dd HH:mm')}
											</Typography>
										</TableCell>
										<TableCell>
											<Chip label={item.matchType} size="small" variant="outlined" />
										</TableCell>
										<TableCell>
											<Typography
												variant="body2"
												sx={{
													maxWidth: 180,
													overflow: 'hidden',
													textOverflow: 'ellipsis',
													whiteSpace: 'nowrap',
												}}
												title={item.failureReason}
											>
												{item.failureReason}
											</Typography>
										</TableCell>
										<TableCell>
											<Typography variant="caption">{item.pipelineStep}</Typography>
										</TableCell>
										<TableCell align="right">{item.maxRelaxationLevel ?? '-'}</TableCell>
										<TableCell align="right">
											{item.candidatesBeforeFilter?.toLocaleString() ?? '-'}
										</TableCell>
										<TableCell align="right">
											{item.candidatesAfterFilter?.toLocaleString() ?? '-'}
										</TableCell>
										<TableCell align="right">
											{item.poolInRegion?.toLocaleString() ?? '-'}
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</TableContainer>
				</CardContent>
			</Card>
		</Box>
	);
}
