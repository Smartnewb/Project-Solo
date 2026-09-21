'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Typography,
} from '@mui/material';
import SyncAltIcon from '@mui/icons-material/SyncAlt';
import { usePixelCampusEpisode } from '@/app/admin/hooks/use-pixel-campus';
import { getAdminErrorMessage } from '@/shared/lib/http/admin-fetch';
import { EpisodeForm } from '../../components/EpisodeForm';
import { PixelCampusStatusBadge } from '../../components/PixelCampusStatusBadge';
import { StatusActionDialog } from '../../components/StatusActionDialog';

export default function PixelCampusEditPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const episodeId = params.id;
  const episodeQuery = usePixelCampusEpisode(episodeId);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);

  if (episodeQuery.isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (episodeQuery.error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {getAdminErrorMessage(episodeQuery.error, '에피소드를 불러오지 못했습니다.')}
        </Alert>
        <Button onClick={() => router.push('/admin/pixel-campus')}>목록으로</Button>
      </Box>
    );
  }

  const episode = episodeQuery.data;

  if (!episode) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">에피소드를 찾을 수 없습니다.</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 2,
          gap: 2,
        }}
      >
        <Box>
          <Typography variant="h5" fontWeight="bold" sx={{ mb: 1 }}>
            픽셀 캠퍼스 에피소드 편집
          </Typography>
          <PixelCampusStatusBadge status={episode.status} />
        </Box>
        <Button
          variant="outlined"
          startIcon={<SyncAltIcon />}
          onClick={() => setStatusDialogOpen(true)}
        >
          상태 변경
        </Button>
      </Box>

      <EpisodeForm key={episode.id} mode="edit" episode={episode} />
      <StatusActionDialog
        open={statusDialogOpen}
        episode={episode}
        onClose={() => setStatusDialogOpen(false)}
        onSuccess={() => episodeQuery.refetch()}
      />
    </Box>
  );
}
