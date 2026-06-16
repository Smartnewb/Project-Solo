'use client';

import {
  Box,
  Button,
  Chip,
  Divider,
  Drawer,
  Link,
  Stack,
  Typography,
} from '@mui/material';
import { ExternalLink, X } from 'lucide-react';
import type { ProfileImageAuditItem } from '@/app/services/admin';
import {
  formatAuditStatus,
  formatValidationDecision,
  formatValidationSummary,
} from '../profile-image-audit-utils';

type Props = {
  readonly item: ProfileImageAuditItem;
  readonly open: boolean;
  readonly onClose: () => void;
};

type Metric = {
  readonly label: string;
  readonly value: string;
};

function formatDate(value: string | null | undefined): string {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function countText(value: number | null | undefined): string {
  return (value ?? 0).toLocaleString();
}

function getMetrics(item: ProfileImageAuditItem): readonly Metric[] {
  const context = item.reviewContext;
  return [
    { label: '가입일', value: formatDate(context?.userCreatedAt) },
    { label: '좋아요', value: countText(context?.receivedLikeCount) },
    { label: '매칭', value: countText(context?.matchCount) },
    { label: '채팅', value: countText(context?.chatRoomCount) },
  ];
}

export function ProfileImageAuditDetailDrawer({ item, open, onClose }: Props) {
  const context = item.reviewContext;
  const reportCount = context?.reportCount ?? item.riskSignals.reportCount;
  const hasSuspension = context?.hasSuspensionHistory ?? item.riskSignals.hasSuspensionHistory;
  const isFirstReview = context?.isFirstReview ?? item.riskSignals.isFirstReview;
  const isUniversityVerified =
    context?.isUniversityVerified ?? item.riskSignals.isUniversityVerified;
  const hasPurchased = context?.hasPurchased ?? item.riskSignals.hasPurchaseHistory;
  const rejectionHistory = item.rejectionHistory ?? [];
  const rejectedImages = item.rejectedImages ?? [];

  return (
    <Drawer anchor="right" open={open} onClose={onClose}>
      <Box sx={{ width: { xs: 360, sm: 520 }, maxWidth: '100vw', p: 2.5 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6" component="h2" fontWeight={800}>
            심사 상세
          </Typography>
          <Button size="small" startIcon={<X size={16} />} onClick={onClose}>
            닫기
          </Button>
        </Stack>

        <Stack spacing={2}>
          {(reportCount > 0 || hasSuspension) && (
            <Box sx={{ border: '1px solid #fecaca', bgcolor: '#fef2f2', borderRadius: 1, p: 1.5 }}>
              {reportCount > 0 && <Typography fontWeight={800}>신고 {reportCount}회</Typography>}
              {hasSuspension && <Typography color="error.main">제재 이력 있음</Typography>}
            </Box>
          )}

          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
            {isFirstReview && <Chip size="small" label="첫 심사" color="info" variant="outlined" />}
            {isUniversityVerified && <Chip size="small" label="학교 인증" color="success" variant="outlined" />}
            {hasPurchased && <Chip size="small" label="구매 이력" color="warning" variant="outlined" />}
            {item.isBlacklisted && <Chip size="small" label="블랙리스트" color="error" />}
            {item.suspendedAt && <Chip size="small" label="정지 계정" color="error" />}
          </Stack>

          <Box>
            <Typography variant="subtitle2" fontWeight={800} mb={1}>
              연관 사진
            </Typography>
            <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
              {item.siblingImages.map((image, index) => (
                <Box key={image.profileImageId} sx={{ width: 82 }}>
                  <Box
                    component="img"
                    src={image.thumbnailUrl ?? image.imageUrl}
                    alt={`연관 사진 ${index + 1}`}
                    sx={{
                      width: 82,
                      height: 96,
                      objectFit: 'cover',
                      borderRadius: 1,
                      border: image.profileImageId === item.profileImageId ? '2px solid #2563eb' : '1px solid #cbd5e1',
                    }}
                  />
                  <Typography variant="caption" display="block" noWrap>
                    {image.isMain ? '대표' : `${image.slotIndex + 1}번`} · {image.reviewStatus}
                  </Typography>
                </Box>
              ))}
            </Stack>
          </Box>

          <Divider />

          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 1 }}>
            {getMetrics(item).map((metric) => (
              <Box key={metric.label} sx={{ border: '1px solid #e2e8f0', borderRadius: 1, p: 1 }}>
                <Typography variant="caption" color="text.secondary">{metric.label}</Typography>
                <Typography variant="body2" fontWeight={800}>{metric.value}</Typography>
              </Box>
            ))}
          </Box>

          <Box>
            <Typography variant="subtitle2" fontWeight={800}>이전 거절 이력</Typography>
            {rejectionHistory.length === 0 ? (
              <Typography variant="body2" color="text.secondary">없음</Typography>
            ) : (
              rejectionHistory.map((history) => (
                <Typography key={`${history.createdAt}-${history.reason}`} variant="body2">
                  {history.category} · {history.reason} · {formatDate(history.createdAt)}
                </Typography>
              ))
            )}
          </Box>

          <Box>
            <Typography variant="subtitle2" fontWeight={800}>거절된 이미지 이력</Typography>
            {rejectedImages.length === 0 ? (
              <Typography variant="body2" color="text.secondary">없음</Typography>
            ) : (
              <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" mt={1}>
                {rejectedImages.map((image, index) => (
                  <Box key={image.id} sx={{ width: 76 }}>
                    <Box
                      component="img"
                      src={image.imageUrl}
                      alt={`거절된 이미지 ${index + 1}`}
                      sx={{ width: 76, height: 88, objectFit: 'cover', borderRadius: 1 }}
                    />
                    <Typography variant="caption" display="block" noWrap>
                      {image.rejectionReason}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            )}
          </Box>

          <Box>
            <Typography variant="subtitle2" fontWeight={800}>소개글</Typography>
            <Typography variant="body2" color={item.bio ? 'text.primary' : 'text.secondary'}>
              {item.bio ?? '없음'}
            </Typography>
          </Box>

          <Box sx={{ border: '1px solid #e2e8f0', borderRadius: 1, p: 1.5 }}>
            <Typography variant="subtitle2" fontWeight={800}>검증 요약</Typography>
            {[
              { label: '검증 점수', value: String(item.validation?.totalScore ?? '-') },
              { label: '자동 판정', value: formatValidationDecision(item.validation?.autoDecision ?? null) },
              { label: '판정 사유', value: item.validation?.decisionReason ?? '-' },
              { label: '카드 표시', value: formatValidationSummary(item) },
              { label: '감사 상태', value: formatAuditStatus(item.auditStatus) },
            ].map((row) => (
              <Stack key={row.label} direction="row" spacing={1} justifyContent="space-between">
                <Typography variant="body2" color="text.secondary">{row.label}</Typography>
                <Typography variant="body2" fontWeight={700}>{row.value}</Typography>
              </Stack>
            ))}
          </Box>

          <Link
            href={`/admin/users/appearance?userId=${encodeURIComponent(item.userId)}`}
            underline="hover"
            sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75, fontWeight: 800 }}
          >
            사용자 상세에서 열기
            <ExternalLink size={15} />
          </Link>
        </Stack>
      </Box>
    </Drawer>
  );
}
