'use client';

import { useRouter } from 'next/navigation';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material';
import BarChartIcon from '@mui/icons-material/BarChart';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';
import type { PixelCampusEpisodeStatus } from '@/types/admin';
import { usePixelCampusEpisodes } from '@/app/admin/hooks/use-pixel-campus';
import { getAdminErrorMessage } from '@/shared/lib/http/admin-fetch';
import { formatDateTime } from '../constants';
import { PixelCampusStatusBadge } from './PixelCampusStatusBadge';

interface Props {
  status: PixelCampusEpisodeStatus | 'all';
  onStatsClick: (episodeId: string) => void;
}

export function EpisodeListTab({ status, onStatsClick }: Props) {
  const router = useRouter();
  const episodesQuery = usePixelCampusEpisodes({ status, page: 1, limit: 50 });

  if (episodesQuery.isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (episodesQuery.error) {
    return (
      <Alert severity="error">
        {getAdminErrorMessage(episodesQuery.error, '에피소드 목록을 불러오지 못했습니다.')}
      </Alert>
    );
  }

  const episodes = episodesQuery.data?.items ?? [];

  if (!episodes.length) {
    return (
      <Paper variant="outlined" sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          표시할 에피소드가 없습니다.
        </Typography>
      </Paper>
    );
  }

  return (
    <TableContainer component={Paper} variant="outlined">
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>챕터-화</TableCell>
            <TableCell>제목</TableCell>
            <TableCell>상태</TableCell>
            <TableCell>공개일</TableCell>
            <TableCell align="right">참여수</TableCell>
            <TableCell align="right">액션</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {episodes.map((episode) => (
            <TableRow
              key={episode.id}
              hover
              sx={{ cursor: 'pointer' }}
              onClick={() => router.push(`/admin/pixel-campus/edit/${episode.id}`)}
            >
              <TableCell>
                {episode.chapterNo}-{episode.episodeNo}
              </TableCell>
              <TableCell>
                <Typography variant="body2" fontWeight={600}>
                  {episode.title}
                </Typography>
              </TableCell>
              <TableCell>
                <PixelCampusStatusBadge status={episode.status} />
              </TableCell>
              <TableCell>{formatDateTime(episode.publishAt)}</TableCell>
              <TableCell align="right">{episode.answerCount ?? 0}</TableCell>
              <TableCell align="right">
                <Tooltip title="상세">
                  <IconButton
                    size="small"
                    onClick={(event) => {
                      event.stopPropagation();
                      router.push(`/admin/pixel-campus/edit/${episode.id}`);
                    }}
                  >
                    <VisibilityIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="편집">
                  <IconButton
                    size="small"
                    onClick={(event) => {
                      event.stopPropagation();
                      router.push(`/admin/pixel-campus/edit/${episode.id}`);
                    }}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="통계">
                  <IconButton
                    size="small"
                    onClick={(event) => {
                      event.stopPropagation();
                      onStatsClick(episode.id);
                    }}
                  >
                    <BarChartIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
