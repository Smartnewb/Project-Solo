'use client';

import { useState, useEffect } from 'react';
import { Grid, Card, CardContent, Typography, Box, Alert, CircularProgress, Divider } from '@mui/material';
import { useRouter } from 'next/navigation';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ko } from 'date-fns/locale';
import TotalUsersCard from '@/components/admin/dashboard/TotalUsersCard';
import DailySignupsCard from '@/components/admin/dashboard/DailySignupsCard';
import WeeklySignupsCard from '@/components/admin/dashboard/WeeklySignupsCard';
import GenderStatsCard from '@/components/admin/dashboard/GenderStatsCard';
import UniversityStatsCard from '@/components/admin/dashboard/UniversityStatsCard';
import UserActivityDashboard from '@/components/admin/dashboard/UserActivityDashboard';
import SignupStatsDashboard from '@/components/admin/dashboard/SignupStatsDashboard';
import AdminService from '@/app/services/admin';

// 회원 탈퇴 통계 컴포넌트
import WithdrawalStatsCard from '@/components/admin/dashboard/WithdrawalStatsCard';
import WithdrawalStatsDashboard from '@/components/admin/dashboard/WithdrawalStatsDashboard';
import WithdrawalReasonStats from '@/components/admin/dashboard/WithdrawalReasonStats';
import ServiceDurationStats from '@/components/admin/dashboard/ServiceDurationStats';
import ChurnRateStats from '@/components/admin/dashboard/ChurnRateStats';



export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [authChecking, setAuthChecking] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  // 관리자 인증 확인 - 이제 layout.tsx에서 처리하므로 간소화
  useEffect(() => {
    // 클라이언트 사이드에서만 실행
    if (typeof window === 'undefined') return;

    const checkAuth = async () => {
      try {
        setAuthChecking(true);
        console.log('대시보드 페이지 로드됨');
        setAuthError(null);
      } catch (error) {
        console.error('대시보드 초기화 오류:', error);
      } finally {
        setAuthChecking(false);
      }
    };

    checkAuth();
  }, []);

  // 통계 데이터 가져오기
  useEffect(() => {
    // 클라이언트 사이드에서만 실행
    if (typeof window === 'undefined') return;

    // 인증 중이거나 인증 오류가 있으면 통계 데이터를 가져오지 않음
    if (authChecking || authError) return;

    const fetchStats = async () => {
      try {
        setLoading(true);
        console.log('대시보드 통계 데이터 요청 시작');

        // 어드민 토큰 확인
        const token = localStorage.getItem('admin_access_token');
        if (!token) {
          console.error('어드민 토큰이 없어 통계 데이터를 가져올 수 없습니다.');
          return;
        }

        // API 요청 URL 수정 (백엔드 서버 URL 사용)
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8045';
        console.log('통계 데이터 요청 URL:', `${apiUrl}/api/admin/stats`);

        const response = await fetch(`${apiUrl}/api/admin/stats`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          credentials: 'include' // 쿠키 전송을 위해 필요
        });

        if (response.ok) {
          const data = await response.json();
          console.log('대시보드 통계 데이터 응답:', data);
          setStats(data);
        } else {
          console.error('통계 데이터 요청 실패:', response.status, response.statusText);
        }
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 60000); // 1분마다 갱신

    return () => clearInterval(interval);
  }, [authChecking, authError]);

  // 인증 확인 중이거나 인증 오류가 있으면 로딩 화면 또는 오류 메시지 표시
  if (authChecking) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>
          관리자 권한 확인 중...
        </Typography>
      </Box>
    );
  }

  if (authError) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column' }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {authError}
        </Alert>
        <Typography variant="body1">
          잠시 후 로그인 페이지로 이동합니다...
        </Typography>
      </Box>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ko}>
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          관리자 대시보드
        </Typography>

        {/* Summary Cards */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <TotalUsersCard />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <WeeklySignupsCard />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <DailySignupsCard />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  총 매칭 수
                </Typography>
                <Typography variant="h4">
                  {loading ? '로딩 중...' : stats?.totalMatches.toLocaleString() || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* 성별 통계 카드 */}
        <Box sx={{ mt: 4, mb: 4 }}>
          <GenderStatsCard />
        </Box>

        {/* 회원가입 통계 대시보드 */}
        <Box sx={{ mt: 4, mb: 4 }}>
          <SignupStatsDashboard />
        </Box>

        {/* 대학별 통계 카드 */}
        <Box sx={{ mt: 4, mb: 4 }}>
          <UniversityStatsCard />
        </Box>

        {/* 사용자 활동 지표 */}
        <Box sx={{ mt: 4, mb: 4 }}>
          <UserActivityDashboard />
        </Box>

        <Divider sx={{ my: 6 }} />

        <Typography variant="h5" gutterBottom sx={{ mt: 6, mb: 4 }}>
          회원 탈퇴 통계
        </Typography>

        {/* 회원 탈퇴 통계 카드 */}
        <Box sx={{ mt: 4, mb: 4 }}>
          <WithdrawalStatsCard />
        </Box>

        {/* 회원 탈퇴 추이 대시보드 */}
        <Box sx={{ mt: 4, mb: 4 }}>
          <WithdrawalStatsDashboard />
        </Box>

        {/* 탈퇴 사유 통계 */}
        <Box sx={{ mt: 4, mb: 4 }}>
          <WithdrawalReasonStats />
        </Box>

        {/* 서비스 사용 기간 통계 */}
        <Box sx={{ mt: 4, mb: 4 }}>
          <ServiceDurationStats />
        </Box>

        {/* 이탈률 통계 */}
        <Box sx={{ mt: 4, mb: 4 }}>
          <ChurnRateStats />
        </Box>

      </Box>
    </LocalizationProvider>
  );
}
