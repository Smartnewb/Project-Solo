'use client';

import { useState } from 'react';
import { Box, Typography, Tabs, Tab } from '@mui/material';
import UtmLinkCreator from './components/utm-link-creator';
import UtmLinkList from './components/utm-link-list';
import UtmDashboard from './components/utm-dashboard';

export default function UtmManagement() {
  const [tab, setTab] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleCreated = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} sx={{ mb: 3 }}>
        UTM 추적 관리
      </Typography>

      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}
      >
        <Tab label="링크 관리" />
        <Tab label="성과 대시보드" />
      </Tabs>

      {tab === 0 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <UtmLinkCreator onCreated={handleCreated} />
          <UtmLinkList refreshKey={refreshKey} />
        </Box>
      )}

      {tab === 1 && <UtmDashboard />}
    </Box>
  );
}
