'use client';

import { Alert, Snackbar, Stack } from '@mui/material';
import { useToast } from './toast-context';

export function ToastContainer() {
  const { toasts, dismiss } = useToast();

  return (
    <Stack
      spacing={1}
      sx={{
        position: 'fixed',
        top: 16,
        right: 16,
        zIndex: 9999,
        maxWidth: 400,
      }}
    >
      {toasts.map((toast) => (
        <Snackbar
          key={toast.id}
          open
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
          sx={{ position: 'relative', top: 'auto', right: 'auto' }}
        >
          <Alert
            severity={toast.severity}
            onClose={() => dismiss(toast.id)}
            variant="filled"
            sx={{ width: '100%' }}
          >
            {toast.message}
          </Alert>
        </Snackbar>
      ))}
    </Stack>
  );
}
