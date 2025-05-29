'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Alert,
  Chip,
  Avatar,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton
} from '@mui/material';
import { Phone, Refresh, Close } from '@mui/icons-material';
import AdminService from '@/app/services/admin';
import UserDetailModal from '@/components/admin/appearance/UserDetailModal';

interface DuplicatePhoneUser {
  id: string;
  name: string;
  email: string;
  phoneNumber: string;
  createdAt: string;
  refreshToken: string;
}

export default function DuplicatePhoneUsersPanel() {
  const [users, setUsers] = useState<DuplicatePhoneUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [showUserDetailModal, setShowUserDetailModal] = useState(false);

  // 중복 휴대폰 번호 사용자 조회
  const fetchDuplicatePhoneUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('중복 휴대폰 번호 사용자 조회 시작');
      const response = await AdminService.userAppearance.getDuplicatePhoneUsers();
      console.log('중복 휴대폰 번호 사용자 조회 응답:', response);

      // API 응답 구조에 맞게 데이터 설정
      if (response && response.users) {
        setUsers(response.users);
        setTotalCount(response.totalCount || response.users.length);
      } else {
        setUsers([]);
        setTotalCount(0);
      }
    } catch (error: any) {
      console.error('중복 휴대폰 번호 사용자 조회 중 오류:', error);
      setError(error.message || '중복 휴대폰 번호 사용자 조회 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    fetchDuplicatePhoneUsers();
  }, []);

  // 새로고침 핸들러
  const handleRefresh = () => {
    fetchDuplicatePhoneUsers();
  };

  // 사용자 클릭 핸들러
  const handleUserClick = (userId: string) => {
    setSelectedUserId(userId);
    setShowUserDetailModal(true);
  };

  // 모달 닫기 핸들러
  const handleCloseModal = () => {
    setShowUserDetailModal(false);
    setSelectedUserId(null);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" component="h2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Phone color="warning" />
          중복 휴대폰 번호 사용자
        </Typography>
        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={handleRefresh}
          disabled={loading}
        >
          새로고침
        </Button>
      </Box>

      {/* 통계 정보 */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            중복 휴대폰 번호 통계
          </Typography>
          <Typography variant="body1" color="text.secondary">
            총 <strong>{totalCount}명</strong>의 중복 휴대폰 번호 사용자가 발견되었습니다.
          </Typography>
        </CardContent>
      </Card>

      {/* 에러 표시 */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
          <Button
            size="small"
            onClick={handleRefresh}
            sx={{ ml: 2 }}
          >
            다시 시도
          </Button>
        </Alert>
      )}

      {/* 로딩 상태 */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {/* 사용자 목록 테이블 */}
      {!loading && !error && (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>사용자</TableCell>
                <TableCell>이메일</TableCell>
                <TableCell>휴대폰 번호</TableCell>
                <TableCell>가입일</TableCell>
                <TableCell>상태</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                    <Typography variant="body1" color="text.secondary">
                      중복 휴대폰 번호로 가입한 사용자가 없습니다.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow
                    key={user.id}
                    hover
                    sx={{ cursor: 'pointer' }}
                    onClick={() => handleUserClick(user.id)}
                  >
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar sx={{ bgcolor: 'warning.main' }}>
                          {user.name ? user.name.charAt(0).toUpperCase() : '?'}
                        </Avatar>
                        <Typography variant="body2" fontWeight="medium">
                          {user.name || '이름 없음'}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {user.email || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {user.phoneNumber || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {user.createdAt || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label="중복 휴대폰"
                        color="warning"
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* 사용자 상세 정보 모달 */}
      {showUserDetailModal && selectedUserId && (
        <UserDetailModal
          userId={selectedUserId}
          open={showUserDetailModal}
          onClose={handleCloseModal}
          userDetail={{} as any}
          loading={false}
          error={null}
        />
      )}
    </Box>
  );
}
