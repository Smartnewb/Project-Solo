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
	Button,
	Checkbox,
	Chip,
	CircularProgress,
	Typography,
	Pagination,
} from '@mui/material';
import { useGhostAccountCandidates, useApproveCandidates, useCancelCandidates } from '@/app/admin/hooks';
import type { GhostCandidateStatus, GhostAccountStatus } from '@/types/ghost-account';
import { useConfirm } from '@/shared/ui/admin/confirm-dialog';
import { useToast } from '@/shared/ui/admin/toast';
import { safeToLocaleString } from '@/app/utils/formatters';

const CANDIDATE_STATUS_CHIP: Record<GhostCandidateStatus, { label: string; color: 'warning' | 'info' | 'success' | 'default' }> = {
	PENDING: { label: '대기', color: 'warning' },
	QUEUED: { label: '예약됨', color: 'info' },
	SENT: { label: '발송완료', color: 'success' },
	CANCELLED: { label: '취소됨', color: 'default' },
};

const GHOST_STATUS_CHIP: Record<GhostAccountStatus, { label: string; color: 'success' | 'default' | 'error' }> = {
	ACTIVE: { label: '활성', color: 'success' },
	INACTIVE: { label: '비활성', color: 'default' },
	EXHAUSTED: { label: '소진', color: 'error' },
};

const LIMIT = 20;

export default function CandidatesTab() {
	const [page, setPage] = useState(1);
	const [selectedIds, setSelectedIds] = useState<string[]>([]);

	const { data, isLoading, error } = useGhostAccountCandidates({ page, limit: LIMIT });
	const approve = useApproveCandidates();
	const cancel = useCancelCandidates();
	const confirm = useConfirm();
	const toast = useToast();

	const items = data?.items ?? [];
	const pendingItems = items.filter((item) => item.candidate.status === 'PENDING');
	const totalPages = data ? Math.ceil(data.meta.totalItems / data.meta.itemsPerPage) : 0;

	const handleSelectAll = (checked: boolean) => {
		setSelectedIds(checked ? pendingItems.map((item) => item.candidate.id) : []);
	};

	const handleSelectOne = (candidateId: string, status: GhostCandidateStatus) => {
		if (status !== 'PENDING') return;
		setSelectedIds((prev) =>
			prev.includes(candidateId)
				? prev.filter((id) => id !== candidateId)
				: [...prev, candidateId],
		);
	};

	const handleApprove = async () => {
		if (selectedIds.length === 0) return;
		const ok = await confirm({ message: `선택한 ${selectedIds.length}건을 승인하시겠습니까?` });
		if (!ok) return;
		try {
			const result = await approve.mutateAsync(selectedIds);
			setSelectedIds([]);
			if (result.failed > 0) {
				toast.error(`${result.scheduled}건 승인 완료, ${result.failed}건 실패`);
			} else {
				toast.success(`${result.scheduled}건 승인 완료`);
			}
		} catch (err) {
			toast.error(`승인 실패: ${(err as Error).message}`);
		}
	};

	const handleCancel = async () => {
		if (selectedIds.length === 0) return;
		const ok = await confirm({
			message: `선택한 ${selectedIds.length}건을 취소하시겠습니까?`,
			severity: 'warning',
		});
		if (!ok) return;
		try {
			const result = await cancel.mutateAsync(selectedIds);
			setSelectedIds([]);
			toast.info(`${result.cancelled}건 취소 완료`);
		} catch (err) {
			toast.error(`취소 실패: ${(err as Error).message}`);
		}
	};

	const isProcessing = approve.isPending || cancel.isPending;

	return (
		<Box>
			{selectedIds.length > 0 && (
				<Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
					<Chip label={`${selectedIds.length}건 선택됨`} color="primary" />
					<Button
						variant="contained"
						color="success"
						size="small"
						onClick={handleApprove}
						disabled={isProcessing}
					>
						{approve.isPending ? <CircularProgress size={16} sx={{ mr: 1 }} /> : null}
						승인
					</Button>
					<Button
						variant="outlined"
						color="error"
						size="small"
						onClick={handleCancel}
						disabled={isProcessing}
					>
						{cancel.isPending ? <CircularProgress size={16} sx={{ mr: 1 }} /> : null}
						취소
					</Button>
				</Box>
			)}

			{isLoading && (
				<Box display="flex" justifyContent="center" py={4}>
					<CircularProgress />
				</Box>
			)}

			{error && (
				<Typography color="error">
					후보 목록을 불러오는데 실패했습니다: {(error as Error).message}
				</Typography>
			)}

			{data && (
				<>
					<TableContainer component={Paper}>
						<Table size="small">
							<TableHead>
								<TableRow>
									<TableCell padding="checkbox">
										<Checkbox
											indeterminate={selectedIds.length > 0 && selectedIds.length < pendingItems.length}
											checked={pendingItems.length > 0 && selectedIds.length === pendingItems.length}
											onChange={(e) => handleSelectAll(e.target.checked)}
											disabled={pendingItems.length === 0}
										/>
									</TableCell>
									<TableCell>Ghost 계정</TableCell>
									<TableCell>타겟 유저</TableCell>
									<TableCell>후보 상태</TableCell>
									<TableCell>Ghost 상태</TableCell>
									<TableCell>주차</TableCell>
									<TableCell>생성일</TableCell>
								</TableRow>
							</TableHead>
							<TableBody>
								{items.length === 0 && (
									<TableRow>
										<TableCell colSpan={7} align="center">
											<Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
												후보가 없습니다
											</Typography>
										</TableCell>
									</TableRow>
								)}
								{items.map((item) => {
									const candidateChip = CANDIDATE_STATUS_CHIP[item.candidate.status];
									const ghostChip = GHOST_STATUS_CHIP[item.ghostAccountStatus];
									const isPending = item.candidate.status === 'PENDING';

									return (
										<TableRow key={item.candidate.id}>
											<TableCell padding="checkbox">
												<Checkbox
													checked={selectedIds.includes(item.candidate.id)}
													onChange={() => handleSelectOne(item.candidate.id, item.candidate.status)}
													disabled={!isPending}
												/>
											</TableCell>
											<TableCell>{item.candidate.ghostAccountId.slice(0, 8)}...</TableCell>
											<TableCell>{item.targetUserName}</TableCell>
											<TableCell>
												<Chip label={candidateChip.label} color={candidateChip.color} size="small" />
											</TableCell>
											<TableCell>
												<Chip label={ghostChip.label} color={ghostChip.color} size="small" variant="outlined" />
											</TableCell>
											<TableCell>{item.candidate.weekYear}</TableCell>
											<TableCell>
												{safeToLocaleString(item.candidate.createdAt, 'ko-KR', {
													year: 'numeric',
													month: '2-digit',
													day: '2-digit',
													hour: '2-digit',
													minute: '2-digit',
												}, '-')}
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
								onChange={(_, value) => {
									setPage(value);
									setSelectedIds([]);
								}}
								color="primary"
							/>
						</Box>
					)}
				</>
			)}
		</Box>
	);
}
