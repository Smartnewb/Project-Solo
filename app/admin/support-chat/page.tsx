'use client';

import { useState } from 'react';
import {
  Box,
  Typography,
  Tabs,
  Tab,
} from '@mui/material';
import {
  SupportAgent as SupportAgentIcon,
  Pending as PendingIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import SessionListTab from './components/SessionListTab';
import type { SupportSessionStatus } from '@/app/types/support-chat';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel = ({ children, value, index, ...other }: TabPanelProps) => {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`support-chat-tabpanel-${index}`}
      aria-labelledby={`support-chat-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
};

type TabConfig = {
  label: string;
  icon: React.ReactElement;
  status?: SupportSessionStatus;
};

const TAB_CONFIG: TabConfig[] = [
  { label: '대기 중', icon: <PendingIcon />, status: 'waiting_admin' },
  { label: '응대 중', icon: <SupportAgentIcon />, status: 'admin_handling' },
  { label: '해결 완료', icon: <CheckCircleIcon />, status: 'resolved' },
  { label: '전체', icon: <SupportAgentIcon />, status: undefined },
];

export default function SupportChatPage() {
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <SupportAgentIcon />
        Q&A 처리
      </Typography>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="Q&A 처리 탭">
          {TAB_CONFIG.map((tab, index) => (
            <Tab
              key={tab.label}
              label={tab.label}
              icon={tab.icon}
              iconPosition="start"
              id={`support-chat-tab-${index}`}
              aria-controls={`support-chat-tabpanel-${index}`}
            />
          ))}
        </Tabs>
      </Box>

      {TAB_CONFIG.map((tab, index) => (
        <TabPanel key={tab.label} value={tabValue} index={index}>
          <SessionListTab statusFilter={tab.status} />
        </TabPanel>
      ))}
    </Box>
  );
}
