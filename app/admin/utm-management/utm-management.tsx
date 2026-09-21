'use client';

import { useState } from 'react';
import { Box, Chip, Typography, Tabs, Tab } from '@mui/material';
import UtmLinkCreator from './components/utm-link-creator';
import UtmLinkList from './components/utm-link-list';
import UtmDashboard from './components/utm-dashboard';

type UtmManagementProps = {
  initialTab?: 0 | 1;
};

export default function UtmManagement({ initialTab = 0 }: UtmManagementProps) {
  const [tab, setTab] = useState(initialTab);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleCreated = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap', mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>
            UTM 추적 관리
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mt: 0.75 }}>
            링크 생성/운영과 Meta 오프라인 리드 어트리뷰션 성과를 분리해서 확인합니다.
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <Chip size="small" label="마케팅 > UTM 추적 관리" />
          <Chip size="small" color={tab === 1 ? 'primary' : 'default'} label={tab === 1 ? '성과 대시보드' : '링크 관리'} />
        </Box>
      </Box>

      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}
      >
        <Tab label="링크 생성/관리" />
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
