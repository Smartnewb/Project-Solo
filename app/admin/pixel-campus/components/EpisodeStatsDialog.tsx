'use client';

import {
  Alert,
  Box,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { usePixelCampusEpisodeStats } from '@/app/admin/hooks/use-pixel-campus';
import { getAdminErrorMessage } from '@/shared/lib/http/admin-fetch';

interface Props {
  episodeId: string | null;
  open: boolean;
  onClose: () => void;
}

export function EpisodeStatsDialog({ episodeId, open, onClose }: Props) {
  const statsQuery = usePixelCampusEpisodeStats(episodeId, open);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ pr: 6 }}>
        선택지별 참여 통계
        <IconButton
          aria-label="닫기"
          onClick={onClose}
          size="small"
          sx={{ position: 'absolute', right: 12, top: 12 }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        {statsQuery.isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : statsQuery.error ? (
          <Alert severity="error">
            {getAdminErrorMessage(statsQuery.error, '통계를 불러오지 못했습니다.')}
          </Alert>
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>선택지</TableCell>
                <TableCell align="right">전체</TableCell>
                <TableCell align="right">남</TableCell>
                <TableCell align="right">여</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(statsQuery.data?.choices ?? []).map((choice) => (
                <TableRow key={choice.choiceId}>
                  <TableCell>{choice.label}</TableCell>
                  <TableCell align="right">{choice.total}</TableCell>
                  <TableCell align="right">{choice.male}</TableCell>
                  <TableCell align="right">{choice.female}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </DialogContent>
    </Dialog>
  );
}
