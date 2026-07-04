'use client';

import { Box, Typography } from '@mui/material';
import { EpisodeForm } from '../components/EpisodeForm';

export default function PixelCampusCreatePage() {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" fontWeight="bold" sx={{ mb: 2 }}>
        픽셀 캠퍼스 에피소드 작성
      </Typography>
      <EpisodeForm mode="create" />
    </Box>
  );
}
