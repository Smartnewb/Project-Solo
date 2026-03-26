'use client';

import { Box, Typography, TextField, InputAdornment, Skeleton, Pagination } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import type { CareTarget } from '@/app/services/admin/care';
import { calculateAge } from '@/app/utils/formatters';

interface CareTargetListProps {
	targets: CareTarget[];
	selectedTarget: CareTarget | null;
	onSelect: (target: CareTarget) => void;
	loading: boolean;
	searchTerm: string;
	onSearchChange: (term: string) => void;
	pagination: { page: number; limit: number; total: number };
	onPageChange: (page: number) => void;
}

function FailureBadge({ days }: { days: number }) {
	const color = days >= 7 ? '#ef4444' : days >= 5 ? '#f59e0b' : '#6b7280';
	const bg = days >= 7 ? '#fef2f2' : days >= 5 ? '#fef9c3' : '#f3f4f6';
	return (
		<Box
			component="span"
			sx={{
				bgcolor: bg,
				color,
				px: 1,
				py: 0.25,
				borderRadius: 3,
				fontSize: 10,
				fontWeight: 600,
				whiteSpace: 'nowrap',
			}}
		>
			{days}일 실패
		</Box>
	);
}

function SearchField({
	value,
	onChange,
}: {
	value: string;
	onChange: (v: string) => void;
}) {
	return (
		<TextField
			size="small"
			fullWidth
			placeholder="이름 또는 유저 ID 검색..."
			value={value}
			onChange={(e) => onChange(e.target.value)}
			InputProps={{
				startAdornment: (
					<InputAdornment position="start">
						<SearchIcon sx={{ fontSize: 18, color: '#9ca3af' }} />
					</InputAdornment>
				),
			}}
			sx={{ mb: 1.5 }}
		/>
	);
}

export default function CareTargetList({
	targets,
	selectedTarget,
	onSelect,
	loading,
	searchTerm,
	onSearchChange,
	pagination,
	onPageChange,
}: CareTargetListProps) {
	if (!loading && targets.length === 0) {
		return (
			<Box>
				<SearchField value={searchTerm} onChange={onSearchChange} />
				<Typography
					color="text.secondary"
					sx={{ textAlign: 'center', mt: 4, fontSize: 13 }}
				>
					{searchTerm ? '검색 결과가 없습니다' : '현재 케어가 필요한 유저가 없습니다'}
				</Typography>
			</Box>
		);
	}

	return (
		<Box>
			<SearchField value={searchTerm} onChange={onSearchChange} />

			{loading ? (
				<Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
					{[1, 2, 3].map((i) => (
						<Skeleton key={i} variant="rounded" height={80} sx={{ borderRadius: 2 }} />
					))}
				</Box>
			) : (
				<>
					<Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
						{targets.map((target) => {
							const isSelected = selectedTarget?.id === target.id;
							const age = calculateAge(target.birthday);
							const genderLabel = target.gender === 'MALE' ? '남' : '여';
							return (
								<Box
									key={target.id}
									onClick={() => onSelect(target)}
									sx={{
										p: 1.5,
										border: isSelected
											? '2px solid #2563eb'
											: '1px solid #e5e7eb',
										borderRadius: 2,
										bgcolor: isSelected ? '#f8faff' : 'white',
										cursor: 'pointer',
										'&:hover': {
											bgcolor: isSelected ? '#f8faff' : '#f9fafb',
										},
									}}
								>
									<Box
										sx={{
											display: 'flex',
											justifyContent: 'space-between',
											alignItems: 'flex-start',
										}}
									>
										<Box
											sx={{ display: 'flex', gap: 1, alignItems: 'center' }}
										>
											<Box
												component="img"
												src={
													target.profile_image_url ||
													'/default-avatar.png'
												}
												sx={{
													width: 36,
													height: 36,
													borderRadius: '50%',
													objectFit: 'cover',
													bgcolor: '#e5e7eb',
													flexShrink: 0,
												}}
											/>
											<Box>
												<Typography sx={{ fontWeight: 600, fontSize: 13 }}>
													{target.name}
												</Typography>
												<Typography sx={{ fontSize: 11, color: '#666' }}>
													{target.university_name} / {genderLabel} /{' '}
													{age}세
												</Typography>
											</Box>
										</Box>
										<FailureBadge
											days={target.consecutive_failure_days}
										/>
									</Box>
									<Typography sx={{ mt: 0.5, fontSize: 10, color: '#9ca3af' }}>
										마지막 실패:{' '}
										{target.last_failure_at
											? new Date(
													target.last_failure_at,
												).toLocaleDateString('ko-KR', {
													month: 'numeric',
													day: 'numeric',
													hour: '2-digit',
													minute: '2-digit',
												})
											: '-'}
										{target.last_failure_reason &&
											` · 사유: ${target.last_failure_reason}`}
									</Typography>
								</Box>
							);
						})}
					</Box>

					{!searchTerm && pagination.total > pagination.limit && (
						<Box sx={{ display: 'flex', justifyContent: 'center', mt: 1.5 }}>
							<Pagination
								count={Math.ceil(pagination.total / pagination.limit)}
								page={pagination.page}
								onChange={(_, page) => onPageChange(page)}
								size="small"
							/>
						</Box>
					)}
				</>
			)}
		</Box>
	);
}
