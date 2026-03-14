'use client';

import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material';
import { useConfirmDialogState } from './confirm-dialog-context';

export function ConfirmDialog() {
  const { state, handleConfirm, handleCancel } = useConfirmDialogState();

  return (
    <Dialog open={state.open} onClose={handleCancel} maxWidth="xs" fullWidth>
      <DialogTitle>{state.title ?? '확인'}</DialogTitle>
      <DialogContent>
        <DialogContentText>{state.message}</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCancel} color="inherit">
          {state.cancelText ?? '취소'}
        </Button>
        <Button
          onClick={handleConfirm}
          color={state.severity === 'error' ? 'error' : 'primary'}
          variant="contained"
          autoFocus
        >
          {state.confirmText ?? '확인'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
