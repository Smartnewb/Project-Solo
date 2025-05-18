import React from 'react';
import {
  Box,
  Typography,
  Button,
  Alert,
  CircularProgress,
  Avatar,
  Chip,
  Paper,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Tooltip,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TablePagination,
  Grid
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import SearchIcon from '@mui/icons-material/Search';
import RefreshIcon from '@mui/icons-material/Refresh';
import FilterListIcon from '@mui/icons-material/FilterList';
import { format, formatDistance } from 'date-fns';
import { ko } from 'date-fns/locale';
import { UnmatchedUser } from '../types';

interface UnmatchedUsersProps {
  unmatchedUsers: UnmatchedUser[];
  unmatchedUsersLoading: boolean;
  unmatchedUsersError: string | null;
  unmatchedUsersTotalCount: number;
  unmatchedUsersPage: number;
  unmatchedUsersLimit: number;
  unmatchedUsersSearchTerm: string;
  unmatchedUsersGenderFilter: string;
  selectedUnmatchedUser: UnmatchedUser | null;
  setUnmatchedUsersSearchTerm: (value: string) => void;
  setUnmatchedUsersGenderFilter: (value: string) => void;
  handleUnmatchedUsersSearch: () => void;
  handleUnmatchedUsersPageChange: (event: unknown, newPage: number) => void;
  handleUnmatchedUsersLimitChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleUnmatchedUserSelect: (user: UnmatchedUser) => void;
  processUnmatchedUserMatching: () => void;
  fetchUnmatchedUsers: () => void;
}

const UnmatchedUsers: React.FC<UnmatchedUsersProps> = ({
  unmatchedUsers,
  unmatchedUsersLoading,
  unmatchedUsersError,
  unmatchedUsersTotalCount,
  unmatchedUsersPage,
  unmatchedUsersLimit,
  unmatchedUsersSearchTerm,
  unmatchedUsersGenderFilter,
  selectedUnmatchedUser,
  setUnmatchedUsersSearchTerm,
  setUnmatchedUsersGenderFilter,
  handleUnmatchedUsersSearch,
  handleUnmatchedUsersPageChange,
  handleUnmatchedUsersLimitChange,
  handleUnmatchedUserSelect,
  processUnmatchedUserMatching,
  fetchUnmatchedUsers
}) => {
  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          매칭 대기 사용자 목록
        </Typography>
        <Tooltip title="새로고침">
          <IconButton onClick={fetchUnmatchedUsers} disabled={unmatchedUsersLoading}>
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {/* 필터링 영역 */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={4}>
          <TextField
            label="이름 검색"
            variant="outlined"
            size="small"
            fullWidth
            value={unmatchedUsersSearchTerm}
            onChange={(e) => setUnmatchedUsersSearchTerm(e.target.value)}
            InputProps={{
              endAdornment: (
                <IconButton
                  size="small"
                  onClick={handleUnmatchedUsersSearch}
                  disabled={unmatchedUsersLoading}
                >
                  <SearchIcon />
                </IconButton>
              ),
            }}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <FormControl fullWidth size="small">
            <InputLabel>성별</InputLabel>
            <Select
              value={unmatchedUsersGenderFilter}
              onChange={(e) => setUnmatchedUsersGenderFilter(e.target.value)}
              label="성별"
            >
              <MenuItem value="all">전체</MenuItem>
              <MenuItem value="MALE">남성</MenuItem>
              <MenuItem value="FEMALE">여성</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={12} md={4}>
          <Button
            variant="contained"
            color="primary"
            fullWidth
            onClick={handleUnmatchedUsersSearch}
            disabled={unmatchedUsersLoading}
            startIcon={<FilterListIcon />}
          >
            필터 적용
          </Button>
        </Grid>
      </Grid>

      {unmatchedUsersError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {unmatchedUsersError}
        </Alert>
      )}

      {/* 매칭 대기 사용자 테이블 */}
      {unmatchedUsersLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <TableContainer component={Paper} variant="outlined">
            <Table sx={{ minWidth: 650 }} size="small">
              <TableHead>
                <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                  <TableCell>ID</TableCell>
                  <TableCell>이름</TableCell>
                  <TableCell>나이/성별</TableCell>
                  <TableCell>대학교/학과</TableCell>
                  <TableCell>가입일</TableCell>
                  <TableCell>대기 기간</TableCell>
                  <TableCell>등급</TableCell>
                  <TableCell>액션</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {unmatchedUsers.length > 0 ? (
                  unmatchedUsers.map((user) => (
                    <TableRow
                      key={user.id}
                      hover
                      selected={selectedUnmatchedUser?.id === user.id}
                      onClick={() => handleUnmatchedUserSelect(user)}
                      sx={{ cursor: 'pointer' }}
                    >
                      <TableCell>{user.id}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Avatar src={user.profileImageUrl} sx={{ width: 32, height: 32, mr: 1 }}>
                            <PersonIcon fontSize="small" />
                          </Avatar>
                          {user.name}
                        </Box>
                      </TableCell>
                      <TableCell>{user.age}세 / {user.gender === 'MALE' ? '남성' : '여성'}</TableCell>
                      <TableCell>{user.university} {user.department ? `/ ${user.department}` : ''}</TableCell>
                      <TableCell>{format(new Date(user.createdAt), 'yyyy-MM-dd')}</TableCell>
                      <TableCell>
                        {formatDistance(new Date(user.waitingSince), new Date(), { locale: ko, addSuffix: true })}
                      </TableCell>
                      <TableCell>
                        {user.appearanceGrade && (
                          <Chip
                            size="small"
                            label={user.appearanceGrade}
                            color={
                              user.appearanceGrade === 'S' ? 'secondary' :
                              user.appearanceGrade === 'A' ? 'primary' :
                              user.appearanceGrade === 'B' ? 'success' :
                              user.appearanceGrade === 'C' ? 'warning' : 'default'
                            }
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUnmatchedUserSelect(user);
                            processUnmatchedUserMatching();
                          }}
                        >
                          매칭 실행
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      매칭 대기 중인 사용자가 없습니다.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* 페이지네이션 */}
          <TablePagination
            component="div"
            count={unmatchedUsersTotalCount}
            page={unmatchedUsersPage}
            onPageChange={handleUnmatchedUsersPageChange}
            rowsPerPage={unmatchedUsersLimit}
            onRowsPerPageChange={handleUnmatchedUsersLimitChange}
            rowsPerPageOptions={[5, 10, 25, 50]}
            labelRowsPerPage="페이지당 항목 수:"
            labelDisplayedRows={({ from, to, count }) => `${from}-${to} / ${count}`}
          />
        </>
      )}

      {/* 선택된 사용자 정보 */}
      {selectedUnmatchedUser && (
        <Paper sx={{ p: 3, mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            선택된 사용자 정보
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={4}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar src={selectedUnmatchedUser.profileImageUrl} sx={{ width: 64, height: 64, mr: 2 }}>
                  <PersonIcon />
                </Avatar>
                <Box>
                  <Typography variant="h6">
                    {selectedUnmatchedUser.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {selectedUnmatchedUser.age}세, {selectedUnmatchedUser.gender === 'MALE' ? '남성' : '여성'}
                  </Typography>
                </Box>
              </Box>
              <Typography variant="body2" gutterBottom>
                <strong>대학교:</strong> {selectedUnmatchedUser.university}
              </Typography>
              {selectedUnmatchedUser.department && (
                <Typography variant="body2" gutterBottom>
                  <strong>학과:</strong> {selectedUnmatchedUser.department}
                </Typography>
              )}
              <Typography variant="body2" gutterBottom>
                <strong>가입일:</strong> {format(new Date(selectedUnmatchedUser.createdAt), 'yyyy년 MM월 dd일')}
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>매칭 대기 기간:</strong> {formatDistance(new Date(selectedUnmatchedUser.waitingSince), new Date(), { locale: ko })}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={8}>
              <Button
                variant="contained"
                color="primary"
                fullWidth
                onClick={processUnmatchedUserMatching}
                disabled={unmatchedUsersLoading}
                sx={{ mt: 2 }}
              >
                {unmatchedUsersLoading ? <CircularProgress size={24} /> : '매칭 실행'}
              </Button>
            </Grid>
          </Grid>
        </Paper>
      )}
    </Paper>
  );
};

export default UnmatchedUsers;
