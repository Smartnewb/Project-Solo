'use client';

import { useState, useEffect } from 'react';
import { Box, Typography, Button, Alert, Paper, TextField, Divider } from '@mui/material';

export default function AdminDebugPage() {
  const [adminStatus, setAdminStatus] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 로컬 스토리지 정보 로드
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const adminStatusStr = localStorage.getItem('admin_status');
      const isAdminValue = localStorage.getItem('isAdmin');
      const accessTokenValue = localStorage.getItem('accessToken');

      setIsAdmin(isAdminValue);
      setAccessToken(accessTokenValue);

      if (adminStatusStr) {
        try {
          const parsedStatus = JSON.parse(adminStatusStr);
          setAdminStatus(parsedStatus);
        } catch (e) {
          console.error('관리자 상태 파싱 오류:', e);
          setAdminStatus(null);
        }
      }
    } catch (e) {
      console.error('로컬 스토리지 접근 오류:', e);
      setError('로컬 스토리지 접근 중 오류가 발생했습니다.');
    }
  }, []);

  // 관리자 권한 설정
  const setAdminPermission = () => {
    try {
      const now = Date.now();
      const adminStatusObj = {
        verified: true,
        timestamp: now,
        email: 'admin@example.com'
      };

      localStorage.setItem('isAdmin', 'true');
      localStorage.setItem('admin_status', JSON.stringify(adminStatusObj));
      
      // 토큰이 없는 경우 임시 토큰 생성
      const tempToken = 'temp_admin_' + now;
      localStorage.setItem('accessToken', tempToken);
      document.cookie = `accessToken=${tempToken}; path=/; max-age=28800; SameSite=Lax`;

      setMessage('관리자 권한이 설정되었습니다. 새로고침 후 다시 시도해보세요.');
      
      // 상태 업데이트
      setIsAdmin('true');
      setAccessToken(tempToken);
      setAdminStatus(adminStatusObj);
    } catch (e) {
      console.error('관리자 권한 설정 오류:', e);
      setError('관리자 권한 설정 중 오류가 발생했습니다.');
    }
  };

  // 관리자 권한 제거
  const removeAdminPermission = () => {
    try {
      localStorage.removeItem('isAdmin');
      localStorage.removeItem('admin_status');
      localStorage.removeItem('accessToken');
      document.cookie = 'accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';

      setMessage('관리자 권한이 제거되었습니다. 새로고침 후 다시 시도해보세요.');
      
      // 상태 업데이트
      setIsAdmin(null);
      setAccessToken(null);
      setAdminStatus(null);
    } catch (e) {
      console.error('관리자 권한 제거 오류:', e);
      setError('관리자 권한 제거 중 오류가 발생했습니다.');
    }
  };

  return (
    <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        관리자 디버그 페이지
      </Typography>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          현재 상태
        </Typography>
        
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle1">isAdmin:</Typography>
          <Typography variant="body1" sx={{ ml: 2 }}>
            {isAdmin === null ? '(없음)' : isAdmin}
          </Typography>
        </Box>
        
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle1">accessToken:</Typography>
          <Typography variant="body1" sx={{ ml: 2, wordBreak: 'break-all' }}>
            {accessToken === null ? '(없음)' : accessToken}
          </Typography>
        </Box>
        
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle1">admin_status:</Typography>
          <Typography variant="body1" sx={{ ml: 2 }}>
            {adminStatus === null ? '(없음)' : JSON.stringify(adminStatus, null, 2)}
          </Typography>
        </Box>
      </Paper>

      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <Button 
          variant="contained" 
          color="primary" 
          onClick={setAdminPermission}
        >
          관리자 권한 설정
        </Button>
        
        <Button 
          variant="outlined" 
          color="error" 
          onClick={removeAdminPermission}
        >
          관리자 권한 제거
        </Button>
      </Box>

      {message && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {message}
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Divider sx={{ my: 3 }} />

      <Box sx={{ mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          페이지 이동
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button 
            variant="contained" 
            color="secondary" 
            href="/admin/dashboard"
          >
            대시보드로 이동
          </Button>
          
          <Button 
            variant="contained" 
            color="secondary" 
            href="/admin/sales"
          >
            매출 통계로 이동
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
