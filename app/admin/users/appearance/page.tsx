'use client';

import { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  Grid, 
  CircularProgress, 
  Alert, 
  Tabs, 
  Tab,
  Divider
} from '@mui/material';
import AdminService from '@/app/services/admin';
import { UserAppearanceGradeStatsResponse } from './types';
import AppearanceGradeStatsCard from '@/components/admin/appearance/AppearanceGradeStatsCard';
import UserAppearanceTable from '@/components/admin/appearance/UserAppearanceTable';
import AppearanceFilterPanel from '@/components/admin/appearance/AppearanceFilterPanel';
import UnclassifiedUsersPanel from '@/components/admin/appearance/UnclassifiedUsersPanel';

export default function AppearanceGradePage() {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<UserAppearanceGradeStatsResponse | null>(null);

  // 통계 데이터 로드
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await AdminService.userAppearance.getAppearanceGradeStats();
        setStats(response);
      } catch (err: any) {
        console.error('외모 등급 통계 조회 중 오류:', err);
        setError(err.message || '외모 등급 통계를 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        외모 등급 관리
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* 통계 카드 */}
      <Box sx={{ mb: 4 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : stats ? (
          <AppearanceGradeStatsCard stats={stats} />
        ) : null}
      </Box>

      <Divider sx={{ my: 3 }} />

      {/* 탭 메뉴 */}
      <Box sx={{ mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange} aria-label="외모 등급 관리 탭">
          <Tab label="전체 사용자" />
          <Tab label="미분류 사용자" />
        </Tabs>
      </Box>

      {/* 탭 컨텐츠 */}
      <Box>
        {activeTab === 0 && (
          <Box>
            <AppearanceFilterPanel />
            <UserAppearanceTable />
          </Box>
        )}
        {activeTab === 1 && (
          <UnclassifiedUsersPanel />
        )}
      </Box>
    </Box>
  );
}
