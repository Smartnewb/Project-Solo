'use client';

import { CircularProgress, Box } from '@mui/material';

export function AdminLoading() {
  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      minHeight="60vh"
    >
      <CircularProgress />
    </Box>
  );
}
