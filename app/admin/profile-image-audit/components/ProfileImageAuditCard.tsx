'use client';

import { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Checkbox,
  Chip,
  Stack,
  Typography,
} from '@mui/material';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import type { ProfileImageAuditItem } from '@/app/services/admin';
import {
  formatAgeGender,
  formatImageSlot,
} from '../profile-image-audit-utils';

type Props = {
  readonly item: ProfileImageAuditItem;
  readonly selected: boolean;
  readonly onToggle: (profileImageId: string) => void;
};

export function ProfileImageAuditCard({ item, selected, onToggle }: Props) {
  const [src, setSrc] = useState(item.imageUrl);
  const [imageFailed, setImageFailed] = useState(false);

  const handleImageError = () => {
    if (item.thumbnailUrl && src !== item.thumbnailUrl) {
      setSrc(item.thumbnailUrl);
      return;
    }
    setImageFailed(true);
  };

  return (
    <Card
      variant="outlined"
      sx={{
        borderColor: selected ? '#2563eb' : '#dbe3ef',
        boxShadow: selected ? '0 0 0 2px rgba(37,99,235,0.18)' : 'none',
        overflow: 'hidden',
      }}
    >
      <Box sx={{ position: 'relative', aspectRatio: '3 / 4', bgcolor: '#e5e7eb' }}>
        {imageFailed ? (
          <Box
            sx={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#64748b',
              fontSize: 13,
              fontWeight: 700,
            }}
          >
            이미지 로드 실패
          </Box>
        ) : (
          <Box
            component="img"
            src={src}
            alt={`${item.profileImageId} 프로필 이미지`}
            loading="lazy"
            onError={handleImageError}
            sx={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: 'block',
              imageOrientation: 'from-image',
            }}
          />
        )}
        <Checkbox
          checked={selected}
          onChange={() => onToggle(item.profileImageId)}
          inputProps={{ 'aria-label': `${item.profileImageId} 선택` }}
          sx={{
            position: 'absolute',
            top: 6,
            left: 6,
            bgcolor: 'rgba(255,255,255,0.88)',
            borderRadius: '50%',
          }}
        />
        <Chip
          size="small"
          label={formatImageSlot(item)}
          sx={{ position: 'absolute', right: 8, top: 8, bgcolor: 'rgba(15,23,42,0.78)', color: '#fff' }}
        />
      </Box>
      <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
        <Stack spacing={0.75}>
          <Typography variant="subtitle2" noWrap title={item.universityName ?? '학교 미상'}>
            {item.universityName ?? '학교 미상'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {formatAgeGender(item)}
          </Typography>
          <Stack direction="row" spacing={0.5} useFlexGap flexWrap="wrap">
            {item.hasReport && (
              <Chip
                size="small"
                icon={<AlertTriangle size={14} />}
                label="신고"
                color="warning"
                variant="outlined"
              />
            )}
            {item.validation?.autoDecision === 'approved' && (
              <Chip
                size="small"
                icon={<CheckCircle2 size={14} />}
                label={`AI ${item.validation.totalScore ?? '-'}점`}
                color="success"
                variant="outlined"
              />
            )}
            <Chip size="small" label={`${item.approvedImageCount}/${item.totalActiveImageCount}장`} />
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}
