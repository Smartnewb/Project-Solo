'use client';

import { forwardRef } from 'react';
import {
  Card,
  CardMedia,
  CardContent,
  Box,
  Typography,
  Switch,
  IconButton,
  Chip,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import type { Banner } from '@/types/admin';

type BannerStatus = 'active' | 'scheduled' | 'expired' | 'inactive';

function getBannerStatus(banner: Banner): BannerStatus {
  if (!banner.isActive) return 'inactive';
  const now = new Date();
  if (banner.endDate && now > new Date(banner.endDate)) return 'expired';
  if (banner.startDate && now < new Date(banner.startDate)) return 'scheduled';
  return 'active';
}

function getStatusLabel(status: BannerStatus): string {
  switch (status) {
    case 'active': return '게시 중';
    case 'scheduled': return '예약됨';
    case 'expired': return '만료됨';
    case 'inactive': return '비활성';
  }
}

function getStatusColor(status: BannerStatus): 'success' | 'info' | 'default' | 'error' {
  switch (status) {
    case 'active': return 'success';
    case 'scheduled': return 'info';
    case 'expired': return 'default';
    case 'inactive': return 'error';
  }
}

function formatDate(dateString: string | null): string {
  if (!dateString) return '무제한';
  const date = new Date(dateString);
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getPositionLabel(position: string): string {
  switch (position) {
    case 'home': return '홈';
    case 'moment': return '모먼트';
    default: return position;
  }
}

interface BannerCardProps {
  banner: Banner;
  onToggleActive: (id: string, isActive: boolean) => void;
  onEdit: (banner: Banner) => void;
  onDelete: (id: string) => void;
  isDragging?: boolean;
  dragHandleProps?: any;
}

const BannerCard = forwardRef<HTMLDivElement, BannerCardProps>(
  ({ banner, onToggleActive, onEdit, onDelete, isDragging, dragHandleProps, ...props }, ref) => {
    const status = getBannerStatus(banner);

    return (
      <Card
        ref={ref}
        {...props}
        sx={{
          display: 'flex',
          mb: 2,
          opacity: isDragging ? 0.8 : 1,
          boxShadow: isDragging ? 4 : 1,
          transition: 'box-shadow 0.2s ease',
        }}
      >
        <Box
          {...dragHandleProps}
          sx={{
            display: 'flex',
            alignItems: 'center',
            px: 1,
            cursor: 'grab',
            bgcolor: 'grey.100',
            '&:active': { cursor: 'grabbing' },
          }}
        >
          <DragIndicatorIcon color="action" />
        </Box>

        <CardMedia
          component="img"
          sx={{ width: 200, height: 120, objectFit: 'cover' }}
          image={banner.imageUrl}
          alt="배너 이미지"
        />

        <CardContent sx={{ flex: 1, display: 'flex', alignItems: 'center', py: 1 }}>
          <Box sx={{ flex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Chip
                label={getPositionLabel(banner.position)}
                size="small"
                variant="outlined"
              />
              <Chip
                label={getStatusLabel(status)}
                size="small"
                color={getStatusColor(status)}
              />
              {banner.actionType && (
                <Chip
                  label={banner.actionType === 'internal' ? '앱 내 이동' : '외부 링크'}
                  size="small"
                  variant="outlined"
                  color="secondary"
                />
              )}
            </Box>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
              {banner.actionUrl || '액션 없음'}
            </Typography>

            <Typography variant="caption" color="text.secondary">
              {banner.startDate || banner.endDate
                ? `${formatDate(banner.startDate)} ~ ${formatDate(banner.endDate)}`
                : '상시 게시'}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Switch
              checked={banner.isActive}
              onChange={(e) => onToggleActive(banner.id, e.target.checked)}
              size="small"
            />
            <IconButton size="small" onClick={() => onEdit(banner)}>
              <EditIcon fontSize="small" />
            </IconButton>
            <IconButton size="small" color="error" onClick={() => onDelete(banner.id)}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Box>
        </CardContent>
      </Card>
    );
  }
);

BannerCard.displayName = 'BannerCard';

export default BannerCard;
