'use client';

import { Button, Stack, Typography } from '@mui/material';
import {
  CheckCircle2,
  CheckSquare,
  Eye,
  ShieldBan,
  Trash2,
  XCircle,
} from 'lucide-react';
import type { AuditAction, SelectedAuditGroup } from '../types';

type Props = {
  readonly group: SelectedAuditGroup;
  readonly visibleCount: number;
  readonly busy: boolean;
  readonly onSelectVisible: () => void;
  readonly onAction: (action: AuditAction) => void;
  readonly onBlacklist: () => void;
};

export function AuditBulkToolbar({
  group,
  visibleCount,
  busy,
  onSelectVisible,
  onAction,
  onBlacklist,
}: Props) {
  const disabled = group.selectedIds.length === 0 || busy;
  const selectVisibleDisabled = visibleCount === 0 || busy;
  const blacklistDisabled = disabled || group.selectedUserIds.length !== 1;

  return (
    <Stack
      direction={{ xs: 'column', md: 'row' }}
      spacing={1}
      alignItems={{ xs: 'stretch', md: 'center' }}
      justifyContent="space-between"
      sx={{ border: '1px solid #dbe3ef', borderRadius: 2, p: 1.5, bgcolor: '#f8fafc' }}
    >
      <Typography variant="body2" fontWeight={700}>
        선택 {group.selectedIds.length.toLocaleString()}장
        {group.selectedUserIds.length > 1 ? ` · ${group.selectedUserIds.length}명` : ''}
      </Typography>
      <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
        <Button
          size="small"
          variant="outlined"
          startIcon={<CheckSquare size={16} />}
          disabled={selectVisibleDisabled}
          onClick={onSelectVisible}
        >
          전체선택
        </Button>
        <Button
          size="small"
          variant="contained"
          color="success"
          startIcon={<CheckCircle2 size={16} />}
          disabled={disabled}
          onClick={() => onAction('mark-ok')}
        >
          정상 처리
        </Button>
        <Button
          size="small"
          variant="outlined"
          color="warning"
          startIcon={<Eye size={16} />}
          disabled={disabled}
          onClick={() => onAction('second-review')}
        >
          2차 검토
        </Button>
        <Button
          size="small"
          variant="outlined"
          startIcon={<XCircle size={16} />}
          disabled={disabled}
          onClick={() => onAction('reject')}
        >
          사진 변경 요청
        </Button>
        <Button
          size="small"
          variant="outlined"
          color="error"
          startIcon={<Trash2 size={16} />}
          disabled={disabled}
          onClick={() => onAction('delete')}
        >
          즉시 삭제
        </Button>
        <Button
          size="small"
          variant="outlined"
          color="error"
          startIcon={<ShieldBan size={16} />}
          disabled={blacklistDisabled}
          onClick={onBlacklist}
        >
          블랙리스트
        </Button>
      </Stack>
    </Stack>
  );
}
