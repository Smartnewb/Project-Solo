'use client';

import {
	Button,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	Typography,
} from '@mui/material';

interface GhostChatConfirmDialogProps {
	open: boolean;
	title: string;
	description: string;
	confirmLabel: string;
	confirmColor?: 'primary' | 'error';
	loading?: boolean;
	onCancel: () => void;
	onConfirm: () => void;
}

export default function GhostChatConfirmDialog({
	open,
	title,
	description,
	confirmLabel,
	confirmColor = 'primary',
	loading = false,
	onCancel,
	onConfirm,
}: GhostChatConfirmDialogProps) {
	return (
		<Dialog open={open} onClose={loading ? undefined : onCancel} maxWidth="xs" fullWidth>
			<DialogTitle>{title}</DialogTitle>
			<DialogContent>
				<Typography variant="body2" color="text.secondary">
					{description}
				</Typography>
			</DialogContent>
			<DialogActions>
				<Button onClick={onCancel} disabled={loading}>
					취소
				</Button>
				<Button
					onClick={onConfirm}
					variant="contained"
					color={confirmColor}
					disabled={loading}
				>
					{confirmLabel}
				</Button>
			</DialogActions>
		</Dialog>
	);
}
