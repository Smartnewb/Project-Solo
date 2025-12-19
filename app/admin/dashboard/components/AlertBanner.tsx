'use client';

import { Alert as MuiAlert, Box, IconButton, Typography } from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import Link from 'next/link';
import { Alert, AlertSeverity, ALERT_TYPE_LABELS } from '../types';

interface AlertBannerProps {
  alerts: Alert[];
  onDismiss?: (id: string) => void;
}

const getSeverityColor = (severity: AlertSeverity) => {
  switch (severity) {
    case 'CRITICAL':
      return 'error';
    case 'WARNING':
      return 'warning';
    default:
      return 'info';
  }
};

export default function AlertBanner({ alerts, onDismiss }: AlertBannerProps) {
  if (!alerts || alerts.length === 0) {
    return null;
  }

  return (
    <Box className="space-y-2">
      {alerts.map((alert) => (
        <MuiAlert
          key={alert.id}
          severity={getSeverityColor(alert.severity)}
          action={
            onDismiss && (
              <IconButton
                aria-label="닫기"
                color="inherit"
                size="small"
                onClick={() => onDismiss(alert.id)}
              >
                <CloseIcon fontSize="inherit" />
              </IconButton>
            )
          }
          sx={{ alignItems: 'center' }}
        >
          <Box className="flex items-center justify-between w-full gap-4">
            <Box>
              <Typography variant="body2" component="span" fontWeight="bold">
                [{ALERT_TYPE_LABELS[alert.type]}]
              </Typography>{' '}
              <Typography variant="body2" component="span">
                {alert.message}
              </Typography>
              <Typography variant="caption" color="textSecondary" className="ml-2">
                (현재: {alert.currentValue.toLocaleString()}, 비교: {alert.comparisonValue.toLocaleString()}, 변화: {alert.changePercent > 0 ? '+' : ''}{alert.changePercent.toFixed(1)}%)
              </Typography>
            </Box>
            {alert.link && (
              <Link href={alert.link} className="text-sm underline hover:no-underline whitespace-nowrap">
                바로가기
              </Link>
            )}
          </Box>
        </MuiAlert>
      ))}
    </Box>
  );
}
