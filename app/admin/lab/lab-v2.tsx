'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Science as ScienceIcon,
  PhotoCamera as PhotoCameraIcon,
} from '@mui/icons-material';
import VisionPhotoTestTab from './components/VisionPhotoTestTab';
import { patchAdminAxios } from '@/shared/lib/http/admin-axios-interceptor';

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
      id={`lab-tabpanel-${index}`}
      aria-labelledby={`lab-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
};

function LabPageContent() {
  useEffect(() => {
    const unpatch = patchAdminAxios();
    return () => unpatch();
  }, []);

  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <ScienceIcon />
        실험실
      </Typography>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="실험실 탭">
          <Tab
            label="VISION 프로필 심사"
            icon={<PhotoCameraIcon />}
            iconPosition="start"
            id="lab-tab-0"
            aria-controls="lab-tabpanel-0"
          />
        </Tabs>
      </Box>

      <TabPanel value={tabValue} index={0}>
        <VisionPhotoTestTab />
      </TabPanel>
    </Box>
  );
}

export default function LabV2() {
  return <LabPageContent />;
}
