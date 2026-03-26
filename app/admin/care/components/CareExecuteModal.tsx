'use client';

import { useState } from 'react';
import {
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	Box,
	Typography,
	Button,
	TextField,
	CircularProgress,
	IconButton,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import type { CareTarget, CarePartner } from '@/app/services/admin/care';
import { calculateAge } from '@/app/utils/formatters';

type CareAction = 'like' | 'mutual_like' | 'open_chat';

interface CareExecuteModalProps {
	open: boolean;
	onClose: () => void;
	target: CareTarget | null;
	partner: CarePartner | null;
	onExecute: (action: CareAction, letterContent: string) => Promise<void>;
	executing: boolean;
	executeError: string | null;
}

const ACTION_OPTIONS: { value: CareAction; label: string; description: string }[] = [
	{
		value: 'like',
		label: '좋아요',
		description: '단방향 좋아요 전송. 상대 수락 필요.',
	},
	{
		value: 'mutual_like',
		label: '상호좋아요',
		description: '양방향 매칭 즉시 성립. 수락 불필요.',
	},
	{
		value: 'open_chat',
		label: '채팅방 개설',
		description: '매칭 + 채팅방 생성 + 편지 전달. 즉시 대화 가능.',
	},
];

export default function CareExecuteModal({
	open,
	onClose,
	target,
	partner,
	onExecute,
	executing,
	executeError,
}: CareExecuteModalProps) {
	const [step, setStep] = useState<1 | 2>(1);
	const [selectedAction, setSelectedAction] = useState<CareAction | null>(null);
	const [letterContent, setLetterContent] = useState('');

	const handleClose = () => {
		setStep(1);
		setSelectedAction(null);
		setLetterContent('');
		onClose();
	};

	const handleNext = () => {
		if (selectedAction) setStep(2);
	};

	const handleBack = () => {
		setStep(1);
	};

	const handleExecute = async () => {
		if (!selectedAction) return;
		await onExecute(selectedAction, letterContent);
	};

	if (!target || !partner) return null;

	const targetAge = calculateAge(target.birthday);
	return (
		<Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
			<DialogTitle
				sx={{
					display: 'flex',
					justifyContent: 'space-between',
					alignItems: 'center',
				}}
			>
				케어 실행
				<IconButton size="small" onClick={handleClose}>
					<CloseIcon fontSize="small" />
				</IconButton>
			</DialogTitle>
			<DialogContent>
				<Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
					<Box
						sx={{
							width: 28,
							height: 28,
							borderRadius: '50%',
							bgcolor: step >= 1 ? (step > 1 ? '#16a34a' : '#2563eb') : '#e5e7eb',
							color: 'white',
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							fontSize: 12,
							fontWeight: 700,
						}}
					>
						{step > 1 ? '\u2713' : '1'}
					</Box>
					<Box
						sx={{
							height: 2,
							flex: 1,
							bgcolor: step > 1 ? '#2563eb' : '#e5e7eb',
						}}
					/>
					<Box
						sx={{
							width: 28,
							height: 28,
							borderRadius: '50%',
							bgcolor: step === 2 ? '#2563eb' : '#e5e7eb',
							color: step === 2 ? 'white' : '#9ca3af',
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							fontSize: 12,
							fontWeight: 700,
						}}
					>
						2
					</Box>
				</Box>

				<Box
					sx={{
						display: 'flex',
						alignItems: 'center',
						gap: 1.5,
						mb: 2,
						p: 1.5,
						bgcolor: '#f8fafc',
						borderRadius: 2,
					}}
				>
					<Box sx={{ textAlign: 'center' }}>
						<Box
							component="img"
							src={target.profile_image_url || '/default-avatar.png'}
							sx={{
								width: 40,
								height: 40,
								borderRadius: '50%',
								objectFit: 'cover',
								bgcolor: '#e5e7eb',
								mx: 'auto',
								mb: 0.5,
							}}
						/>
						<Typography sx={{ fontSize: 11, fontWeight: 600 }}>
							{target.name}
						</Typography>
						<Typography sx={{ fontSize: 9, color: '#666' }}>
							{target.university_name} / {targetAge}세
						</Typography>
					</Box>
					<Typography sx={{ fontSize: 20, color: '#cbd5e1' }}>&rarr;</Typography>
					<Box sx={{ textAlign: 'center' }}>
						<Box
							component="img"
							src={partner.profileImageUrl || '/default-avatar.png'}
							sx={{
								width: 40,
								height: 40,
								borderRadius: '50%',
								objectFit: 'cover',
								bgcolor: '#e5e7eb',
								mx: 'auto',
								mb: 0.5,
							}}
						/>
						<Typography sx={{ fontSize: 11, fontWeight: 600 }}>
							{partner.name}
						</Typography>
						<Typography sx={{ fontSize: 9, color: '#666' }}>
							{partner.universityName} / {partner.age}세
						</Typography>
					</Box>
				</Box>

				{step === 1 ? (
					<>
						<Typography sx={{ fontWeight: 600, fontSize: 14, mb: 1 }}>
							액션 선택
						</Typography>
						<Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
							{ACTION_OPTIONS.map((option) => (
								<Box
									key={option.value}
									onClick={() => setSelectedAction(option.value)}
									sx={{
										p: 1.5,
										border:
											selectedAction === option.value
												? '2px solid #2563eb'
												: '1px solid #e5e7eb',
										borderRadius: 2,
										bgcolor:
											selectedAction === option.value
												? '#eff6ff'
												: 'white',
										cursor: 'pointer',
										'&:hover': {
											bgcolor:
												selectedAction === option.value
													? '#eff6ff'
													: '#f9fafb',
										},
									}}
								>
									<Typography
										sx={{
											fontWeight: 600,
											fontSize: 13,
											color:
												selectedAction === option.value
													? '#2563eb'
													: 'inherit',
										}}
									>
										{option.label}
									</Typography>
									<Typography sx={{ fontSize: 11, color: '#6b7280' }}>
										{option.description}
									</Typography>
								</Box>
							))}
						</Box>
					</>
				) : (
					<>
						{/* Step 2: 요약 + 편지 */}
						<Box
							sx={{
								bgcolor: '#f8fafc',
								p: 1.5,
								borderRadius: 2,
								mb: 2,
								fontSize: 12,
							}}
						>
							<Box
								sx={{
									display: 'flex',
									justifyContent: 'space-between',
									mb: 0.5,
								}}
							>
								<Typography sx={{ color: '#6b7280', fontSize: 12 }}>
									대상:
								</Typography>
								<Typography sx={{ fontWeight: 600, fontSize: 12 }}>
									{target.name} ({target.university_name}, {targetAge}세)
								</Typography>
							</Box>
							<Box
								sx={{
									display: 'flex',
									justifyContent: 'space-between',
									mb: 0.5,
								}}
							>
								<Typography sx={{ color: '#6b7280', fontSize: 12 }}>
									파트너:
								</Typography>
								<Typography sx={{ fontWeight: 600, fontSize: 12 }}>
									{partner.name} ({partner.universityName}, {partner.age}세)
								</Typography>
							</Box>
							<Box
								sx={{
									display: 'flex',
									justifyContent: 'space-between',
								}}
							>
								<Typography sx={{ color: '#6b7280', fontSize: 12 }}>
									액션:
								</Typography>
								<Typography
									sx={{ fontWeight: 600, fontSize: 12, color: '#2563eb' }}
								>
									{
										ACTION_OPTIONS.find((o) => o.value === selectedAction)
											?.label
									}
								</Typography>
							</Box>
						</Box>

						<Typography sx={{ fontWeight: 600, fontSize: 12, mb: 0.75 }}>
							편지 내용{' '}
							<Typography
								component="span"
								sx={{ color: '#9ca3af', fontWeight: 400, fontSize: 12 }}
							>
								(최대 500자)
							</Typography>
						</Typography>
						<TextField
							multiline
							rows={3}
							fullWidth
							value={letterContent}
							onChange={(e) => {
								if (e.target.value.length <= 500)
									setLetterContent(e.target.value);
							}}
							placeholder="편지 내용을 입력하세요..."
							size="small"
						/>
						<Typography
							sx={{
								textAlign: 'right',
								fontSize: 10,
								color: '#9ca3af',
								mt: 0.5,
							}}
						>
							{letterContent.length} / 500
						</Typography>

						{executeError && (
							<Typography color="error" sx={{ fontSize: 12, mt: 1 }}>
								{executeError}
							</Typography>
						)}
					</>
				)}
			</DialogContent>
			<DialogActions sx={{ px: 3, pb: 2 }}>
				{step === 1 ? (
					<>
						<Button onClick={handleClose} color="inherit">
							취소
						</Button>
						<Button
							variant="contained"
							onClick={handleNext}
							disabled={!selectedAction}
						>
							다음
						</Button>
					</>
				) : (
					<>
						<Button onClick={handleBack} color="inherit" disabled={executing}>
							이전
						</Button>
						<Button
							variant="contained"
							onClick={handleExecute}
							disabled={executing || !letterContent.trim()}
							startIcon={executing ? <CircularProgress size={16} /> : null}
						>
							케어 실행
						</Button>
					</>
				)}
			</DialogActions>
		</Dialog>
	);
}
