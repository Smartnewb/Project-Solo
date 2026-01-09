'use client';

import dynamic from 'next/dynamic';
import { Box, CircularProgress } from '@mui/material';
import type { MatchingPoolCountry, MatchingPoolRegionStats } from '@/types/admin';

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

export interface RegionMapData {
  country: MatchingPoolCountry;
  regions: MatchingPoolRegionStats[];
}

interface RegionMapViewProps {
  data: RegionMapData;
}

export default function RegionMapView({ data }: RegionMapViewProps) {
  return <RegionMapCore data={data} />;
}
