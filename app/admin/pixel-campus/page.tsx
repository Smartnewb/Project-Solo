'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Box, Button, CircularProgress, Tab, Tabs, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import type { PixelCampusEpisodeStatus } from '@/types/admin';
import { STATUS_TABS } from './constants';
import { EpisodeListTab } from './components/EpisodeListTab';
import { EpisodeStatsDialog } from './components/EpisodeStatsDialog';

type TabValue = PixelCampusEpisodeStatus | 'all';

function PixelCampusPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentTab = ((searchParams.get('status') as TabValue) || 'all') as TabValue;
  const [statsEpisodeId, setStatsEpisodeId] = useState<string | null>(null);

  const setTab = (tab: TabValue) => {
    router.replace(`/admin/pixel-campus?status=${tab}`);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 2,
        }}
      >
        <Typography variant="h5" fontWeight="bold">
          픽셀 캠퍼스
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => router.push('/admin/pixel-campus/create')}
        >
          새 에피소드
        </Button>
      </Box>

      <Tabs value={currentTab} onChange={(_, value) => setTab(value)} sx={{ mb: 2 }}>
        {STATUS_TABS.map((tab) => (
          <Tab key={tab.value} value={tab.value} label={tab.label} />
        ))}
      </Tabs>

      <EpisodeListTab status={currentTab} onStatsClick={setStatsEpisodeId} />
      <EpisodeStatsDialog
        episodeId={statsEpisodeId}
        open={!!statsEpisodeId}
        onClose={() => setStatsEpisodeId(null)}
      />
    </Box>
  );
}

export default function PixelCampusPage() {
  return (
    <Suspense
      fallback={
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}>
          <CircularProgress />
        </Box>
      }
    >
      <PixelCampusPageInner />
    </Suspense>
  );
}
