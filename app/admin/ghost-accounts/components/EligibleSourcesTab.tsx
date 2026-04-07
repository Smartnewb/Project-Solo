'use client';

import { useState } from 'react';
import {
	Box,
	Card,
	CardContent,
	CardMedia,
	Button,
	Checkbox,
	Chip,
	CircularProgress,
	Typography,
	Pagination,
	Stack,
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

	const isSelected = (userId: string) => selectedIds.includes(userId);

	const handleToggle = (userId: string) => {
		setSelectedIds((prev) =>
			prev.includes(userId)
				? prev.filter((id) => id !== userId)
				: [...prev, userId],
		);
	};

	const handleSelectAll = () => {
		if (selectedIds.length === items.length) {
			setSelectedIds([]);
		} else {
			setSelectedIds(items.map((item) => item.userId));
		}
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

	if (isLoading) {
		return (
			<Box display="flex" justifyContent="center" py={4}>
				<CircularProgress />
			</Box>
		);
	}

	if (error) {
		return (
			<Typography color="error">
				후보 목록을 불러오는데 실패했습니다: {(error as Error).message}
			</Typography>
		);
	}

	return (
		<Box>
			<Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
				<Button
					variant="outlined"
					size="small"
					onClick={handleSelectAll}
					disabled={items.length === 0}
				>
					{selectedIds.length === items.length && items.length > 0 ? '전체 해제' : '전체 선택'}
				</Button>
				{selectedIds.length > 0 && (
					<>
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
					</>
				)}
				{data && (
					<Typography variant="body2" color="text.secondary" sx={{ ml: 'auto' }}>
						총 {data.meta.totalItems}명
					</Typography>
				)}
			</Box>

			{items.length === 0 && (
				<Typography variant="body2" color="text.secondary" textAlign="center" sx={{ py: 4 }}>
					변환 가능한 후보가 없습니다
				</Typography>
			)}

			<Box
				sx={{
					columns: { xs: 1, sm: 2, md: 3, lg: 4 },
					columnGap: '16px',
				}}
			>
				{items.map((source) => {
					const selected = isSelected(source.userId);
					const mainImage = source.imageUrls[0];

					return (
						<Card
							key={source.userId}
							sx={{
								position: 'relative',
								breakInside: 'avoid',
								mb: 2,
								border: selected ? '2px solid' : '1px solid',
								borderColor: selected ? 'primary.main' : 'divider',
								cursor: 'pointer',
								transition: 'all 0.15s',
								'&:hover': {
									borderColor: selected ? 'primary.main' : 'grey.400',
									boxShadow: 2,
								},
							}}
							onClick={() => handleToggle(source.userId)}
						>
							<Box sx={{ position: 'absolute', top: 8, left: 8, zIndex: 1 }}>
								<Checkbox
									checked={selected}
									onChange={() => handleToggle(source.userId)}
									onClick={(e) => e.stopPropagation()}
									size="small"
									sx={{
										bgcolor: 'rgba(255,255,255,0.85)',
										borderRadius: '4px',
										p: '2px',
									}}
								/>
							</Box>

							{mainImage ? (
								<CardMedia
									component="img"
									image={mainImage}
									alt={source.name}
									sx={{ width: '100%', display: 'block' }}
								/>
							) : (
								<Box
									sx={{
										height: 180,
										bgcolor: 'grey.100',
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'center',
									}}
								>
									<Typography variant="body2" color="text.disabled">
										이미지 없음
									</Typography>
								</Box>
							)}

							{source.imageUrls.length > 1 && (
								<Box
									sx={{
										position: 'absolute',
										top: 8,
										right: 8,
										bgcolor: 'rgba(0,0,0,0.6)',
										color: 'white',
										px: 1,
										py: 0.25,
										borderRadius: '4px',
										fontSize: '0.75rem',
									}}
								>
									+{source.imageUrls.length - 1}
								</Box>
							)}

							<CardContent sx={{ py: 1.5, px: 2, '&:last-child': { pb: 1.5 } }}>
								<Stack direction="row" justifyContent="space-between" alignItems="center">
									<Typography variant="subtitle2" fontWeight="bold">
										{source.name}
									</Typography>
									<Typography variant="caption" color="text.secondary">
										{source.age}세
									</Typography>
								</Stack>

								<Stack direction="row" gap={0.5} sx={{ mt: 0.5 }} flexWrap="wrap">
									{source.rank && (
										<Chip label={source.rank} size="small" variant="outlined" />
									)}
									{source.mbti && (
										<Chip label={source.mbti} size="small" variant="outlined" />
									)}
									<Chip
										label={`${source.daysSinceDeleted}일 경과`}
										size="small"
										color="warning"
										variant="outlined"
									/>
								</Stack>

								<Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
									탈퇴일: {safeToLocaleString(source.deletedAt, 'ko-KR', {
										year: 'numeric',
										month: '2-digit',
										day: '2-digit',
									}, '-')}
								</Typography>

								<Button
									variant="outlined"
									size="small"
									fullWidth
									sx={{ mt: 1 }}
									onClick={(e) => {
										e.stopPropagation();
										handleCreateSingle(source.userId);
									}}
									disabled={bulkProcessing}
								>
									Ghost 생성
								</Button>
							</CardContent>
						</Card>
					);
				})}
			</Box>

			{totalPages > 1 && (
				<Box display="flex" justifyContent="center" sx={{ mt: 3 }}>
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
		</Box>
	);
}
