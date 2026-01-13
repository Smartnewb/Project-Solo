'use client';

import { useState } from 'react';
import {
  Box,
  Typography,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Chat as ChatIcon,
  AccountBalance as AccountBalanceIcon,
  Analytics as AnalyticsIcon,
} from '@mui/icons-material';
import ChatManagementTab from './components/ChatManagementTab';
import ChatRefundTab from './components/ChatRefundTab';
import ChatStatsTab from './components/ChatStatsTab';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`chat-tabpanel-${index}`}
      aria-labelledby={`chat-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
};

export default function ChatPage() {
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <ChatIcon />
        채팅 관리
      </Typography>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="채팅 관리 탭">
          <Tab
            label="채팅방 조회"
            icon={<ChatIcon />}
            iconPosition="start"
            id="chat-tab-0"
            aria-controls="chat-tabpanel-0"
          />
          <Tab
            label="채팅 환불"
            icon={<AccountBalanceIcon />}
            iconPosition="start"
            id="chat-tab-1"
            aria-controls="chat-tabpanel-1"
          />
          <Tab
            label="채팅 통계"
            icon={<AnalyticsIcon />}
            iconPosition="start"
            id="chat-tab-2"
            aria-controls="chat-tabpanel-2"
          />
        </Tabs>
      </Box>

      <TabPanel value={tabValue} index={0}>
        <ChatManagementTab />
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <ChatRefundTab />
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        <ChatStatsTab />
      </TabPanel>
    </Box>
  );
}
