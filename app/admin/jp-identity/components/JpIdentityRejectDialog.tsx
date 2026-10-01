'use client';

import { useEffect, useState } from 'react';
import {
	Button,
	Chip,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	Stack,
	TextField,
	Typography,
} from '@mui/material';
import type { JpIdentitySubmission } from '@/app/services/admin';
import { JP_IDENTITY_REJECT_PRESETS, formatJpDocumentType } from '../utils';

type Props = {
	readonly target: JpIdentitySubmission | null;
	readonly busy: boolean;
	readonly onClose: () => void;
	readonly onConfirm: (reason: string) => void;
};

export function JpIdentityRejectDialog({ target, busy, onClose, onConfirm }: Props) {
	const [reason, setReason] = useState('');
	const targetId = target?.id;

	useEffect(() => {
		if (targetId) setReason('');
	}, [targetId]);

	const trimmed = reason.trim();
	const displayName = target?.account?.name ?? target?.extracted.name ?? target?.userId ?? '';

	return (
		<Dialog open={target !== null} onClose={busy ? undefined : onClose} maxWidth="sm" fullWidth>
			<DialogTitle component="div">
				<Typography variant="h6" component="h2" fontWeight={700}>
					거절 사유
				</Typography>
				<Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
					{displayName} · {formatJpDocumentType(target?.documentType)} — 사유는 필수이며 유저에게 전달될 수 있습니다.
				</Typography>
			</DialogTitle>
			<DialogContent>
				<Stack direction="row" flexWrap="wrap" useFlexGap gap={1} sx={{ mb: 2 }}>
					{JP_IDENTITY_REJECT_PRESETS.map((preset) => {
						const selected = reason === preset.reason;
						return (
							<Chip
								key={preset.label}
								label={preset.label}
								onClick={() => setReason(preset.reason)}
								color={selected ? 'primary' : 'default'}
								variant={selected ? 'filled' : 'outlined'}
							/>
						);
					})}
				</Stack>
				<TextField
					fullWidth
					multiline
					minRows={3}
					required
					label="거절 사유"
					value={reason}
					onChange={(event) => setReason(event.target.value)}
					placeholder="사유를 선택하거나 직접 입력하세요"
					disabled={busy}
				/>
			</DialogContent>
			<DialogActions sx={{ px: 3, pb: 2 }}>
				<Button onClick={onClose} color="inherit" disabled={busy}>
					취소
				</Button>
				<Button
					onClick={() => onConfirm(trimmed)}
					variant="contained"
					color="error"
					disabled={!trimmed || busy}
				>
					거절하기
				</Button>
			</DialogActions>
		</Dialog>
	);
}
