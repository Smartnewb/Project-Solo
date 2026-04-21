'use client';

import { Box, Chip } from '@mui/material';
import type { ContentCategoryCode, NoticeCategoryCode } from '@/types/admin';

const NEW_LABELS: Record<ContentCategoryCode | NoticeCategoryCode, string> = {
  relationship: '연애',
  dating: '데이트',
  psychology: '심리',
  essay: '에세이',
  qna: '질의응답',
  event: '이벤트',
  notice: '공지',
};

const LEGACY_LABELS: Record<string, string> = {
  story: '스토리',
  interview: '인터뷰',
  tips: '팁',
  team: '팀 소개',
  update: '업데이트',
  safety: '안전',
};

export function CategoryBadge({ code }: { code: string }) {
  const isNew = code in NEW_LABELS;
  const label =
    NEW_LABELS[code as keyof typeof NEW_LABELS] || LEGACY_LABELS[code] || code;
  return (
    <Box sx={{ display: 'inline-flex', gap: 0.5 }}>
      <Chip label={label} size="small" />
      {!isNew && (
        <Chip
          label="레거시"
          size="small"
          color="default"
          variant="outlined"
          sx={{ opacity: 0.6 }}
        />
      )}
    </Box>
  );
}
