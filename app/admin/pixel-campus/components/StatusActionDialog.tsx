'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from '@mui/material';
import type {
  PixelCampusEpisode,
  PixelCampusEpisodeStatus,
} from '@/types/admin';
import { useUpdatePixelCampusStatus } from '@/app/admin/hooks/use-pixel-campus';
import { getAdminErrorMessage } from '@/shared/lib/http/admin-fetch';
import {
  fromDateTimeLocal,
  nextNinePmLocal,
  STATUS_LABELS,
} from '../constants';
import { EpisodePreview } from './EpisodePreview';

const TRANSITIONS: Record<PixelCampusEpisodeStatus, PixelCampusEpisodeStatus[]> = {
  draft: ['in_review'],
  in_review: ['draft', 'scheduled', 'published'],
  scheduled: ['draft', 'published'],
  published: ['archived'],
  archived: [],
};

function transitionLabel(status: PixelCampusEpisodeStatus) {
  if (status === 'draft') return '반려';
  return STATUS_LABELS[status] ?? status;
}

interface Props {
  open: boolean;
  episode: PixelCampusEpisode | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export function StatusActionDialog({ open, episode, onClose, onSuccess }: Props) {
  const allowedStatuses = useMemo(
    () => (episode ? TRANSITIONS[episode.status] : []),
    [episode],
  );
  const [nextStatus, setNextStatus] = useState<PixelCampusEpisodeStatus | ''>('');
  const [publishAt, setPublishAt] = useState('');
  const [error, setError] = useState<string | null>(null);
  const updateStatus = useUpdatePixelCampusStatus();

  useEffect(() => {
    if (open && episode) {
      const defaultStatus = allowedStatuses[0] ?? '';
      setNextStatus(defaultStatus);
      setPublishAt(defaultStatus === 'scheduled' ? nextNinePmLocal() : '');
      setError(null);
    }
  }, [allowedStatuses, episode, open]);

  const handleStatusChange = (status: PixelCampusEpisodeStatus) => {
    setNextStatus(status);
    if (status === 'scheduled' && !publishAt) {
      setPublishAt(nextNinePmLocal());
    }
  };

  const handleConfirm = async () => {
    if (!episode || !nextStatus) return;
    if (nextStatus === 'scheduled' && !publishAt) {
      setError('예약 발행 시각을 입력해주세요.');
      return;
    }

    setError(null);
    try {
      await updateStatus.mutateAsync({
        id: episode.id,
        payload: {
          status: nextStatus,
          publishAt: nextStatus === 'scheduled' ? fromDateTimeLocal(publishAt) : undefined,
        },
      });
      onSuccess?.();
      onClose();
    } catch (statusError) {
      setError(getAdminErrorMessage(statusError, '상태 변경에 실패했습니다.'));
    }
  };

  return (
    <Dialog open={open && !!episode} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>상태 변경</DialogTitle>
      <DialogContent dividers>
        {episode && (
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1fr) 390px' }, gap: 3 }}>
            <Box>
              {error && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                  {error}
                </Alert>
              )}
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                현재 상태는 {STATUS_LABELS[episode.status]}입니다.
              </Typography>

              {allowedStatuses.length ? (
                <>
                  <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                    <InputLabel id="pixel-campus-next-status">다음 상태</InputLabel>
                    <Select
                      labelId="pixel-campus-next-status"
                      label="다음 상태"
                      value={nextStatus}
                      onChange={(event) => handleStatusChange(event.target.value as PixelCampusEpisodeStatus)}
                    >
                      {allowedStatuses.map((status) => (
                        <MenuItem key={status} value={status}>
                          {transitionLabel(status)}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  {nextStatus === 'scheduled' && (
                    <TextField
                      label="예약 발행 시각"
                      type="datetime-local"
                      value={publishAt}
                      onChange={(event) => setPublishAt(event.target.value)}
                      InputLabelProps={{ shrink: true }}
                      fullWidth
                      helperText="기본값은 다음 21:00입니다."
                    />
                  )}
                </>
              ) : (
                <Alert severity="info">현재 상태에서 가능한 전환이 없습니다.</Alert>
              )}
            </Box>
            <EpisodePreview
              sceneImageUrl={episode.sceneImageUrl}
              cuts={episode.cuts?.length ? episode.cuts : [{ speaker: 'miho', text: episode.situationText }]}
              choices={episode.choices}
            />
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={updateStatus.isPending}>
          취소
        </Button>
        <Button
          variant="contained"
          onClick={handleConfirm}
          disabled={!nextStatus || updateStatus.isPending}
        >
          {updateStatus.isPending ? '변경 중...' : '변경'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
