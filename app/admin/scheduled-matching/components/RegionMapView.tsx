'use client';

import dynamic from 'next/dynamic';
import { Box, CircularProgress } from '@mui/material';
import type { MatchingPoolStatsResponse } from '@/types/admin';

const RegionMapCore = dynamic(() => import('./RegionMapCore'), {
  ssr: false,
  loading: () => (
    <Box
      sx={{
        height: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'grey.100',
        borderRadius: 2,
      }}
    >
      <CircularProgress />
    </Box>
  ),
});

interface RegionMapViewProps {
  data: MatchingPoolStatsResponse;
}

export default function RegionMapView({ data }: RegionMapViewProps) {
  return <RegionMapCore data={data} />;
}
