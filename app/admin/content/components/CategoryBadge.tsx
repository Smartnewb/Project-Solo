'use client';

import { Box, Chip } from '@mui/material';
import {
  LEGACY_CATEGORY_LABELS,
  NEW_CATEGORY_OPTIONS,
  NOTICE_CATEGORY_LABEL,
} from '../constants';

const NEW_LABELS: Record<string, string> = {
  ...Object.fromEntries(NEW_CATEGORY_OPTIONS.map((o) => [o.code, o.label])),
  notice: NOTICE_CATEGORY_LABEL,
};

export function CategoryBadge({ code }: { code: string }) {
  const isNew = code in NEW_LABELS;
  const label = NEW_LABELS[code] || LEGACY_CATEGORY_LABELS[code] || code;
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
