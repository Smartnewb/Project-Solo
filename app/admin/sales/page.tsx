'use client';

import { useState, useEffect } from 'react';
import { Box, Typography, Alert, CircularProgress, Divider } from '@mui/material';
import { useRouter } from 'next/navigation';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ko } from 'date-fns/locale';
import SalesStatsCard from '@/components/admin/dashboard/SalesStatsCard';
import SalesTrendChart from '@/components/admin/dashboard/SalesTrendChart';
import PaymentSuccessRateCard from '@/components/admin/dashboard/PaymentSuccessRateCard';

export default function AdminSalesPage() {
  const router = useRouter();
  const [authChecking, setAuthChecking] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  // 관리자 인증 확인
  useEffect(() => {
    // 클라이언트 사이드에서만 실행
    if (typeof window === 'undefined') return;

    const checkAuth = async () => {
      try {
        setAuthChecking(true);
        // 로컬 스토리지에서 토큰과 관리자 여부 확인
        const token = localStorage.getItem('accessToken');
        const isAdmin = localStorage.getItem('isAdmin');
        const adminStatus = localStorage.getItem('admin_status');

        console.log('관리자 인증 확인:', {
          token: !!token,
          isAdmin,
          hasAdminStatus: !!adminStatus
        });

        // 관리자 상태가 없는 경우 디버그 페이지로 이동
        if (!token || isAdmin !== 'true') {
          setAuthError('관리자 권한이 없습니다. 관리자 디버그 페이지로 이동합니다.');
          setTimeout(() => {
            router.push('/admin/debug');
          }, 2000);
          return;
        }

        // 관리자 상태가 없지만 토큰과 isAdmin이 있는 경우 상태 생성
        if (!adminStatus && token && isAdmin === 'true') {
          console.log('관리자 상태 생성');
          const now = Date.now();
          localStorage.setItem('admin_status', JSON.stringify({
            verified: true,
            timestamp: now,
            email: 'admin@example.com'
          }));
        }

        setAuthError(null);
      } catch (error) {
        console.error('인증 확인 오류:', error);
        setAuthError('인증 확인 중 오류가 발생했습니다.');
      } finally {
        setAuthChecking(false);
      }
    };

    checkAuth();
  }, [router]);

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
          매출 통계
        </Typography>

        {/* 매출 요약 카드 */}
        <Box sx={{ mb: 4 }}>
          <SalesStatsCard />
        </Box>

        {/* 매출 추이 차트 */}
        <Box sx={{ mb: 4 }}>
          <SalesTrendChart />
        </Box>

        <Divider sx={{ my: 4 }} />

        {/* 결제 성공률 */}
        <Box sx={{ mb: 4 }}>
          <PaymentSuccessRateCard />
        </Box>
      </Box>
    </LocalizationProvider>
  );
}
