'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import communityService from '@/app/services/community';
import {
  Box,
  Typography,
  Tabs,
  Tab,
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
  IconButton,
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
  Checkbox,
  Tooltip
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Delete as DeleteIcon,
  Report as ReportIcon,
  Comment as CommentIcon,
  Warning as WarningIcon
} from '@mui/icons-material';

// 탭 패널 컴포넌트
function TabPanel(props: {
  children?: React.ReactNode;
  index: number;
  value: number;
}) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`community-tabpanel-${index}`}
      aria-labelledby={`community-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

// 게시글 목록 컴포넌트
function ArticleList() {
  const router = useRouter();
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [filter, setFilter] = useState<'all' | 'reported' | 'blinded'>('all');
  const [totalCount, setTotalCount] = useState(0);
  const [selectedArticles, setSelectedArticles] = useState<string[]>([]);
  const [openBlindDialog, setOpenBlindDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [blindReason, setBlindReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // 게시글 목록 조회
  const fetchArticles = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await communityService.getArticles(filter, page + 1, rowsPerPage);
      setArticles(response.items || []);
      setTotalCount(response.total || 0);
    } catch (error) {
      console.error('게시글 목록 조회 중 오류:', error);
      setError('게시글 목록을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
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

  // 필터 변경 시
  const handleFilterChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFilter(event.target.value as 'all' | 'reported' | 'blinded');
    setPage(0);
  };

  // 게시글 선택 시
  const handleSelectArticle = (id: string) => {
    setSelectedArticles(prev => {
      if (prev.includes(id)) {
        return prev.filter(articleId => articleId !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  // 전체 선택/해제
  const handleSelectAll = () => {
    if (selectedArticles.length === articles.length) {
      setSelectedArticles([]);
    } else {
      setSelectedArticles(articles.map(article => article.id));
    }
  };

  // 블라인드 처리 다이얼로그 열기
  const handleOpenBlindDialog = () => {
    setOpenBlindDialog(true);
  };

  // 블라인드 처리 다이얼로그 닫기
  const handleCloseBlindDialog = () => {
    setOpenBlindDialog(false);
    setBlindReason('');
  };

  // 삭제 다이얼로그 열기
  const handleOpenDeleteDialog = () => {
    setOpenDeleteDialog(true);
  };

  // 삭제 다이얼로그 닫기
  const handleCloseDeleteDialog = () => {
    setOpenDeleteDialog(false);
  };

  // 블라인드 처리
  const handleBlindArticles = async (isBlinded: boolean) => {
    try {
      setActionLoading(true);
      await communityService.bulkBlindArticles(selectedArticles, isBlinded, blindReason);
      setSuccessMessage(`선택한 게시글을 ${isBlinded ? '블라인드' : '블라인드 해제'} 처리했습니다.`);
      setSelectedArticles([]);
      fetchArticles();
      handleCloseBlindDialog();
    } catch (error) {
      console.error('게시글 블라인드 처리 중 오류:', error);
      setError(`게시글 ${isBlinded ? '블라인드' : '블라인드 해제'} 처리 중 오류가 발생했습니다.`);
    } finally {
      setActionLoading(false);
    }
  };

  // 게시글 삭제
  const handleDeleteArticles = async () => {
    try {
      setActionLoading(true);
      await communityService.bulkDeleteArticles(selectedArticles);
      setSuccessMessage('선택한 게시글을 삭제했습니다.');
      setSelectedArticles([]);
      fetchArticles();
      handleCloseDeleteDialog();
    } catch (error) {
      console.error('게시글 삭제 중 오류:', error);
      setError('게시글 삭제 중 오류가 발생했습니다.');
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

  // 게시글 목록 조회
  useEffect(() => {
    fetchArticles();
  }, [filter, page, rowsPerPage]);

  return (
    <Box>
      {/* 필터 및 액션 버튼 */}
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <FormControl variant="outlined" size="small" sx={{ minWidth: 200 }}>
          <InputLabel id="filter-label">필터</InputLabel>
          <Select
            labelId="filter-label"
            value={filter}
            onChange={handleFilterChange}
            label="필터"
          >
            <MenuItem value="all">전체 게시글</MenuItem>
            <MenuItem value="reported">신고된 게시글</MenuItem>
            <MenuItem value="blinded">블라인드 게시글</MenuItem>
          </Select>
        </FormControl>

        {selectedArticles.length > 0 && (
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              color="primary"
              onClick={handleOpenBlindDialog}
              startIcon={<VisibilityOffIcon />}
              disabled={actionLoading}
            >
              블라인드 처리
            </Button>
            <Button
              variant="outlined"
              color="error"
              onClick={handleOpenDeleteDialog}
              startIcon={<DeleteIcon />}
              disabled={actionLoading}
            >
              삭제
            </Button>
          </Box>
        )}
      </Box>

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

      {/* 게시글 목록 테이블 */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox
                  checked={articles.length > 0 && selectedArticles.length === articles.length}
                  indeterminate={selectedArticles.length > 0 && selectedArticles.length < articles.length}
                  onChange={handleSelectAll}
                />
              </TableCell>
              <TableCell>작성자</TableCell>
              <TableCell>내용</TableCell>
              <TableCell>댓글</TableCell>
              <TableCell>신고</TableCell>
              <TableCell>상태</TableCell>
              <TableCell>작성일</TableCell>
              <TableCell>액션</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  <CircularProgress size={24} sx={{ my: 2 }} />
                </TableCell>
              </TableRow>
            ) : articles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  게시글이 없습니다.
                </TableCell>
              </TableRow>
            ) : (
              articles.map((article) => (
                <TableRow key={article.id}>
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={selectedArticles.includes(article.id)}
                      onChange={() => handleSelectArticle(article.id)}
                    />
                  </TableCell>
                  <TableCell>
                    {article.isAnonymous ? (
                      <Typography variant="body2">익명</Typography>
                    ) : (
                      <Typography variant="body2">{article.nickname}</Typography>
                    )}
                    <Typography variant="caption" color="textSecondary">
                      {article.email}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography
                      variant="body2"
                      sx={{
                        maxWidth: 300,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        ...(article.isBlinded && { color: 'text.disabled', textDecoration: 'line-through' })
                      }}
                    >
                      {article.emoji} {article.content}
                    </Typography>
                  </TableCell>
                  <TableCell>{article.commentCount}</TableCell>
                  <TableCell>
                    {article.reportCount > 0 ? (
                      <Chip
                        icon={<ReportIcon />}
                        label={article.reportCount}
                        color="error"
                        size="small"
                      />
                    ) : (
                      0
                    )}
                  </TableCell>
                  <TableCell>
                    {article.isBlinded ? (
                      <Chip label="블라인드" color="warning" size="small" />
                    ) : article.isDeleted ? (
                      <Chip label="삭제됨" color="error" size="small" />
                    ) : (
                      <Chip label="정상" color="success" size="small" />
                    )}
                  </TableCell>
                  <TableCell>
                    {new Date(article.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Tooltip title="상세 보기">
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => router.push(`/admin/community/${article.id}`)}
                      >
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title={article.isBlinded ? "블라인드 해제" : "블라인드"}>
                      <IconButton
                        size="small"
                        color={article.isBlinded ? "success" : "warning"}
                        onClick={() => {
                          setSelectedArticles([article.id]);
                          setBlindReason(article.blindReason || '');
                          setOpenBlindDialog(true);
                        }}
                      >
                        {article.isBlinded ? (
                          <VisibilityIcon fontSize="small" />
                        ) : (
                          <VisibilityOffIcon fontSize="small" />
                        )}
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="삭제">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => {
                          setSelectedArticles([article.id]);
                          setOpenDeleteDialog(true);
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* 페이지네이션 */}
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

      {/* 블라인드 처리 다이얼로그 */}
      <Dialog open={openBlindDialog} onClose={handleCloseBlindDialog}>
        <DialogTitle>게시글 블라인드 처리</DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            선택한 {selectedArticles.length}개의 게시글을 블라인드 처리하시겠습니까?
          </Typography>
          <TextField
            autoFocus
            margin="dense"
            label="블라인드 사유"
            fullWidth
            variant="outlined"
            value={blindReason}
            onChange={(e) => setBlindReason(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseBlindDialog} disabled={actionLoading}>
            취소
          </Button>
          <Button
            onClick={() => handleBlindArticles(true)}
            color="warning"
            disabled={actionLoading}
          >
            {actionLoading ? <CircularProgress size={24} /> : '블라인드 처리'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 삭제 다이얼로그 */}
      <Dialog open={openDeleteDialog} onClose={handleCloseDeleteDialog}>
        <DialogTitle>게시글 삭제</DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            선택한 {selectedArticles.length}개의 게시글을 삭제하시겠습니까?
          </Typography>
          <Typography variant="body2" color="error" sx={{ mt: 1 }}>
            <WarningIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
            이 작업은 되돌릴 수 없습니다.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog} disabled={actionLoading}>
            취소
          </Button>
          <Button
            onClick={handleDeleteArticles}
            color="error"
            disabled={actionLoading}
          >
            {actionLoading ? <CircularProgress size={24} /> : '삭제'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

// 신고 목록 컴포넌트
function ReportList() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
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
      setLoading(true);
      setError(null);
      const response = await communityService.getReports(
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
      setLoading(false);
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
  const handleTypeFilterChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setTypeFilter(event.target.value as 'all' | 'article' | 'comment');
    setPage(0);
  };

  // 상태 필터 변경 시
  const handleStatusFilterChange = (event: React.ChangeEvent<HTMLInputElement>) => {
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
      await communityService.processReport(
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
    fetchReports();
  }, [typeFilter, statusFilter, page, rowsPerPage]);

  return (
    <Box>
      {/* 필터 */}
      <Box sx={{ mb: 2, display: 'flex', gap: 2 }}>
        <FormControl variant="outlined" size="small" sx={{ minWidth: 200 }}>
          <InputLabel id="type-filter-label">신고 대상</InputLabel>
          <Select
            labelId="type-filter-label"
            value={typeFilter}
            onChange={handleTypeFilterChange}
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
            onChange={handleStatusFilterChange}
            label="처리 상태"
          >
            <MenuItem value="all">전체</MenuItem>
            <MenuItem value="pending">대기 중</MenuItem>
            <MenuItem value="processed">처리 완료</MenuItem>
          </Select>
        </FormControl>
      </Box>

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
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
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
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <CircularProgress size={24} sx={{ my: 2 }} />
                </TableCell>
              </TableRow>
            ) : reports.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  신고가 없습니다.
                </TableCell>
              </TableRow>
            ) : (
              reports.map((report) => (
                <TableRow key={report.id}>
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
                        maxWidth: 300,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {report.targetContent}
                    </Typography>
                  </TableCell>
                  <TableCell>{report.reporterNickname}</TableCell>
                  <TableCell>{report.reason}</TableCell>
                  <TableCell>
                    {new Date(report.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {report.status === 'pending' ? (
                      <Chip label="대기 중" color="warning" size="small" />
                    ) : report.result === 'accepted' ? (
                      <Chip label="수락됨" color="success" size="small" />
                    ) : (
                      <Chip label="거절됨" color="error" size="small" />
                    )}
                  </TableCell>
                  <TableCell>
                    {report.status === 'pending' && (
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => handleOpenProcessDialog(report)}
                      >
                        처리
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* 페이지네이션 */}
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

      {/* 신고 처리 다이얼로그 */}
      <Dialog open={openProcessDialog} onClose={handleCloseProcessDialog}>
        <DialogTitle>신고 처리</DialogTitle>
        <DialogContent>
          {selectedReport && (
            <>
              <Typography variant="subtitle1" gutterBottom>
                신고 대상: {selectedReport.targetType === 'article' ? '게시글' : '댓글'}
              </Typography>
              <Typography variant="body2" gutterBottom>
                내용: {selectedReport.targetContent}
              </Typography>
              <Typography variant="body2" gutterBottom>
                신고 사유: {selectedReport.reason}
              </Typography>
              {selectedReport.description && (
                <Typography variant="body2" gutterBottom>
                  상세 설명: {selectedReport.description}
                </Typography>
              )}

              <Box sx={{ mt: 2 }}>
                <FormControl component="fieldset">
                  <Typography variant="subtitle2" gutterBottom>
                    처리 결과
                  </Typography>
                  <Select
                    value={processResult}
                    onChange={(e) => setProcessResult(e.target.value as 'accepted' | 'rejected')}
                    fullWidth
                    size="small"
                    sx={{ mb: 2 }}
                  >
                    <MenuItem value="accepted">수락 (신고 인정)</MenuItem>
                    <MenuItem value="rejected">거절 (신고 기각)</MenuItem>
                  </Select>
                </FormControl>

                {processResult === 'accepted' && (
                  <FormControl component="fieldset" sx={{ mt: 1 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      블라인드 처리
                    </Typography>
                    <Select
                      value={blindTarget ? 'yes' : 'no'}
                      onChange={(e) => setBlindTarget(e.target.value === 'yes')}
                      fullWidth
                      size="small"
                      sx={{ mb: 2 }}
                    >
                      <MenuItem value="yes">블라인드 처리</MenuItem>
                      <MenuItem value="no">블라인드 처리 안 함</MenuItem>
                    </Select>
                  </FormControl>
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
                />
              </Box>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseProcessDialog} disabled={actionLoading}>
            취소
          </Button>
          <Button
            onClick={handleProcessReport}
            color="primary"
            disabled={actionLoading}
          >
            {actionLoading ? <CircularProgress size={24} /> : '처리 완료'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default function AdminCommunity() {
  const router = useRouter();
  const { user, loading, isAdmin } = useAuth();
  const [tabValue, setTabValue] = useState(0);

  // 탭 변경 핸들러
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // 관리자 권한 확인
  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    } else if (!loading && user && !isAdmin) {
      router.push('/');
    }
  }, [user, loading, isAdmin, router]);

  if (loading) {
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
        커뮤니티 관리
      </Typography>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="community management tabs">
          <Tab label="게시글 관리" />
          <Tab label="신고 관리" />
        </Tabs>
      </Box>

      <TabPanel value={tabValue} index={0}>
        <ArticleList />
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <ReportList />
      </TabPanel>
    </Box>
  );
}
