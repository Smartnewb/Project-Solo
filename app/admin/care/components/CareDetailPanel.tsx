'use client';

import { Box, Typography, Button, Skeleton } from '@mui/material';
import type { CareTarget, CarePartner } from '@/app/services/admin/care';
import { calculateAge } from '@/app/utils/formatters';

interface CareDetailPanelProps {
	target: CareTarget | null;
	partners: CarePartner[];
	partnersLoading: boolean;
	onDismiss: () => void;
	onSelectPartner: (partner: CarePartner) => void;
	dismissLoading: boolean;
}

export default function CareDetailPanel({
	target,
	partners,
	partnersLoading,
	onDismiss,
	onSelectPartner,
	dismissLoading,
}: CareDetailPanelProps) {
	if (!target) {
		return (
			<Box
				sx={{
					flex: 1,
					border: '1px solid #e5e7eb',
					borderRadius: 3,
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					minHeight: 300,
				}}
			>
				<Typography color="text.secondary" sx={{ fontSize: 13 }}>
					좌측에서 유저를 선택하세요
				</Typography>
			</Box>
		);
	}

	const age = calculateAge(target.birthday);
	const genderLabel = target.gender === 'MALE' ? '남' : '여';

	return (
		<Box
			sx={{
				flex: 1,
				border: '1px solid #e5e7eb',
				borderRadius: 3,
				p: 2,
				bgcolor: '#fafafa',
			}}
		>
			<Box
				sx={{
					display: 'flex',
					gap: 1.5,
					alignItems: 'center',
					mb: 2,
					pb: 1.5,
					borderBottom: '1px solid #e5e7eb',
				}}
			>
				<Box
					component="img"
					src={target.profile_image_url || '/default-avatar.png'}
					sx={{
						width: 56,
						height: 56,
						borderRadius: '50%',
						objectFit: 'cover',
						bgcolor: '#e5e7eb',
						flexShrink: 0,
					}}
				/>
				<Box sx={{ flex: 1 }}>
					<Typography sx={{ fontWeight: 700, fontSize: 16 }}>{target.name}</Typography>
					<Typography sx={{ fontSize: 12, color: '#666' }}>
						{target.university_name} / {genderLabel} / {age}세
					</Typography>
					{target.introduction && (
						<Typography sx={{ fontSize: 12, color: '#9ca3af', mt: 0.25 }}>
							{target.introduction}
						</Typography>
					)}
				</Box>
				<Button
					size="small"
					variant="outlined"
					color="inherit"
					onClick={onDismiss}
					disabled={dismissLoading}
					sx={{ fontSize: 11, color: '#6b7280', borderColor: '#e5e7eb' }}
				>
					무시
				</Button>
			</Box>

			<Box
				sx={{
					bgcolor: '#fef2f2',
					p: 1.5,
					borderRadius: 2,
					mb: 2,
					display: 'flex',
					gap: 2,
					fontSize: 12,
				}}
			>
				<Box>
					<Typography
						component="span"
						sx={{ fontWeight: 600, color: '#dc2626', fontSize: 12 }}
					>
						연속 실패:
					</Typography>{' '}
					{target.consecutive_failure_days}일
				</Box>
				<Box>
					<Typography
						component="span"
						sx={{ fontWeight: 600, color: '#dc2626', fontSize: 12 }}
					>
						마지막 실패:
					</Typography>{' '}
					{target.last_failure_at
						? new Date(target.last_failure_at).toLocaleDateString('ko-KR', {
								month: 'numeric',
								day: 'numeric',
								hour: '2-digit',
								minute: '2-digit',
							})
						: '-'}
				</Box>
				{target.last_failure_reason && (
					<Box>
						<Typography
							component="span"
							sx={{ fontWeight: 600, color: '#dc2626', fontSize: 12 }}
						>
							사유:
						</Typography>{' '}
						{target.last_failure_reason}
					</Box>
				)}
			</Box>

			<Typography sx={{ fontWeight: 600, fontSize: 13, mb: 1 }}>추천 파트너</Typography>

			{partnersLoading ? (
				<Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
					{[1, 2, 3].map((i) => (
						<Skeleton
							key={i}
							variant="rounded"
							height={48}
							sx={{ borderRadius: 2 }}
						/>
					))}
				</Box>
			) : partners.length === 0 ? (
				<Typography color="text.secondary" sx={{ fontSize: 12, mt: 1 }}>
					추천 가능한 파트너가 없습니다
				</Typography>
			) : (
				<Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
					{partners.map((partner) => (
						<Box
							key={partner.userId}
							sx={{
								display: 'flex',
								justifyContent: 'space-between',
								alignItems: 'center',
								p: 1.25,
								bgcolor: 'white',
								borderRadius: 2,
								border: '1px solid #e5e7eb',
							}}
						>
							<Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
								<Box
									component="img"
									src={partner.profileImageUrl || '/default-avatar.png'}
									sx={{
										width: 32,
										height: 32,
										borderRadius: '50%',
										objectFit: 'cover',
										bgcolor: '#e5e7eb',
										flexShrink: 0,
									}}
								/>
								<Box>
									<Typography
										component="span"
										sx={{ fontWeight: 500, fontSize: 13 }}
									>
										{partner.name}
									</Typography>
									<Typography
										component="span"
										sx={{ fontSize: 11, color: '#666', ml: 0.5 }}
									>
										· {partner.universityName} ·{' '}
										{partner.gender === 'MALE' ? '남' : '여'} ·{' '}
										{partner.age}세
									</Typography>
								</Box>
							</Box>
							<Button
								size="small"
								variant="contained"
								onClick={() => onSelectPartner(partner)}
								sx={{ fontSize: 11, minWidth: 'auto', px: 1.5 }}
							>
								선택
							</Button>
						</Box>
					))}
				</Box>
			)}
		</Box>
	);
}
