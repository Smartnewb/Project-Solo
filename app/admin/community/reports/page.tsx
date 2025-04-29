'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { CommunityService } from '@/app/services';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  FormControlLabel,
  Switch,
  Divider
} from '@mui/material';
import {
  Report as ReportIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';

export default function ReportManagement() {
  const router = useRouter();
  const { user, loading, isAdmin } = useAuth();
  const [reports, setReports] = useState<any[]>([]);
  const [reportsLoading, setReportsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [typeFilter, setTypeFilter] = useState<'all' | 'article' | 'comment'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'processed'>('pending');
  const [totalCount, setTotalCount] = useState(0);
  const [openProcessDialog, setOpenProcessDialog] = useState(false);
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [processMemo, setProcessMemo] = useState('');
  const [processResult, setProcessResult] = useState<'accepted' | 'rejected'>('accepted');
  const [blindTarget, setBlindTarget] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // 신고 목록 조회
  const fetchReports = async () => {
    try {
      setReportsLoading(true);
      setError(null);
      const response = await CommunityService.getReports(
        typeFilter,
        statusFilter,
        page + 1,
        rowsPerPage
      );
      setReports(response.items || []);
      setTotalCount(response.total || 0);
    } catch (error) {
      console.error('신고 목록 조회 중 오류:', error);
      setError('신고 목록을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setReportsLoading(false);
    }
  };

  // 페이지 변경 시
  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  // 페이지당 행 수 변경 시
  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // 타입 필터 변경 시
  const handleTypeFilterChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setTypeFilter(event.target.value as 'all' | 'article' | 'comment');
    setPage(0);
  };

  // 상태 필터 변경 시
  const handleStatusFilterChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setStatusFilter(event.target.value as 'all' | 'pending' | 'processed');
    setPage(0);
  };

  // 신고 처리 다이얼로그 열기
  const handleOpenProcessDialog = (report: any) => {
    setSelectedReport(report);
    setProcessMemo('');
    setProcessResult('accepted');
    setBlindTarget(true);
    setOpenProcessDialog(true);
  };

  // 신고 처리 다이얼로그 닫기
  const handleCloseProcessDialog = () => {
    setOpenProcessDialog(false);
    setSelectedReport(null);
  };

  // 신고 처리
  const handleProcessReport = async () => {
    if (!selectedReport) return;

    try {
      setActionLoading(true);
      await CommunityService.processReport(
        selectedReport.id,
        processResult,
        processMemo,
        processResult === 'accepted' && blindTarget
      );
      setSuccessMessage('신고를 처리했습니다.');
      fetchReports();
      handleCloseProcessDialog();
    } catch (error) {
      console.error('신고 처리 중 오류:', error);
      setError('신고 처리 중 오류가 발생했습니다.');
    } finally {
      setActionLoading(false);
    }
  };

  // 성공 메시지 초기화
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // 신고 목록 조회
  useEffect(() => {
    if (!loading && user && isAdmin) {
      fetchReports();
    }
  }, [typeFilter, statusFilter, page, rowsPerPage, loading, user, isAdmin]);

  // 관리자 권한 확인
  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    } else if (!loading && user && !isAdmin) {
      router.push('/');
    }
  }, [user, loading, isAdmin, router]);

  if (loading || reportsLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!user || !isAdmin) {
    return null;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        신고 관리
      </Typography>

      {/* 필터 */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
          <FormControl variant="outlined" size="small" sx={{ minWidth: 200 }}>
            <InputLabel id="type-filter-label">신고 대상</InputLabel>
            <Select
              labelId="type-filter-label"
              value={typeFilter}
              onChange={handleTypeFilterChange as any}
              label="신고 대상"
            >
              <MenuItem value="all">전체</MenuItem>
              <MenuItem value="article">게시글</MenuItem>
              <MenuItem value="comment">댓글</MenuItem>
            </Select>
          </FormControl>

          <FormControl variant="outlined" size="small" sx={{ minWidth: 200 }}>
            <InputLabel id="status-filter-label">처리 상태</InputLabel>
            <Select
              labelId="status-filter-label"
              value={statusFilter}
              onChange={handleStatusFilterChange as any}
              label="처리 상태"
            >
              <MenuItem value="all">전체</MenuItem>
              <MenuItem value="pending">대기 중</MenuItem>
              <MenuItem value="processed">처리 완료</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Paper>

      {/* 성공/오류 메시지 */}
      {successMessage && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {successMessage}
        </Alert>
      )}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* 신고 목록 테이블 */}
      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <TableContainer sx={{ maxHeight: 'calc(100vh - 300px)' }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>신고 ID</TableCell>
                <TableCell>신고 대상</TableCell>
                <TableCell>신고 내용</TableCell>
                <TableCell>신고자</TableCell>
                <TableCell>신고 사유</TableCell>
                <TableCell>신고일</TableCell>
                <TableCell>상태</TableCell>
                <TableCell>액션</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {reportsLoading ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    <CircularProgress size={24} sx={{ my: 2 }} />
                  </TableCell>
                </TableRow>
              ) : reports.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    신고가 없습니다.
                  </TableCell>
                </TableRow>
              ) : (
                reports.map((report) => (
                  <TableRow key={report.id} hover>
                    <TableCell>{report.id.substring(0, 8)}...</TableCell>
                    <TableCell>
                      <Chip
                        label={report.targetType === 'article' ? '게시글' : '댓글'}
                        color={report.targetType === 'article' ? 'primary' : 'secondary'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography
                        variant="body2"
                        sx={{
                          maxWidth: 200,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {report.targetContent}
                      </Typography>
                    </TableCell>
                    <TableCell>{report.reporterNickname}</TableCell>
                    <TableCell>
                      <Typography
                        variant="body2"
                        sx={{
                          maxWidth: 150,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {report.reason}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {new Date(report.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {report.status === 'pending' ? (
                        <Chip
                          icon={<ReportIcon />}
                          label="대기 중"
                          color="warning"
                          size="small"
                        />
                      ) : report.result === 'accepted' ? (
                        <Chip
                          icon={<CheckCircleIcon />}
                          label="수락됨"
                          color="success"
                          size="small"
                        />
                      ) : (
                        <Chip
                          icon={<CancelIcon />}
                          label="거절됨"
                          color="error"
                          size="small"
                        />
                      )}
                    </TableCell>
                    <TableCell>
                      {report.status === 'pending' ? (
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => handleOpenProcessDialog(report)}
                        >
                          처리
                        </Button>
                      ) : (
                        <Button
                          variant="outlined"
                          size="small"
                          color="primary"
                          onClick={() => {
                            // 신고 대상 상세 페이지로 이동
                            if (report.targetType === 'article') {
                              router.push(`/admin/community/${report.targetId}`);
                            } else {
                              // 댓글이 속한 게시글로 이동 (API에서 articleId 제공 필요)
                              // router.push(`/admin/community/${report.articleId}`);
                              alert('댓글 상세 보기는 아직 지원되지 않습니다.');
                            }
                          }}
                        >
                          상세 보기
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={totalCount}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[5, 10, 25, 50]}
          labelRowsPerPage="페이지당 행 수:"
        />
      </Paper>

      {/* 신고 처리 다이얼로그 */}
      <Dialog open={openProcessDialog} onClose={handleCloseProcessDialog} maxWidth="md" fullWidth>
        <DialogTitle>신고 처리</DialogTitle>
        <DialogContent>
          {selectedReport && (
            <Box>
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" gutterBottom>
                  신고 정보
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                  <Box>
                    <Typography variant="body2" color="textSecondary">신고 대상</Typography>
                    <Typography variant="body1">
                      {selectedReport.targetType === 'article' ? '게시글' : '댓글'}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="textSecondary">신고자</Typography>
                    <Typography variant="body1">{selectedReport.reporterNickname}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="textSecondary">신고 사유</Typography>
                    <Typography variant="body1">{selectedReport.reason}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="textSecondary">신고일</Typography>
                    <Typography variant="body1">
                      {new Date(selectedReport.createdAt).toLocaleString()}
                    </Typography>
                  </Box>
                </Box>
                {selectedReport.description && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2" color="textSecondary">상세 설명</Typography>
                    <Paper variant="outlined" sx={{ p: 2, mt: 1 }}>
                      <Typography variant="body2">{selectedReport.description}</Typography>
                    </Paper>
                  </Box>
                )}
              </Box>

              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" gutterBottom>
                  신고 대상 내용
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="body1">{selectedReport.targetContent}</Typography>
                </Paper>
              </Box>

              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" gutterBottom>
                  처리 결과
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <FormControl component="fieldset" fullWidth sx={{ mb: 2 }}>
                  <Select
                    value={processResult}
                    onChange={(e) => setProcessResult(e.target.value as 'accepted' | 'rejected')}
                    fullWidth
                  >
                    <MenuItem value="accepted">수락 (신고 인정)</MenuItem>
                    <MenuItem value="rejected">거절 (신고 기각)</MenuItem>
                  </Select>
                </FormControl>

                {processResult === 'accepted' && (
                  <FormControlLabel
                    control={
                      <Switch
                        checked={blindTarget}
                        onChange={(e) => setBlindTarget(e.target.checked)}
                        color="primary"
                      />
                    }
                    label="신고 대상 블라인드 처리"
                  />
                )}

                <TextField
                  margin="dense"
                  label="처리 메모"
                  fullWidth
                  variant="outlined"
                  value={processMemo}
                  onChange={(e) => setProcessMemo(e.target.value)}
                  multiline
                  rows={3}
                  placeholder="처리 사유나 메모를 입력하세요"
                />
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseProcessDialog} disabled={actionLoading}>
            취소
          </Button>
          <Button
            onClick={handleProcessReport}
            color="primary"
            variant="contained"
            disabled={actionLoading}
          >
            {actionLoading ? <CircularProgress size={24} /> : '처리 완료'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
