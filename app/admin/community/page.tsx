'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import communityService from '@/app/services/community';
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
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import {
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Comment as CommentIcon,
  Warning as WarningIcon,
  Forum as ForumIcon,
  Article as ArticleIcon,
  FilterList as FilterListIcon,
  Refresh as RefreshIcon,
  CalendarMonth as CalendarMonthIcon,
  Report as ReportIcon,
  Favorite as FavoriteIcon
} from '@mui/icons-material';

// 게시글 목록 컴포넌트
function ArticleList() {
  const router = useRouter();
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [filter, setFilter] = useState<'all' | 'reported' | 'blinded'>('all');
  const [selectedArticles, setSelectedArticles] = useState<string[]>([]);
  const [openBlindDialog, setOpenBlindDialog] = useState(false);
  const [blindAction, setBlindAction] = useState<'blind' | 'unblind'>('blind');
  const [blindReason, setBlindReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedArticleDetail, setSelectedArticleDetail] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());

  // 게시글 목록 조회
  const fetchArticles = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await communityService.getArticles(filter, page + 1, rowsPerPage, selectedDate);
      setArticles(response.items || []);
      setTotalCount(response.total || 0);
    } catch (error) {
      console.error('게시글 목록 조회 중 오류:', error);
      setError('게시글 목록을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 날짜 변경 시
  const handleDateChange = (date: Date | null) => {
    setSelectedDate(date);
    setPage(0); // 날짜가 변경되면 첫 페이지로 이동
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
  const handleFilterChange = (event: any) => {
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

  // 블라인드 다이얼로그 열기
  const handleOpenBlindDialog = (action: 'blind' | 'unblind') => {
    setBlindAction(action);
    setBlindReason('');
    setOpenBlindDialog(true);
  };

  // 블라인드 다이얼로그 닫기
  const handleCloseBlindDialog = () => {
    setOpenBlindDialog(false);
  };

  // 게시글 블라인드 처리/해제
  const handleBlindArticles = async () => {
    try {
      setActionLoading(true);
      await communityService.bulkBlindArticles(selectedArticles, blindAction === 'blind');
      setSuccessMessage(`선택한 게시글을 ${blindAction === 'blind' ? '블라인드' : '블라인드 해제'} 처리했습니다.`);
      setSelectedArticles([]);
      fetchArticles();
      handleCloseBlindDialog();
    } catch (error) {
      console.error('게시글 블라인드 처리 중 오류:', error);
      setError('게시글 블라인드 처리 중 오류가 발생했습니다.');
    } finally {
      setActionLoading(false);
    }
  };

  // 게시글 상세 정보 조회
  const handleViewDetail = async (id: string) => {
    try {
      setActionLoading(true);

      // 현재 목록에서 해당 ID의 게시글 찾기
      const selectedArticle = articles.find(article => article.id === id);
      if (!selectedArticle) {
        throw new Error('게시글을 찾을 수 없습니다.');
      }

      // 게시글 상세 정보 구성 (댓글 제외, likeCount와 author 정보 포함)
      const articleDetail = {
        ...selectedArticle,
        likeCount: selectedArticle.likeCount || 0,
        author: {
          id: selectedArticle.userId || '',
          name: selectedArticle.nickname || '익명',
        },
        comments: [], // 댓글은 빈 배열로 초기화
        reports: [] // 신고 정보는 필요한 경우 추가
      };

      console.log('게시글 상세 정보:', articleDetail);

      setSelectedArticleDetail(articleDetail);
      setDetailDialogOpen(true);
    } catch (error) {
      console.error('게시글 상세 정보 조회 중 오류:', error);
      setError('게시글 상세 정보를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setActionLoading(false);
    }
  };

  // 상세 다이얼로그 닫기
  const handleCloseDetailDialog = () => {
    setDetailDialogOpen(false);
    setSelectedArticleDetail(null);
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
  }, [filter, page, rowsPerPage, selectedDate]);

  return (
    <Box>
      {/* 필터 및 액션 버튼 */}
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="h6">
            게시글 관리 ({totalCount})
          </Typography>

          <FormControl variant="outlined" size="small" sx={{ minWidth: 150 }}>
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

          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DatePicker
              label="날짜 선택"
              value={selectedDate}
              onChange={handleDateChange}
              slotProps={{
                textField: {
                  size: 'small',
                  sx: { width: 180 }
                }
              }}
            />
          </LocalizationProvider>

          <Button
            variant="outlined"
            size="small"
            startIcon={<RefreshIcon />}
            onClick={fetchArticles}
          >
            새로고침
          </Button>
        </Box>

        {selectedArticles.length > 0 && (
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              color="primary"
              onClick={() => handleOpenBlindDialog('blind')}
              startIcon={<VisibilityOffIcon />}
              disabled={actionLoading}
            >
              블라인드
            </Button>
            <Button
              variant="outlined"
              color="secondary"
              onClick={() => handleOpenBlindDialog('unblind')}
              startIcon={<VisibilityIcon />}
              disabled={actionLoading}
            >
              블라인드 해제
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
              <TableCell>좋아요</TableCell>
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
                      <Typography variant="body2">
                        {article.author?.name || article.nickname}
                      </Typography>
                    )}
                    <Typography variant="caption" color="textSecondary">
                      ID: {article.author?.id || article.userId}
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
                        textDecoration: article.isBlinded ? 'line-through' : 'none',
                        color: article.isBlinded ? 'text.disabled' : 'text.primary'
                      }}
                    >
                      {article.emoji} {article.content}
                    </Typography>
                  </TableCell>
                  <TableCell>{article.commentCount}</TableCell>
                  <TableCell>{article.likeCount || 0}</TableCell>
                  <TableCell>
                    {article.reportCount > 0 ? (
                      <Chip
                        label={article.reportCount}
                        color="error"
                        size="small"
                        icon={<ReportIcon />}
                      />
                    ) : (
                      '0'
                    )}
                  </TableCell>
                  <TableCell>
                    {article.isBlinded ? (
                      <Chip label="블라인드" color="error" size="small" />
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
                        onClick={() => handleViewDetail(article.id)}
                      >
                        <ArticleIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    {article.isBlinded ? (
                      <Tooltip title="블라인드 해제">
                        <IconButton
                          size="small"
                          color="secondary"
                          onClick={() => {
                            setSelectedArticles([article.id]);
                            handleOpenBlindDialog('unblind');
                          }}
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    ) : (
                      <Tooltip title="블라인드">
                        <IconButton
                          size="small"
                          color="warning"
                          onClick={() => {
                            setSelectedArticles([article.id]);
                            handleOpenBlindDialog('blind');
                          }}
                        >
                          <VisibilityOffIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
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

      {/* 블라인드 다이얼로그 */}
      <Dialog open={openBlindDialog} onClose={handleCloseBlindDialog}>
        <DialogTitle>
          게시글 {blindAction === 'blind' ? '블라인드' : '블라인드 해제'}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            선택한 {selectedArticles.length}개의 게시글을 {blindAction === 'blind' ? '블라인드' : '블라인드 해제'} 처리하시겠습니까?
          </Typography>
          {blindAction === 'blind' && (
            <TextField
              label="블라인드 사유"
              fullWidth
              multiline
              rows={3}
              value={blindReason}
              onChange={(e) => setBlindReason(e.target.value)}
              placeholder="블라인드 사유를 입력하세요 (선택사항)"
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseBlindDialog} disabled={actionLoading}>
            취소
          </Button>
          <Button
            onClick={handleBlindArticles}
            color={blindAction === 'blind' ? 'warning' : 'primary'}
            disabled={actionLoading}
          >
            {actionLoading ? <CircularProgress size={24} /> : (blindAction === 'blind' ? '블라인드' : '블라인드 해제')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 게시글 상세 다이얼로그 */}
      <Dialog
        open={detailDialogOpen}
        onClose={handleCloseDetailDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>게시글 상세 정보</DialogTitle>
        <DialogContent>
          {selectedArticleDetail && (
            <Box sx={{ mt: 1 }}>
              <Typography variant="subtitle1">작성자 정보</Typography>
              <Typography variant="body2">
                {selectedArticleDetail.isAnonymous ? '익명' : (selectedArticleDetail.author?.name || selectedArticleDetail.nickname)}
              </Typography>
              <Typography variant="caption" display="block">
                ID: {selectedArticleDetail.author?.id || selectedArticleDetail.userId}
              </Typography>
              <Typography variant="caption" display="block" sx={{ mb: 2 }}>
                작성일: {new Date(selectedArticleDetail.createdAt).toLocaleString()}
                {selectedArticleDetail.isEdited && ' (수정됨)'}
              </Typography>

              <Typography variant="subtitle1">게시글 내용</Typography>
              <Paper variant="outlined" sx={{ p: 2, mb: 2, bgcolor: 'background.default' }}>
                <Typography variant="body1">
                  {selectedArticleDetail.emoji} {selectedArticleDetail.content}
                </Typography>
              </Paper>

              <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                <Chip
                  icon={<CommentIcon />}
                  label={`댓글 ${selectedArticleDetail.commentCount}개`}
                  variant="outlined"
                />
                <Chip
                  icon={<FavoriteIcon />}
                  label={`좋아요 ${selectedArticleDetail.likeCount || 0}개`}
                  variant="outlined"
                  color="primary"
                />
                {selectedArticleDetail.reportCount > 0 && (
                  <Chip
                    icon={<ReportIcon />}
                    label={`신고 ${selectedArticleDetail.reportCount}건`}
                    color="error"
                    variant="outlined"
                  />
                )}
                {selectedArticleDetail.isBlinded && (
                  <Chip
                    icon={<VisibilityOffIcon />}
                    label="블라인드"
                    color="warning"
                  />
                )}
              </Box>

              {selectedArticleDetail.isBlinded && (
                <Alert severity="warning" sx={{ mb: 2 }}>
                  <Typography variant="subtitle2">블라인드 사유</Typography>
                  <Typography variant="body2">
                    {selectedArticleDetail.blindReason || '사유가 지정되지 않았습니다.'}
                  </Typography>
                </Alert>
              )}

              {/* 댓글 목록 */}
              <Typography variant="subtitle1" sx={{ mt: 2 }}>
                댓글 목록
              </Typography>
              <Paper variant="outlined" sx={{ mb: 2 }}>
                {selectedArticleDetail.comments && selectedArticleDetail.comments.length > 0 ? (
                  selectedArticleDetail.comments.map((comment: any) => (
                    <Box
                      key={comment.id}
                      sx={{
                        p: 1.5,
                        borderBottom: '1px solid',
                        borderColor: 'divider',
                        '&:last-child': { borderBottom: 'none' }
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {comment.isAnonymous ? '익명' : comment.nickname}
                        </Typography>
                        <Typography variant="caption">
                          {new Date(comment.createdAt).toLocaleString()}
                        </Typography>
                      </Box>
                      <Typography
                        variant="body2"
                        sx={{
                          mt: 0.5,
                          textDecoration: comment.isBlinded ? 'line-through' : 'none',
                          color: comment.isBlinded ? 'text.disabled' : 'text.primary'
                        }}
                      >
                        {comment.emoji} {comment.content}
                      </Typography>
                      {comment.isBlinded && (
                        <Typography variant="caption" color="error">
                          (블라인드 처리됨: {comment.blindReason || '사유 없음'})
                        </Typography>
                      )}
                    </Box>
                  ))
                ) : (
                  <Box sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                      댓글이 없습니다.
                    </Typography>
                  </Box>
                )}
              </Paper>

              {selectedArticleDetail.reports && selectedArticleDetail.reports.length > 0 && (
                <>
                  <Typography variant="subtitle1" sx={{ mt: 2 }}>
                    신고 내역
                  </Typography>
                  <Paper variant="outlined" sx={{ mb: 2 }}>
                    {selectedArticleDetail.reports.map((report: any) => (
                      <Box
                        key={report.id}
                        sx={{
                          p: 1.5,
                          borderBottom: '1px solid',
                          borderColor: 'divider',
                          '&:last-child': { borderBottom: 'none' }
                        }}
                      >
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            신고자: {report.reporterNickname}
                          </Typography>
                          <Typography variant="caption">
                            {new Date(report.createdAt).toLocaleString()}
                          </Typography>
                        </Box>
                        <Typography variant="body2" sx={{ mt: 0.5 }}>
                          사유: {report.reason}
                        </Typography>
                        {report.description && (
                          <Typography variant="body2" sx={{ mt: 0.5 }}>
                            설명: {report.description}
                          </Typography>
                        )}
                        <Box sx={{ mt: 1 }}>
                          <Chip
                            size="small"
                            label={report.status === 'pending' ? '처리 대기' : (report.result === 'accepted' ? '수락됨' : '거절됨')}
                            color={report.status === 'pending' ? 'warning' : (report.result === 'accepted' ? 'success' : 'error')}
                          />
                        </Box>
                      </Box>
                    ))}
                  </Paper>
                </>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDetailDialog}>닫기</Button>
          {selectedArticleDetail && (
            selectedArticleDetail.isBlinded ? (
              <Button
                color="primary"
                onClick={() => {
                  setSelectedArticles([selectedArticleDetail.id]);
                  handleCloseDetailDialog();
                  handleOpenBlindDialog('unblind');
                }}
                startIcon={<VisibilityIcon />}
              >
                블라인드 해제
              </Button>
            ) : (
              <Button
                color="warning"
                onClick={() => {
                  setSelectedArticles([selectedArticleDetail.id]);
                  handleCloseDetailDialog();
                  handleOpenBlindDialog('blind');
                }}
                startIcon={<VisibilityOffIcon />}
              >
                블라인드
              </Button>
            )
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default function AdminCommunity() {
  const router = useRouter();
  const { user, loading, isAdmin } = useAuth();

  // 관리자 권한 확인
  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
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
    <Box sx={{
      p: 4,
      maxWidth: '100%',
      background: 'linear-gradient(to right bottom, #ffffff, #f8f9fa)',
      borderRadius: 2,
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
      minHeight: 'calc(100vh - 100px)'
    }}>
      <Box sx={{
        display: 'flex',
        alignItems: 'center',
        mb: 4,
        pb: 2,
        borderBottom: '1px solid rgba(0, 0, 0, 0.06)'
      }}>
        <ForumIcon sx={{ fontSize: 36, mr: 2, color: 'primary.main' }} />
        <Typography
          variant="h4"
          sx={{
            fontWeight: 600,
            background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}
        >
          커뮤니티 관리
        </Typography>
      </Box>

      <Box sx={{
        backgroundColor: '#fff',
        borderRadius: 2,
        p: 0,
        boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)'
      }}>
        <ArticleList />
      </Box>
    </Box>
  );
}
