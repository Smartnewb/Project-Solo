'use client';

import { useEffect, useState } from 'react';
import {
	Box,
	Button,
	ButtonBase,
	Card,
	CardContent,
	Chip,
	CircularProgress,
	Dialog,
	DialogContent,
	IconButton,
	Stack,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableRow,
	Tooltip,
	Typography,
} from '@mui/material';
import { ImageOff, RefreshCw, X } from 'lucide-react';
import type { JpIdentitySubmission } from '@/app/services/admin';
import {
	JP_IDENTITY_CHECKS,
	formatAgeGender,
	formatBirthDate,
	formatJpDocumentType,
	formatKstDateTime,
	getCheckBadge,
	getStatusChip,
	isJpIdentityActionable,
} from '../utils';

type Props = {
	readonly item: JpIdentitySubmission;
	readonly busy: boolean;
	readonly refreshing: boolean;
	readonly onApprove: (item: JpIdentitySubmission) => void;
	readonly onReject: (item: JpIdentitySubmission) => void;
	/** presigned URL 만료 등으로 이미지 로드에 실패했을 때 항목을 다시 조회해 새 URL 을 받는다. */
	readonly onRefreshImage: (item: JpIdentitySubmission) => void;
};

const THUMB_WIDTH = 200;

function ValueCell({ value, muted }: { readonly value: string; readonly muted?: boolean }) {
	return (
		<TableCell sx={{ color: muted ? 'text.disabled' : 'text.primary', fontWeight: muted ? 400 : 600 }}>
			{value}
		</TableCell>
	);
}

export function JpIdentityCard({ item, busy, refreshing, onApprove, onReject, onRefreshImage }: Props) {
	const [imageFailed, setImageFailed] = useState(false);
	const [autoRefreshed, setAutoRefreshed] = useState(false);
	const [viewerOpen, setViewerOpen] = useState(false);

	// 새 URL 이 내려오면 다시 로드 시도.
	useEffect(() => {
		setImageFailed(false);
	}, [item.imageUrl]);

	const handleImageError = () => {
		setImageFailed(true);
		setViewerOpen(false);
		if (!autoRefreshed) {
			setAutoRefreshed(true);
			onRefreshImage(item);
		}
	};

	const handleManualRefresh = () => {
		setAutoRefreshed(true);
		onRefreshImage(item);
	};

	const status = getStatusChip(item.status);
	const actionable = isJpIdentityActionable(item.status);
	const account = item.account;
	const displayName = account?.name ?? item.extracted.name ?? '이름 미상';
	const docLabel = formatJpDocumentType(item.documentType);
	const imageAlt = `${displayName} ${docLabel} 이미지`;
	const showImage = Boolean(item.imageUrl) && !imageFailed;

	return (
		<Card variant="outlined" data-testid="jp-identity-card">
			<CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
				<Stack direction={{ xs: 'column', lg: 'row' }} spacing={2}>
					<Box
						sx={{
							position: 'relative',
							flexShrink: 0,
							width: { xs: '100%', lg: THUMB_WIDTH },
							aspectRatio: '8 / 5',
							alignSelf: 'flex-start',
							borderRadius: 2,
							overflow: 'hidden',
							bgcolor: 'grey.100',
							border: 1,
							borderColor: 'divider',
						}}
					>
						{showImage ? (
							<ButtonBase
								onClick={() => setViewerOpen(true)}
								aria-label={`${displayName} 신분증 크게 보기`}
								sx={{ width: '100%', height: '100%', display: 'block' }}
							>
								<Box
									component="img"
									src={item.imageUrl ?? undefined}
									alt={imageAlt}
									loading="lazy"
									onError={handleImageError}
									sx={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
								/>
							</ButtonBase>
						) : (
							<Stack
								alignItems="center"
								justifyContent="center"
								spacing={1}
								sx={{ width: '100%', height: '100%', color: 'text.secondary', px: 1, textAlign: 'center' }}
							>
								<ImageOff size={22} />
								<Typography variant="caption" fontWeight={600}>
									{item.imageUrl ? '이미지 로드 실패' : '이미지 없음'}
								</Typography>
								{item.imageUrl && (
									<Button
										size="small"
										variant="text"
										color="inherit"
										startIcon={refreshing ? <CircularProgress size={12} color="inherit" /> : <RefreshCw size={12} />}
										disabled={refreshing}
										onClick={handleManualRefresh}
									>
										다시 불러오기
									</Button>
								)}
							</Stack>
						)}
						{refreshing && showImage && (
							<Box
								sx={{
									position: 'absolute',
									inset: 0,
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
									bgcolor: 'action.disabledBackground',
								}}
							>
								<CircularProgress size={20} />
							</Box>
						)}
					</Box>

					<Stack spacing={1.5} sx={{ flex: 1, minWidth: 0 }}>
						<Stack direction="row" spacing={1} alignItems="flex-start" justifyContent="space-between" flexWrap="wrap" useFlexGap>
							<Box sx={{ minWidth: 0 }}>
								<Typography variant="subtitle1" component="h2" fontWeight={700} noWrap title={displayName}>
									{displayName}
								</Typography>
								<Typography variant="caption" color="text.secondary" component="p">
									{docLabel} · 제출 {formatKstDateTime(item.submittedAt)} (KST)
								</Typography>
								<Typography variant="caption" color="text.secondary" component="p" noWrap title={item.userId}>
									회원 ID {item.userId}
									{account?.userStatus ? ` · 계정 ${account.userStatus}` : ''}
								</Typography>
							</Box>
							<Chip size="small" label={status.label} color={status.color} />
						</Stack>

						<Table size="small" aria-label="계정 정보와 서류 정보 비교" sx={{ '& td, & th': { px: 1, py: 0.75, borderColor: 'divider' } }}>
							<TableHead>
								<TableRow>
									<TableCell sx={{ color: 'text.secondary', fontWeight: 600, width: 88 }}>항목</TableCell>
									<TableCell sx={{ color: 'text.secondary', fontWeight: 600 }}>계정</TableCell>
									<TableCell sx={{ color: 'text.secondary', fontWeight: 600 }}>서류(OCR)</TableCell>
								</TableRow>
							</TableHead>
							<TableBody>
								<TableRow>
									<TableCell sx={{ color: 'text.secondary' }}>이름</TableCell>
									<ValueCell value={account?.name ?? '-'} muted={!account?.name} />
									<ValueCell value={item.extracted.name ?? '-'} muted={!item.extracted.name} />
								</TableRow>
								<TableRow>
									<TableCell sx={{ color: 'text.secondary' }}>생년월일</TableCell>
									<ValueCell value={formatBirthDate(account?.birthday)} muted={!account?.birthday} />
									<ValueCell value={formatBirthDate(item.extracted.birthDate)} muted={!item.extracted.birthDate} />
								</TableRow>
								<TableRow>
									<TableCell sx={{ color: 'text.secondary' }}>나이 / 성별</TableCell>
									<ValueCell
										value={formatAgeGender(account?.age, account?.gender)}
										muted={account?.age == null && !account?.gender}
									/>
									<ValueCell value="-" muted />
								</TableRow>
							</TableBody>
						</Table>
						{!account && (
							<Typography variant="caption" color="warning.main" fontWeight={600}>
								연결된 계정 정보를 찾지 못했습니다.
							</Typography>
						)}

						<Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap aria-label="검증 결과">
							{JP_IDENTITY_CHECKS.map(({ key, label }) => {
								const badge = getCheckBadge(item.checks[key]);
								return (
									<Chip
										key={key}
										size="small"
										variant={badge.color === 'default' ? 'outlined' : 'filled'}
										color={badge.color}
										label={`${label} ${badge.label}`}
									/>
								);
							})}
						</Stack>

						{item.rejectionReason && (
							<Typography variant="body2" color="error.main" sx={{ whiteSpace: 'pre-wrap' }}>
								거절 사유: {item.rejectionReason}
							</Typography>
						)}

						<Stack direction="row" spacing={1} justifyContent="flex-end" alignItems="center" flexWrap="wrap" useFlexGap>
							{actionable ? (
								<>
									<Button
										size="small"
										variant="outlined"
										color="error"
										disabled={busy}
										onClick={() => onReject(item)}
									>
										거절
									</Button>
									<Button
										size="small"
										variant="contained"
										color="success"
										disabled={busy}
										onClick={() => onApprove(item)}
									>
										승인
									</Button>
								</>
							) : (
								<Tooltip title={formatKstDateTime(item.reviewedAt)}>
									<Typography variant="caption" color="text.secondary">
										처리 완료
									</Typography>
								</Tooltip>
							)}
						</Stack>
					</Stack>
				</Stack>
			</CardContent>

			<Dialog open={viewerOpen && showImage} onClose={() => setViewerOpen(false)} maxWidth="lg" fullWidth>
				<DialogContent sx={{ p: 0, position: 'relative', bgcolor: 'secondary.main', height: { xs: '80vh', md: '88vh' } }}>
					<IconButton
						aria-label="큰 이미지 닫기"
						onClick={() => setViewerOpen(false)}
						sx={{
							position: 'absolute',
							top: 10,
							right: 10,
							zIndex: 2,
							color: 'secondary.contrastText',
							bgcolor: 'action.active',
							'&:hover': { bgcolor: 'text.primary' },
						}}
					>
						<X size={20} />
					</IconButton>
					<Box
						component="img"
						src={item.imageUrl ?? undefined}
						alt={`${imageAlt} 크게 보기`}
						onError={handleImageError}
						sx={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
					/>
				</DialogContent>
			</Dialog>
		</Card>
	);
}
