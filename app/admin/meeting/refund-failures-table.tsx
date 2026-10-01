'use client';

import { useState } from 'react';
import {
	Alert,
	Box,
	Button,
	Chip,
	CircularProgress,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	Typography,
} from '@mui/material';
import AdminService from '@/app/services/admin';
import type { MeetingRefundFailure } from '@/app/services/admin';
import { useConfirm } from '@/shared/ui/admin/confirm-dialog';
import { useToast } from '@/shared/ui/admin/toast';
import { meetingErrorMessage } from './lib/errors';
import { depositStatusColor, depositStatusLabel, formatKrw, formatKst, shortId } from './lib/format';

const COLUMNS = ['상태', '금액', '마지막 오류', '마지막 변경', '방 ID', '멤버 ID', '유저 ID', '처리'];

interface RefundFailuresTableProps {
	items: MeetingRefundFailure[];
	loading: boolean;
	error: string | null;
	onDismissError: () => void;
	onOpenRoom: (roomId: string) => void;
	/** 재시도가 끝나면(성공·실패 모두) 목록을 새로 읽는다. */
	onChanged: () => void;
}

function failureKey(item: MeetingRefundFailure): string {
	return `${item.roomId}:${item.memberId}`;
}

export function RefundFailuresTable({
	items,
	loading,
	error,
	onDismissError,
	onOpenRoom,
	onChanged,
}: RefundFailuresTableProps) {
	const confirm = useConfirm();
	const toast = useToast();
	const [retryingKey, setRetryingKey] = useState<string | null>(null);

	const handleRetry = async (item: MeetingRefundFailure) => {
		if (retryingKey || item.status !== 'REFUND_FAILED') return;
		const ok = await confirm({
			title: '환불 다시 시도',
			message: `${formatKrw(item.amount)}을 다시 환불할게요. 결제사(PortOne)에 환불 요청이 바로 나가요.`,
			confirmText: '환불 재시도',
			severity: 'warning',
		});
		if (!ok) return;
		setRetryingKey(failureKey(item));
		try {
			const result = await AdminService.meeting.refund(item.roomId, item.memberId);
			toast.success(`환불했어요. (${formatKrw(result?.amount ?? item.amount)})`);
		} catch (retryError) {
			toast.error(meetingErrorMessage(retryError, '환불 재시도에 실패했어요.'));
		} finally {
			setRetryingKey(null);
			onChanged();
		}
	};

	return (
		<Box>
			<Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, p: 2 }}>
				<Typography variant="body2" color="text.secondary">
					환불 실패는 여기서 다시 시도할 수 있어요. 10분 넘게 정산 중에 멈춘 건은 다시 요청하면 두 번 환불될 수 있어서, 결제사(PortOne)에서 실제
					환불 여부를 먼저 확인해야 해요.
				</Typography>
				<Typography variant="body2" color="text.secondary" sx={{ ml: 'auto', whiteSpace: 'nowrap' }}>
					{items.length.toLocaleString('ko-KR')}건
				</Typography>
			</Box>

			{error && (
				<Alert severity="error" sx={{ mx: 2, mb: 2 }} onClose={onDismissError}>
					{error}
				</Alert>
			)}

			<TableContainer>
				<Table size="small">
					<TableHead>
						<TableRow sx={{ bgcolor: 'grey.50' }}>
							{COLUMNS.map((heading) => (
								<TableCell key={heading} sx={{ fontWeight: 600, whiteSpace: 'nowrap' }}>
									{heading}
								</TableCell>
							))}
						</TableRow>
					</TableHead>
					<TableBody>
						{loading ? (
							<TableRow>
								<TableCell colSpan={COLUMNS.length} align="center" sx={{ py: 6 }}>
									<CircularProgress size={28} />
								</TableCell>
							</TableRow>
						) : items.length === 0 ? (
							<TableRow>
								<TableCell colSpan={COLUMNS.length} align="center" sx={{ py: 6, color: 'text.secondary' }}>
									환불 실패 건이 없어요.
								</TableCell>
							</TableRow>
						) : (
							items.map((item) => {
								const key = failureKey(item);
								return (
									<TableRow key={key} hover data-testid={`refund-failure-row-${key}`}>
										<TableCell>
											<Chip size="small" label={depositStatusLabel(item.status)} color={depositStatusColor(item.status)} />
										</TableCell>
										<TableCell sx={{ whiteSpace: 'nowrap' }}>{formatKrw(item.amount)}</TableCell>
										<TableCell sx={{ minWidth: 200, maxWidth: 320 }}>
											<Typography variant="caption" sx={{ wordBreak: 'keep-all', overflowWrap: 'anywhere', display: 'block' }}>
												{item.lastError || '-'}
											</Typography>
										</TableCell>
										<TableCell sx={{ whiteSpace: 'nowrap' }}>{formatKst(item.updatedAt)}</TableCell>
										<TableCell sx={{ whiteSpace: 'nowrap' }}>
											<Button size="small" variant="text" onClick={() => onOpenRoom(item.roomId)} title={item.roomId}>
												{shortId(item.roomId)}
											</Button>
										</TableCell>
										<TableCell sx={{ whiteSpace: 'nowrap' }}>
											<Typography variant="caption" sx={{ fontFamily: 'monospace' }} title={item.memberId}>
												{shortId(item.memberId)}
											</Typography>
										</TableCell>
										<TableCell sx={{ whiteSpace: 'nowrap' }}>
											<Typography variant="caption" sx={{ fontFamily: 'monospace' }} title={item.userId}>
												{shortId(item.userId)}
											</Typography>
										</TableCell>
										<TableCell sx={{ minWidth: 200 }}>
											{item.status === 'REFUND_FAILED' ? (
												<Button
													size="small"
													variant="contained"
													color="warning"
													disabled={Boolean(retryingKey)}
													onClick={() => handleRetry(item)}
												>
													{retryingKey === key ? <CircularProgress size={16} color="inherit" /> : '환불 재시도'}
												</Button>
											) : (
												<Box>
													<Typography variant="body2" fontWeight={700} color="warning.main">
														결제사 확인 필요
													</Typography>
													<Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
														PortOne에서 환불됐는지 확인한 뒤 개발팀에 알려 주세요.
													</Typography>
												</Box>
											)}
										</TableCell>
									</TableRow>
								);
							})
						)}
					</TableBody>
				</Table>
			</TableContainer>
		</Box>
	);
}
