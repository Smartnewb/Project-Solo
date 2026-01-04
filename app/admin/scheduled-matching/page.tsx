'use client';

import React, { useState } from 'react';
import { Box, Typography, Tabs, Tab } from '@mui/material';
import CountryOverview from './components/CountryOverview';
import ScheduleConfig from './components/ScheduleConfig';
import BatchHistory from './components/BatchHistory';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel({ children, value, index, ...other }: TabPanelProps) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`schedule-tabpanel-${index}`}
      aria-labelledby={`schedule-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

export default function ScheduledMatchingPage() {
  const [activeTab, setActiveTab] = useState(0);

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        스케줄 관리
      </Typography>

      <Tabs value={activeTab} onChange={handleTabChange} aria-label="스케줄 관리 탭">
        <Tab label="국가별 현황" />
        <Tab label="스케줄 설정" />
        <Tab label="배치 히스토리" />
      </Tabs>

      <TabPanel value={activeTab} index={0}>
        <CountryOverview />
      </TabPanel>

      <TabPanel value={activeTab} index={1}>
        <ScheduleConfig />
      </TabPanel>

      <TabPanel value={activeTab} index={2}>
        <BatchHistory />
      </TabPanel>
    </Box>
  );
}
