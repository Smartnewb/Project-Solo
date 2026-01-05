'use client';

import { useState } from 'react';
import {
  Box,
  Typography,
  Tabs,
  Tab,
} from '@mui/material';
import QuestionGenerationTab from './components/QuestionGenerationTab';
import QuestionListTab from './components/QuestionListTab';
import QuestionTranslationTab from './components/QuestionTranslationTab';

type TabValue = 'generation' | 'list' | 'translation';

export default function MomentManagementPage() {
  const [tabValue, setTabValue] = useState<TabValue>('list');

  const handleTabChange = (_: React.SyntheticEvent, newValue: TabValue) => {
    setTabValue(newValue);
  };

  return (
    <Box>
      <Typography variant="h5" fontWeight="bold" sx={{ mb: 3 }}>
        모먼트 관리
      </Typography>

      <Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 3 }}>
        <Tab label="질문 목록" value="list" />
        <Tab label="질문 생성" value="generation" />
        <Tab label="질문 번역" value="translation" />
      </Tabs>

      {tabValue === 'list' && <QuestionListTab />}
      {tabValue === 'generation' && <QuestionGenerationTab />}
      {tabValue === 'translation' && <QuestionTranslationTab />}
    </Box>
  );
}
