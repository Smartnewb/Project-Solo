'use client';

import { Tabs, Tab, Box } from '@mui/material';

export type RecipientMode = 'filter' | 'userIds';

interface Props {
  mode: RecipientMode;
  onChange: (next: RecipientMode) => void;
  disabled?: boolean;
}

export function RecipientModeToggle({ mode, onChange, disabled }: Props) {
  return (
    <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
      <Tabs value={mode} onChange={(_, v) => onChange(v as RecipientMode)}>
        <Tab value="filter" label="조건 필터" disabled={disabled} />
        <Tab value="userIds" label="사용자 직접 검색" disabled={disabled} />
      </Tabs>
    </Box>
  );
}
