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
import { useGhostAccountEligibleSources, ghostAccountKeys } from '@/app/admin/hooks';
import { ghostAccount } from '@/app/services/admin/ghost-account';
import { useConfirm } from '@/shared/ui/admin/confirm-dialog';
import { useToast } from '@/shared/ui/admin/toast';
import { useQueryClient } from '@tanstack/react-query';
import { safeToLocaleString } from '@/app/utils/formatters';
import { AdminApiError } from '@/shared/lib/http/admin-fetch';

const LIMIT = 20;

export default function EligibleSourcesTab() {
	const [page, setPage] = useState(1);
	const [selectedIds, setSelectedIds] = useState<string[]>([]);
	const [bulkProcessing, setBulkProcessing] = useState(false);

	const { data, isLoading, error } = useGhostAccountEligibleSources({ page, limit: LIMIT });
	const confirm = useConfirm();
	const toast = useToast();
	const queryClient = useQueryClient();

	const items = data?.items ?? [];
	const totalPages = data ? Math.ceil(data.meta.totalItems / data.meta.itemsPerPage) : 0;

	const handleSelectAll = (checked: boolean) => {
		setSelectedIds(checked ? items.map((item) => item.userId) : []);
	};

	const handleSelectOne = (userId: string) => {
		setSelectedIds((prev) =>
			prev.includes(userId)
				? prev.filter((id) => id !== userId)
				: [...prev, userId],
		);
	};

	const invalidateAll = () => {
		queryClient.invalidateQueries({ queryKey: ghostAccountKeys.all });
	};

	const getErrorMessage = (err: unknown): string => {
		if (err instanceof AdminApiError) return err.message;
		return (err as Error).message;
	};

	const handleCreateSingle = async (userId: string) => {
		const ok = await confirm({ message: '이 유저를 Ghost 계정으로 생성하시겠습니까?' });
		if (!ok) return;
		try {
			await ghostAccount.create(userId);
			invalidateAll();
			toast.success('Ghost 계정이 생성되었습니다');
			setSelectedIds((prev) => prev.filter((id) => id !== userId));
		} catch (err) {
			toast.error(`생성 실패: ${getErrorMessage(err)}`);
		}
	};

	const handleBulkCreate = async () => {
		if (selectedIds.length === 0) return;
		const ok = await confirm({ message: `선택한 ${selectedIds.length}명을 Ghost 계정으로 생성하시겠습니까?` });
		if (!ok) return;

		setBulkProcessing(true);
		const results = await Promise.allSettled(
			selectedIds.map((userId) => ghostAccount.create(userId)),
		);
		setBulkProcessing(false);

		const successCount = results.filter((r) => r.status === 'fulfilled').length;
		const failCount = results.length - successCount;

		invalidateAll();
		setSelectedIds([]);

		if (failCount > 0) {
			toast.error(`${successCount}건 생성 완료, ${failCount}건 실패`);
		} else {
			toast.success(`${successCount}건 생성 완료`);
		}
	};

	return (
		<Box>
			{selectedIds.length > 0 && (
				<Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
					<Chip label={`${selectedIds.length}명 선택됨`} color="primary" />
					<Button
						variant="contained"
						size="small"
						onClick={handleBulkCreate}
						disabled={bulkProcessing}
					>
						{bulkProcessing ? <CircularProgress size={16} sx={{ mr: 1 }} /> : null}
						선택한 {selectedIds.length}명 일괄 생성
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
											indeterminate={selectedIds.length > 0 && selectedIds.length < items.length}
											checked={items.length > 0 && selectedIds.length === items.length}
											onChange={(e) => handleSelectAll(e.target.checked)}
											disabled={items.length === 0}
										/>
									</TableCell>
									<TableCell>이름</TableCell>
									<TableCell>나이</TableCell>
									<TableCell>등급</TableCell>
									<TableCell>MBTI</TableCell>
									<TableCell>탈퇴일</TableCell>
									<TableCell>경과일</TableCell>
									<TableCell>이미지</TableCell>
									<TableCell>액션</TableCell>
								</TableRow>
							</TableHead>
							<TableBody>
								{items.length === 0 && (
									<TableRow>
										<TableCell colSpan={9} align="center">
											<Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
												변환 가능한 후보가 없습니다
											</Typography>
										</TableCell>
									</TableRow>
								)}
								{items.map((source) => (
									<TableRow key={source.userId}>
										<TableCell padding="checkbox">
											<Checkbox
												checked={selectedIds.includes(source.userId)}
												onChange={() => handleSelectOne(source.userId)}
											/>
										</TableCell>
										<TableCell>{source.name}</TableCell>
										<TableCell>{source.age}</TableCell>
										<TableCell>{source.rank}</TableCell>
										<TableCell>{source.mbti ?? '-'}</TableCell>
										<TableCell>
											{safeToLocaleString(source.deletedAt, 'ko-KR', {
												year: 'numeric',
												month: '2-digit',
												day: '2-digit',
											}, '-')}
										</TableCell>
										<TableCell>
											<Chip label={`${source.daysSinceDeleted}일`} size="small" color="warning" />
										</TableCell>
										<TableCell>
											<Chip label={`${source.imageCount}장`} size="small" />
										</TableCell>
										<TableCell>
											<Button
												variant="outlined"
												size="small"
												onClick={() => handleCreateSingle(source.userId)}
												disabled={bulkProcessing}
											>
												생성
											</Button>
										</TableCell>
									</TableRow>
								))}
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
