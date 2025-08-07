'use client';

import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  Chip,

  Divider
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  Diamond as DiamondIcon
} from '@mui/icons-material';
import { UserSearchResult } from '../types';
import AdminService from '@/app/services/admin';

interface GemsManagementProps {
  searchTerm: string;
  searchLoading: boolean;
  error: string | null;
  searchResults: UserSearchResult[];
  selectedUser: UserSearchResult | null;
  setSearchTerm: (term: string) => void;
  searchUsers: () => void;
  handleUserSelect: (user: UserSearchResult) => void;
}

interface GemsInfo {
  userId: string;
  gemBalance: number;
  totalCharged: number;
  totalConsumed: number;
  lastTransaction: string;
}

const GemsManagement: React.FC<GemsManagementProps> = ({
  searchTerm,
  searchLoading,
  error,
  searchResults,
  selectedUser,
  setSearchTerm,
  searchUsers,
  handleUserSelect
}) => {
  // 구슬 관련 상태
  const [gemsInfo, setGemsInfo] = useState<GemsInfo | null>(null);
  const [gemsLoading, setGemsLoading] = useState(false);
  const [gemsError, setGemsError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionResult, setActionResult] = useState<string | null>(null);
  
  // 구슬 액션 관련 상태
  const [gemsCount, setGemsCount] = useState(1);

  // 구슬 정보 조회
  const fetchGemsInfo = async (userId: string) => {
    setGemsLoading(true);
    setGemsError(null);
    setGemsInfo(null);

    try {
      const response = await AdminService.userAppearance.getUserGems(userId);
      console.log('구슬 정보 조회 응답:', response);
      setGemsInfo(response);
    } catch (err: any) {
      console.error('구슬 정보 조회 오류:', err);
      const errorMessage = err.response?.data?.message ||
                          err.response?.data?.error ||
                          err.message ||
                          '구슬 정보 조회 중 오류가 발생했습니다.';
      setGemsError(errorMessage);
    } finally {
      setGemsLoading(false);
    }
  };

  // 구슬 추가
  const addGems = async () => {
    if (!selectedUser) return;

    setActionLoading(true);
    setGemsError(null);
    setActionResult(null);

    try {
      const response = await AdminService.userAppearance.addUserGems(selectedUser.id, gemsCount);
      console.log('구슬 추가 응답:', response);

      setActionResult(`성공적으로 ${gemsCount}개의 구슬을 추가했습니다.`);

      // 구슬 정보 새로고침
      await fetchGemsInfo(selectedUser.id);
      setGemsCount(1);
    } catch (err: any) {
      console.error('구슬 추가 오류:', err);
      const errorMessage = err.response?.data?.message ||
                          err.response?.data?.error ||
                          err.message ||
                          '구슬 추가 중 오류가 발생했습니다.';
      setGemsError(errorMessage);
    } finally {
      setActionLoading(false);
    }
  };

  // 구슬 제거
  const removeGems = async () => {
    if (!selectedUser) return;

    setActionLoading(true);
    setGemsError(null);
    setActionResult(null);

    try {
      const response = await AdminService.userAppearance.removeUserGems(selectedUser.id, gemsCount);
      console.log('구슬 제거 응답:', response);

      setActionResult(`성공적으로 ${gemsCount}개의 구슬을 제거했습니다.`);

      // 구슬 정보 새로고침
      await fetchGemsInfo(selectedUser.id);
      setGemsCount(1);
    } catch (err: any) {
      console.error('구슬 제거 오류:', err);
      const errorMessage = err.response?.data?.message ||
                          err.response?.data?.error ||
                          err.message ||
                          '구슬 제거 중 오류가 발생했습니다.';
      setGemsError(errorMessage);
    } finally {
      setActionLoading(false);
    }
  };

  // 사용자 선택 핸들러
  const handleUserSelectWithGems = async (user: UserSearchResult) => {
    handleUserSelect(user);
    await fetchGemsInfo(user.id);
  };

  return (
    <Box>
      {/* 사용자 검색 섹션 */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          구슬 관리
        </Typography>

        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <TextField
            fullWidth
            label="사용자 이름 검색"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && searchUsers()}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
          <Button
            variant="contained"
            onClick={searchUsers}
            disabled={searchLoading}
            sx={{ minWidth: 100 }}
          >
            {searchLoading ? <CircularProgress size={24} /> : '검색'}
          </Button>
        </Box>

        {/* 에러 메시지 */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* 검색 결과 */}
        {searchResults.length > 0 && (
          <TableContainer component={Paper} sx={{ mt: 2 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>프로필</TableCell>
                  <TableCell>이름</TableCell>
                  <TableCell>전화번호</TableCell>
                  <TableCell>성별</TableCell>
                  <TableCell>대학교</TableCell>
                  <TableCell>외모등급</TableCell>
                  <TableCell>액션</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {searchResults.map((user) => (
                  <TableRow 
                    key={user.id}
                    selected={selectedUser?.id === user.id}
                    sx={{ 
                      cursor: 'pointer',
                      '&:hover': { backgroundColor: 'action.hover' }
                    }}
                  >
                    <TableCell>
                      <Avatar
                        src={user.profileImageUrl}
                        alt={user.name}
                        sx={{ width: 40, height: 40 }}
                      />
                    </TableCell>
                    <TableCell>{user.name}</TableCell>
                    <TableCell>{user.phoneNumber}</TableCell>
                    <TableCell>
                      <Chip
                        label={user.gender === 'MALE' ? '남성' : '여성'}
                        color={user.gender === 'MALE' ? 'primary' : 'secondary'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{typeof user.university === 'object' ? user.university?.name || '-' : user.university || '-'}</TableCell>
                    <TableCell>
                      <Chip
                        label={user.appearanceGrade || 'UNKNOWN'}
                        color="default"
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => handleUserSelectWithGems(user)}
                        disabled={gemsLoading}
                      >
                        선택
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* 선택된 사용자의 구슬 정보 */}
      {selectedUser && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <DiamondIcon color="primary" />
            {selectedUser.name}님의 구슬 정보
          </Typography>

          {gemsLoading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          )}

          {gemsError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {gemsError}
            </Alert>
          )}

          {actionResult && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {actionResult}
            </Alert>
          )}

          {gemsInfo && (
            <Box>
              {/* 구슬 정보 표시 */}
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2, mb: 3 }}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h4" color="primary" gutterBottom>
                    {gemsInfo.gemBalance}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    현재 구슬 보유량
                  </Typography>
                </Paper>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h6" gutterBottom>
                    {gemsInfo.totalCharged}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    총 충전량
                  </Typography>
                </Paper>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h6" gutterBottom>
                    {gemsInfo.totalConsumed}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    총 소모량
                  </Typography>
                </Paper>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="body1" gutterBottom>
                    {gemsInfo.lastTransaction || '-'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    마지막 거래일
                  </Typography>
                </Paper>
              </Box>

              {/* 구슬 관리 액션 */}
              <Box sx={{ display: 'flex', gap: 3, alignItems: 'flex-end' }}>
                <TextField
                  type="number"
                  label="구슬 개수"
                  value={gemsCount}
                  onChange={(e) => setGemsCount(Math.max(1, parseInt(e.target.value) || 1))}
                  inputProps={{ min: 1, max: 1000 }}
                  sx={{ width: 120 }}
                />

                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<AddIcon />}
                  onClick={addGems}
                  disabled={actionLoading}
                  sx={{ minWidth: 120 }}
                >
                  {actionLoading ? <CircularProgress size={20} /> : '구슬 추가'}
                </Button>

                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<RemoveIcon />}
                  onClick={removeGems}
                  disabled={actionLoading || !gemsInfo || gemsInfo.gemBalance === 0}
                  sx={{ minWidth: 120 }}
                >
                  {actionLoading ? <CircularProgress size={20} /> : '구슬 제거'}
                </Button>
              </Box>
            </Box>
          )}
        </Paper>
      )}


    </Box>
  );
};

export default GemsManagement;
