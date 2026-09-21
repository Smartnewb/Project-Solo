'use client';

import { useState } from 'react';
import {
  Box,
  ButtonBase,
  Card,
  CardContent,
  Checkbox,
  Chip,
  Dialog,
  DialogContent,
  IconButton,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { AlertTriangle, CheckCircle2, X } from 'lucide-react';
import type { ProfileImageAuditItem, ProfileImageAuditProfileRank } from '@/app/services/admin';
import { PROFILE_RANK_OPTIONS } from '../constants';
import {
  formatAuditStatus,
  formatAgeGender,
  formatImageKind,
  formatImageSlot,
  formatProfileRank,
  formatReviewedType,
  formatReviewStatus,
  formatValidationSummary,
  parseProfileRank,
} from '../profile-image-audit-utils';
import { ProfileImageAuditDetailDrawer } from './ProfileImageAuditDetailDrawer';

type Props = {
  readonly item: ProfileImageAuditItem;
  readonly selected: boolean;
  readonly onToggle: (profileImageId: string) => void;
  readonly onRankChange: (item: ProfileImageAuditItem, rank: ProfileImageAuditProfileRank) => void;
  readonly rankUpdating: boolean;
};

export function ProfileImageAuditCard({ item, selected, onToggle, onRankChange, rankUpdating }: Props) {
  const [src, setSrc] = useState(item.imageUrl);
  const [imageFailed, setImageFailed] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);

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
      data-testid="profile-image-audit-card"
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
          <ButtonBase
            onClick={() => setViewerOpen(true)}
            aria-label={`${item.profileImageId} 크게 보기`}
            sx={{
              width: '100%',
              height: '100%',
              display: 'block',
            }}
          >
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
          </ButtonBase>
        )}
        <Checkbox
          checked={selected}
          onChange={() => onToggle(item.profileImageId)}
          inputProps={{ 'aria-label': `${item.profileImageId} 선택` }}
          sx={{
            position: 'absolute',
            top: 6,
            left: 6,
            zIndex: 2,
            bgcolor: 'rgba(255,255,255,0.88)',
            borderRadius: '50%',
          }}
        />
        <Chip
          size="small"
          label={formatImageSlot(item)}
          sx={{ position: 'absolute', right: 8, top: 8, zIndex: 2, bgcolor: 'rgba(15,23,42,0.78)', color: '#fff' }}
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
          <TextField
            select
            size="small"
            label="등급"
            value={item.profileRank ?? 'UNKNOWN'}
            disabled={rankUpdating}
            onChange={(event) => {
              const rank = parseProfileRank(event.target.value);
              if (rank !== null) onRankChange(item, rank);
            }}
            sx={{
              maxWidth: 112,
              '& .MuiInputBase-input': {
                py: 0.5,
                fontSize: 13,
                fontWeight: 700,
              },
            }}
          >
            {PROFILE_RANK_OPTIONS.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
          <Stack direction="row" spacing={0.5} useFlexGap flexWrap="wrap">
            <Chip size="small" label={formatProfileRank(item.profileRank)} variant="outlined" />
            <Chip size="small" label={formatImageKind(item)} color={item.isMain ? 'primary' : 'default'} />
            <Chip size="small" label={formatReviewedType(item.reviewedType)} variant="outlined" />
            <Chip size="small" label={formatReviewStatus(item.reviewStatus)} variant="outlined" />
            <Chip size="small" label={formatValidationSummary(item)} variant="outlined" />
            <Chip size="small" label={formatAuditStatus(item.auditStatus)} color="info" variant="outlined" />
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
              <Chip size="small" icon={<CheckCircle2 size={14} />} label="AI 통과" color="success" variant="outlined" />
            )}
            {item.isBlacklisted && <Chip size="small" label="블랙리스트" color="error" />}
            {item.suspendedAt && <Chip size="small" label="정지" color="error" />}
            <Chip size="small" label={`${item.approvedImageCount}/${item.totalActiveImageCount}장`} />
          </Stack>
          <ButtonBase
            aria-label="심사 상세 보기"
            onClick={() => setDetailOpen(true)}
            sx={{
              alignSelf: 'flex-start',
              border: '1px solid #cbd5e1',
              borderRadius: 1,
              px: 1,
              py: 0.5,
              fontSize: 13,
              fontWeight: 800,
              color: '#1d4ed8',
            }}
          >
            상세
          </ButtonBase>
        </Stack>
      </CardContent>
      <Dialog open={viewerOpen} onClose={() => setViewerOpen(false)} maxWidth="lg" fullWidth>
        <DialogContent
          sx={{
            p: 0,
            height: { xs: '80vh', md: '88vh' },
            bgcolor: '#020617',
            position: 'relative',
          }}
        >
          <IconButton
            aria-label="큰 이미지 닫기"
            onClick={() => setViewerOpen(false)}
            sx={{
              position: 'absolute',
              top: 10,
              right: 10,
              zIndex: 2,
              color: '#fff',
              bgcolor: 'rgba(15,23,42,0.72)',
              '&:hover': { bgcolor: 'rgba(15,23,42,0.9)' },
            }}
          >
            <X size={20} />
          </IconButton>
          <Box
            component="img"
            src={src}
            alt={`${item.profileImageId} 프로필 이미지 크게 보기`}
            sx={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              display: 'block',
              imageOrientation: 'from-image',
            }}
          />
        </DialogContent>
      </Dialog>
      <ProfileImageAuditDetailDrawer
        item={item}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
      />
    </Card>
  );
}
