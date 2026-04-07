'use client';

import { useState } from 'react';
import {
	Box,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	Paper,
	Chip,
	CircularProgress,
	Typography,
	Pagination,
	ToggleButtonGroup,
	ToggleButton,
	Select,
	MenuItem,
	type SelectChangeEvent,
} from '@mui/material';
import { useGhostAccountPool, useUpdateGhostAccountStatus } from '@/app/admin/hooks';
import type { GhostAccountStatus } from '@/types/ghost-account';
import { useToast } from '@/shared/ui/admin/toast';
import { safeToLocaleString } from '@/app/utils/formatters';

const STATUS_CHIP: Record<GhostAccountStatus, { label: string; color: 'success' | 'default' | 'error' }> = {
	ACTIVE: { label: '활성', color: 'success' },
	INACTIVE: { label: '비활성', color: 'default' },
	EXHAUSTED: { label: '소진', color: 'error' },
};

const LIMIT = 20;

export default function PoolTab() {
	const [page, setPage] = useState(1);
	const [statusFilter, setStatusFilter] = useState<GhostAccountStatus | 'ALL'>('ALL');

	const { data, isLoading, error } = useGhostAccountPool({
		status: statusFilter === 'ALL' ? undefined : statusFilter,
		page,
		limit: LIMIT,
	});

	const updateStatus = useUpdateGhostAccountStatus();
	const toast = useToast();

	const handleStatusChange = (id: string, e: SelectChangeEvent) => {
		const newStatus = e.target.value as GhostAccountStatus;
		updateStatus.mutate(
			{ id, status: newStatus },
			{
				onSuccess: () => toast.success('상태가 변경되었습니다'),
				onError: (err) => toast.error(`상태 변경 실패: ${err.message}`),
			},
		);
	};

	const totalPages = data ? Math.ceil(data.meta.totalItems / data.meta.itemsPerPage) : 0;

	return (
		<Box>
			<Box sx={{ mb: 2 }}>
				<ToggleButtonGroup
					value={statusFilter}
					exclusive
					onChange={(_, v) => {
						if (v !== null) {
							setStatusFilter(v);
							setPage(1);
						}
					}}
					size="small"
				>
					<ToggleButton value="ALL">전체</ToggleButton>
					<ToggleButton value="ACTIVE">활성</ToggleButton>
					<ToggleButton value="INACTIVE">비활성</ToggleButton>
					<ToggleButton value="EXHAUSTED">소진</ToggleButton>
				</ToggleButtonGroup>
			</Box>

			{isLoading && (
				<Box display="flex" justifyContent="center" py={4}>
					<CircularProgress />
				</Box>
			)}

			{error && (
				<Typography color="error">
					Ghost 풀을 불러오는데 실패했습니다: {(error as Error).message}
				</Typography>
			)}

			{data && (
				<>
					<TableContainer component={Paper}>
						<Table size="small">
							<TableHead>
								<TableRow>
									<TableCell>이름</TableCell>
									<TableCell>나이</TableCell>
									<TableCell>MBTI</TableCell>
									<TableCell>등급</TableCell>
									<TableCell>상태</TableCell>
									<TableCell>활성화일</TableCell>
									<TableCell>상태 변경</TableCell>
								</TableRow>
							</TableHead>
							<TableBody>
								{data.items.length === 0 && (
									<TableRow>
										<TableCell colSpan={7} align="center">
											<Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
												Ghost 계정이 없습니다
											</Typography>
										</TableCell>
									</TableRow>
								)}
								{data.items.map((ghost) => {
									const chip = STATUS_CHIP[ghost.status];
									return (
										<TableRow key={ghost.id}>
											<TableCell>{ghost.profileSnapshot.name}</TableCell>
											<TableCell>{ghost.profileSnapshot.age}</TableCell>
											<TableCell>{ghost.profileSnapshot.mbti ?? '-'}</TableCell>
											<TableCell>{ghost.profileSnapshot.rank ?? '-'}</TableCell>
											<TableCell>
												<Chip label={chip.label} color={chip.color} size="small" />
											</TableCell>
											<TableCell>
												{safeToLocaleString(ghost.activatedAt, 'ko-KR', {
													year: 'numeric',
													month: '2-digit',
													day: '2-digit',
												}, '-')}
											</TableCell>
											<TableCell>
												<Select
													value={ghost.status}
													onChange={(e) => handleStatusChange(ghost.id, e)}
													size="small"
													sx={{ minWidth: 100 }}
													disabled={updateStatus.isPending}
												>
													<MenuItem value="ACTIVE">활성</MenuItem>
													<MenuItem value="INACTIVE">비활성</MenuItem>
													<MenuItem value="EXHAUSTED">소진</MenuItem>
												</Select>
											</TableCell>
										</TableRow>
									);
								})}
							</TableBody>
						</Table>
					</TableContainer>

					{totalPages > 1 && (
						<Box display="flex" justifyContent="center" sx={{ mt: 2 }}>
							<Pagination
								count={totalPages}
								page={page}
								onChange={(_, value) => setPage(value)}
								color="primary"
							/>
						</Box>
					)}
				</>
			)}
		</Box>
	);
}
