'use client';

import { Box, CircularProgress, Typography } from '@mui/material';
import type { ProfileImageAuditItem, ProfileImageAuditProfileRank } from '@/app/services/admin';
import { ProfileImageAuditCard } from './ProfileImageAuditCard';

type Props = {
  readonly items: readonly ProfileImageAuditItem[];
  readonly selectedIds: ReadonlySet<string>;
  readonly loading: boolean;
  readonly onToggle: (profileImageId: string) => void;
  readonly onRankChange: (item: ProfileImageAuditItem, rank: ProfileImageAuditProfileRank) => void;
  readonly rankUpdatingUserId: string | null;
};

export function ProfileImageAuditGrid({
  items,
  selectedIds,
  loading,
  onToggle,
  onRankChange,
  rankUpdatingUserId,
}: Props) {
  if (loading) {
    return (
      <Box minHeight={360} display="flex" alignItems="center" justifyContent="center">
        <CircularProgress />
      </Box>
    );
  }

  if (items.length === 0) {
    return (
      <Box border="1px dashed #cbd5e1" borderRadius={2} p={5} textAlign="center">
        <Typography fontWeight={700}>검수할 이미지가 없습니다.</Typography>
        <Typography variant="body2" color="text.secondary" mt={0.5}>
          필터를 바꾸거나 이미 처리된 항목 포함 여부를 확인하세요.
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      display="grid"
      gap={1.5}
      gridTemplateColumns={{
        xs: 'repeat(2, minmax(0, 1fr))',
        sm: 'repeat(3, minmax(0, 1fr))',
        md: 'repeat(4, minmax(0, 1fr))',
      }}
    >
      {items.map((item) => (
        <ProfileImageAuditCard
          key={item.profileImageId}
          item={item}
          selected={selectedIds.has(item.profileImageId)}
          onToggle={onToggle}
          onRankChange={onRankChange}
          rankUpdating={rankUpdatingUserId === item.userId}
        />
      ))}
    </Box>
  );
}
