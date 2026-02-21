'use client';

import { Box, Typography, Chip } from '@mui/material';
import {
  SupportAgent as SupportAgentIcon,
  Pending as PendingIcon,
  Handshake as HandshakeIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';

interface StatusCountBarProps {
  waitingCount: number;
  handlingCount: number;
  resolvedCount: number;
}

const pulseKeyframes = {
  '@keyframes pulse': {
    '0%': { transform: 'scale(1)' },
    '50%': { transform: 'scale(1.08)' },
    '100%': { transform: 'scale(1)' },
  },
};

export default function StatusCountBar({ waitingCount, handlingCount, resolvedCount }: StatusCountBarProps) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
      <Typography variant="h5" sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 700 }}>
        <SupportAgentIcon fontSize="large" />
        Q&A 처리
      </Typography>
      <Box sx={{ display: 'flex', gap: 1.5 }}>
        <Chip
          icon={<PendingIcon />}
          label={`대기 ${waitingCount}`}
          color={waitingCount > 0 ? 'error' : 'default'}
          variant="filled"
          sx={{
            fontWeight: 600,
            ...(waitingCount > 0 && {
              ...pulseKeyframes,
              animation: 'pulse 2s ease-in-out infinite',
            }),
          }}
        />
        <Chip
          icon={<HandshakeIcon />}
          label={`응대 ${handlingCount}`}
          color="primary"
          variant={handlingCount > 0 ? 'filled' : 'outlined'}
          sx={{ fontWeight: 600 }}
        />
        <Chip
          icon={<CheckCircleIcon />}
          label={`해결 ${resolvedCount}`}
          color="success"
          variant="outlined"
          sx={{ fontWeight: 600 }}
        />
      </Box>
    </Box>
  );
}
