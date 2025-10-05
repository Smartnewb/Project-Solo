'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import communityService, { Category } from '@/app/services/community';
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
  Tooltip,
  Tabs,
  Tab,
  Avatar
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import {
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Comment as CommentIcon,

  Forum as ForumIcon,
  Article as ArticleIcon,
  Refresh as RefreshIcon,
  Report as ReportIcon,
  Favorite as FavoriteIcon,
  Delete as DeleteIcon,
  MoveToInbox as MoveToInboxIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import UserDetailModal from '@/components/admin/appearance/UserDetailModal';
import AdminService from '@/app/services/admin';

// 게시글 목록 컴포넌트
function ArticleList() {
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

  // 게시글 삭제 관련 상태
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string>('');

  // 카테고리 이전 관련 상태
  const [openCategoryDialog, setOpenCategoryDialog] = useState(false);
  const [categoryTargetId, setCategoryTargetId] = useState<string>('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedArticleDetail, setSelectedArticleDetail] = useState<any>(null);
  const [startDate, setStartDate] = useState<Date | null>(new Date());
  const [endDate, setEndDate] = useState<Date | null>(new Date());
  // 카테고리 필터 상태
  const [selectedFilterCategoryId, setSelectedFilterCategoryId] = useState<string>('');
  // 사용자 프로필 상세 모달 상태
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  // 게시글 목록 조회
  const fetchArticles = async () => {
    try {
      setLoading(true);
      setError(null);
      const categoryId = selectedFilterCategoryId || null;
      const response = await communityService.getArticles(filter, page + 1, rowsPerPage, startDate, endDate, categoryId);
      setArticles(response.items ?? []);
      setTotalCount(response.meta?.totalItems ?? 0);
      console.log('페이지네이션 정보:', response.meta);
      console.log('게시글 목록 데이터:', response.items?.map(item => ({ id: item.id, isBlinded: item.isBlinded, blindedAt: (item as any).blindedAt })));
    } catch (error) {
      console.error('게시글 목록 조회 중 오류:', error);
      setError('게시글 목록을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 시작 날짜 변경 시
  const handleStartDateChange = (date: Date | null) => {
    setStartDate(date);
    setPage(0); // 날짜가 변경되면 첫 페이지로 이동
  };

  // 종료 날짜 변경 시
  const handleEndDateChange = (date: Date | null) => {
    setEndDate(date);
    setPage(0); // 날짜가 변경되면 첫 페이지로 이동
  };

  // 페이지 변경 시
  const handleChangePage = (_: unknown, newPage: number) => {
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

  // 필터 초기화
  const handleResetFilters = () => {
    setFilter('all');
    setSelectedFilterCategoryId('');
    setStartDate(new Date());
    setEndDate(new Date());
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

  // 게시글 삭제
  const handleDeleteArticle = async () => {
    try {
      setActionLoading(true);
      await communityService.deleteArticle(deleteTargetId);
      setSuccessMessage('게시글을 삭제했습니다.');
      fetchArticles();
      setOpenDeleteDialog(false);
      setDeleteTargetId('');
    } catch (error) {
      console.error('게시글 삭제 중 오류:', error);
      setError('게시글 삭제 중 오류가 발생했습니다.');
    } finally {
      setActionLoading(false);
    }
  };

  // 게시글 카테고리 이전
  const handleMoveCategory = async () => {
    try {
      setActionLoading(true);
      await communityService.moveArticleCategory(categoryTargetId, selectedCategoryId);
      setSuccessMessage('게시글 카테고리를 이전했습니다.');
      fetchArticles();
      setOpenCategoryDialog(false);
      setCategoryTargetId('');
      setSelectedCategoryId('');
    } catch (error) {
      console.error('게시글 카테고리 이전 중 오류:', error);
      setError('게시글 카테고리 이전 중 오류가 발생했습니다.');
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

      // 게시글 ID를 이용해 댓글 정보 가져오기
      const commentsResponse = await communityService.getComments(id);

      console.log('댓글 원본 데이터:', commentsResponse?.items);

      const commentsWithAuthor = commentsResponse?.items?.map((comment: any) => {
        console.log('댓글 정보:', comment);
        return {
          ...comment,
          author: {
            id: comment.author_id ?? comment.userId ?? '',
            name: comment.author_name ?? comment.author?.name ?? comment.nickname ?? '익명',
          }
        };
      }) ?? [];

      // 게시글 상세 정보 구성
      const articleDetail = {
        ...selectedArticle,
        likeCount: selectedArticle.likeCount ?? 0,
        author: {
          id: selectedArticle.author?.id ?? selectedArticle.userId ?? '',
          name: selectedArticle.author?.name ?? selectedArticle.nickname ?? '익명',
        },
        comments: commentsWithAuthor,
        reports: []
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
  }, [filter, page, rowsPerPage, startDate, endDate, selectedFilterCategoryId]);

  // 카테고리 목록 조회
  const fetchCategories = async () => {
    try {
      const response = await communityService.getCategories();
      setCategories(response.categories ?? []);
    } catch (error) {
      console.error('카테고리 목록 조회 중 오류:', error);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

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

          <FormControl variant="outlined" size="small" sx={{ minWidth: 150 }}>
            <Select
              value={selectedFilterCategoryId}
              onChange={(e) => {
                setSelectedFilterCategoryId(e.target.value);
                setPage(0); // 페이지를 첫 번째로 리셋
              }}
              displayEmpty
              size="small"
            >
              <MenuItem value="">전체 카테고리</MenuItem>
              {categories.map((category) => (
                <MenuItem key={category.id} value={category.id}>
                  {category.displayName}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DatePicker
              label="시작 날짜"
              value={startDate}
              onChange={handleStartDateChange}
              slotProps={{
                textField: {
                  size: 'small',
                  sx: { width: 180 }
                }
              }}
            />
          </LocalizationProvider>

          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DatePicker
              label="종료 날짜"
              value={endDate}
              onChange={handleEndDateChange}
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

          <Button
            variant="outlined"
            size="small"
            color="secondary"
            onClick={handleResetFilters}
          >
            필터 초기화
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
              <TableCell>제목</TableCell>
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
                <TableCell colSpan={9} align="center">
                  <CircularProgress size={24} sx={{ my: 2 }} />
                </TableCell>
              </TableRow>
            ) : articles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} align="center">
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
                    <Typography
                      variant="body2"
                      sx={{ color: 'primary.main', textDecoration: 'underline', cursor: 'pointer', display: 'inline' }}
                      onClick={() => {
                        const uid = article.author?.id ?? article.userId;
                        if (uid) { setSelectedUserId(uid); setUserModalOpen(true); }
                      }}
                   >
                      {(article.author?.name ?? article.nickname ?? '익명')}{article.anonymous ? ` (${article.anonymous})` : ''}
                    </Typography>
                    <Typography variant="caption" color="textSecondary" display="block">
                      ID: {article.author?.id ?? article.userId}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography
                      variant="body2"
                      sx={{
                        maxWidth: 200,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        textDecoration: (article.isBlinded || (article as any).blindedAt) ? 'line-through' : 'none',
                        color: (article.isBlinded || (article as any).blindedAt) ? 'text.disabled' : 'text.primary'
                      }}
                    >
                      {article.title ?? '제목 없음'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography
                      variant="body2"
                      sx={{
                        maxWidth: 200,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        textDecoration: (article.isBlinded || (article as any).blindedAt) ? 'line-through' : 'none',
                        color: (article.isBlinded || (article as any).blindedAt) ? 'text.disabled' : 'text.primary'
                      }}
                    >
                      {article.emoji} {article.content}
                    </Typography>
                  </TableCell>
                  <TableCell>{article.commentCount}</TableCell>
                  <TableCell>{article.likeCount ?? 0}</TableCell>
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
                    {(article.isBlinded || (article as any).blindedAt) ? (
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
                    {(article.isBlinded || (article as any).blindedAt) ? (
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
                    <Tooltip title="카테고리 이전">
                      <IconButton
                        size="small"
                        color="info"
                        onClick={() => {
                          setCategoryTargetId(article.id);
                          setOpenCategoryDialog(true);
                        }}
                      >
                        <MoveToInboxIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="게시글 삭제">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => {
                          setDeleteTargetId(article.id);
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
              <Typography
                variant="body2"
                sx={{ color: 'primary.main', textDecoration: 'underline', cursor: 'pointer', display: 'inline' }}
                onClick={() => {
                  const uid = selectedArticleDetail.author?.id ?? selectedArticleDetail.userId;
                  if (uid) { setSelectedUserId(uid); setUserModalOpen(true); }
                }}
              >
                {(selectedArticleDetail.author?.name ?? selectedArticleDetail.nickname ?? '익명')}{selectedArticleDetail.anonymous ? ` (${selectedArticleDetail.anonymous})` : ''}
              </Typography>
              <Typography variant="caption" display="block">
                ID: {selectedArticleDetail.author?.id ?? selectedArticleDetail.userId}
              </Typography>
              <Typography variant="caption" display="block" sx={{ mb: 2 }}>
                작성일: {new Date(selectedArticleDetail.createdAt).toLocaleString()}
                {selectedArticleDetail.isEdited && ' (수정됨)'}
              </Typography>

              <Typography variant="subtitle1">게시글 제목</Typography>
              <Paper variant="outlined" sx={{ p: 2, mb: 2, bgcolor: 'background.default' }}>
                <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                  {selectedArticleDetail.title ?? '제목 없음'}
                </Typography>
              </Paper>

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
                  label={`좋아요 ${selectedArticleDetail.likeCount ?? 0}개`}
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
                {(selectedArticleDetail.isBlinded || (selectedArticleDetail as any).blindedAt) && (
                  <Chip
                    icon={<VisibilityOffIcon />}
                    label="블라인드"
                    color="warning"
                  />
                )}
              </Box>

              {(selectedArticleDetail.isBlinded || (selectedArticleDetail as any).blindedAt) && (
                <Alert severity="warning" sx={{ mb: 2 }}>
                  <Typography variant="subtitle2">블라인드 사유</Typography>
                  <Typography variant="body2">
                    {selectedArticleDetail.blindReason ?? '사유가 지정되지 않았습니다.'}
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
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {comment.isAnonymous ? '익명' : (comment.author?.name ?? comment.author_name ?? comment.nickname)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            ID: {comment.author?.id ?? comment.author_id ?? comment.userId}
                          </Typography>
                        </Box>
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
                          (블라인드 처리됨: {comment.blindReason ?? '사유 없음'})
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
            <>
              {(selectedArticleDetail.isBlinded || (selectedArticleDetail as any).blindedAt) ? (
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
              )}
              <Button
                color="info"
                onClick={() => {
                  setCategoryTargetId(selectedArticleDetail.id);
                  handleCloseDetailDialog();
                  setOpenCategoryDialog(true);
                }}
                startIcon={<MoveToInboxIcon />}
              >
                카테고리 이전
              </Button>
              <Button
                color="error"
                onClick={() => {
                  setDeleteTargetId(selectedArticleDetail.id);
                  handleCloseDetailDialog();
                  setOpenDeleteDialog(true);
                }}
                startIcon={<DeleteIcon />}
              >
                삭제
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>

      {/* 게시글 삭제 확인 다이얼로그 */}
      <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
        <DialogTitle>게시글 삭제 확인</DialogTitle>
        <DialogContent>
          <Typography>
            정말로 이 게시글을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)} disabled={actionLoading}>
            취소
          </Button>
          <Button
            onClick={handleDeleteArticle}
            color="error"
            disabled={actionLoading}
          >
            {actionLoading ? <CircularProgress size={24} /> : '삭제'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 카테고리 이전 다이얼로그 */}
      <Dialog open={openCategoryDialog} onClose={() => setOpenCategoryDialog(false)}>
        <DialogTitle>게시글 카테고리 이전</DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 2 }}>
            이 게시글을 어느 카테고리로 이전하시겠습니까?
          </Typography>
          <FormControl fullWidth>
            <InputLabel>카테고리 선택</InputLabel>
            <Select
              value={selectedCategoryId}
              onChange={(e) => setSelectedCategoryId(e.target.value)}
              label="카테고리 선택"
            >
              {categories.map((category) => (
                <MenuItem key={category.id} value={category.id}>
                  {category.displayName}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCategoryDialog(false)} disabled={actionLoading}>
            취소
          </Button>
          <Button
            onClick={handleMoveCategory}
            color="primary"
            disabled={actionLoading || !selectedCategoryId}
          >
            {actionLoading ? <CircularProgress size={24} /> : '이전'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 사용자 프로필 상세 모달 */}
      <UserDetailModal
        open={userModalOpen}
        onClose={() => setUserModalOpen(false)}
        userId={selectedUserId}
        userDetail={{ id: '', name: '', age: 0, gender: 'MALE', profileImages: [] }}
        loading={false}
        error={null}
      />

    </Box>

  );
}

// 신고 관리 컴포넌트
function ReportList() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [statusFilter, setStatusFilter] = useState<'pending' | 'reviewing' | 'resolved' | 'rejected'>('pending');
  const [reporterNameFilter, setReporterNameFilter] = useState('');
  const [reportedNameFilter, setReportedNameFilter] = useState('');
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [openDetailDialog, setOpenDetailDialog] = useState(false);

  // 사용자 상세 정보 모달 관련 상태
  const [userDetailModalOpen, setUserDetailModalOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [userDetail, setUserDetail] = useState<any>(null);
  const [loadingUserDetail, setLoadingUserDetail] = useState(false);
  const [userDetailError, setUserDetailError] = useState<string | null>(null);

  // 게시글 관리 관련 상태
  const [actionLoading, setActionLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [openBlindDialog, setOpenBlindDialog] = useState(false);
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(null);
  const [blindAction, setBlindAction] = useState<'blind' | 'unblind'>('blind');

  // 신고 목록 조회
  const fetchReports = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await communityService.getCommunityReports(
        page + 1,
        rowsPerPage,
        statusFilter,
        reporterNameFilter || undefined,
        reportedNameFilter || undefined
      );
      setReports(response.items ?? []);
      setTotalCount(response.meta?.totalItems ?? 0);
      console.log('신고 목록 데이터:', response.items);
    } catch (error) {
      console.error('신고 목록 조회 중 오류:', error);
      setError('신고 목록을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 페이지 변경
  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  // 페이지당 행 수 변경
  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // 상태 필터 변경
  const handleStatusFilterChange = (event: any) => {
    setStatusFilter(event.target.value);
    setPage(0);
  };

  // 신고자 이름 필터 변경
  const handleReporterNameFilterChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setReporterNameFilter(event.target.value);
  };

  // 신고당한 사용자 이름 필터 변경
  const handleReportedNameFilterChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setReportedNameFilter(event.target.value);
  };

  // 필터 적용
  const handleApplyFilters = () => {
    setPage(0);
    fetchReports();
  };

  // 신고 상세 보기
  const handleViewDetail = (report: any) => {
    setSelectedReport(report);
    setOpenDetailDialog(true);
  };

  // 사용자 상세 정보 모달 열기
  const handleOpenUserDetailModal = async (userId: string) => {
    try {
      setSelectedUserId(userId);
      setUserDetailModalOpen(true);
      setLoadingUserDetail(true);
      setUserDetailError(null);
      setUserDetail(null);

      console.log('유저 상세 정보 조회 요청:', userId);
      const data = await AdminService.userAppearance.getUserDetails(userId);
      console.log('유저 상세 정보 응답:', data);

      setUserDetail(data);
    } catch (error: any) {
      console.error('유저 상세 정보 조회 중 오류:', error);
      setUserDetailError(error.message || '유저 상세 정보를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoadingUserDetail(false);
    }
  };

  // 사용자 상세 정보 모달 닫기
  const handleCloseUserDetailModal = () => {
    setUserDetailModalOpen(false);
  };

  // 게시글 블라인드 처리
  const handleBlindArticle = (articleId: string, isBlinded: boolean) => {
    setSelectedArticleId(articleId);
    setBlindAction(isBlinded ? 'unblind' : 'blind');
    setOpenBlindDialog(true);
  };

  // 게시글 블라인드 처리 확인
  const handleConfirmBlind = async () => {
    if (!selectedArticleId) return;

    try {
      setActionLoading(true);
      const isBlinded = blindAction === 'blind';

      await communityService.blindArticle(selectedArticleId, isBlinded);

      setSuccessMessage(`게시글이 ${isBlinded ? '블라인드' : '블라인드 해제'} 처리되었습니다.`);
      setOpenBlindDialog(false);
      fetchReports(); // 목록 새로고침
    } catch (error) {
      console.error('게시글 블라인드 처리 중 오류:', error);
      setError('게시글 블라인드 처리 중 오류가 발생했습니다.');
    } finally {
      setActionLoading(false);
    }
  };

  // 게시글 삭제
  const handleDeleteArticle = async (articleId: string) => {
    if (!confirm('정말로 이 게시글을 삭제하시겠습니까?')) return;

    try {
      setActionLoading(true);

      await communityService.deleteArticle(articleId);

      setSuccessMessage('게시글이 삭제되었습니다.');
      fetchReports(); // 목록 새로고침
    } catch (error) {
      console.error('게시글 삭제 중 오류:', error);
      setError('게시글 삭제 중 오류가 발생했습니다.');
    } finally {
      setActionLoading(false);
    }
  };

  // 신고 목록 조회
  useEffect(() => {
    fetchReports();
  }, [page, rowsPerPage, statusFilter]);

  // 성공 메시지 초기화
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // 상태에 따른 칩 색상
  const getStatusChipColor = (status: string) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'reviewing': return 'info';
      case 'resolved': return 'success';
      case 'rejected': return 'error';
      default: return 'default';
    }
  };

  // 상태 한글 변환
  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return '대기중';
      case 'reviewing': return '검토중';
      case 'resolved': return '처리완료';
      case 'rejected': return '반려';
      default: return status;
    }
  };

  return (
    <Box>
      {/* 필터 및 검색 */}
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="h6">
            신고 관리 ({totalCount})
          </Typography>

          <FormControl variant="outlined" size="small" sx={{ minWidth: 120 }}>
            <InputLabel id="status-filter-label">상태</InputLabel>
            <Select
              labelId="status-filter-label"
              value={statusFilter}
              onChange={handleStatusFilterChange}
              label="상태"
            >
              <MenuItem value="pending">대기중</MenuItem>
              <MenuItem value="reviewing">검토중</MenuItem>
              <MenuItem value="resolved">처리완료</MenuItem>
              <MenuItem value="rejected">반려</MenuItem>
            </Select>
          </FormControl>

          <TextField
            label="신고자 이름"
            variant="outlined"
            size="small"
            value={reporterNameFilter}
            onChange={handleReporterNameFilterChange}
            sx={{ minWidth: 150 }}
          />

          <TextField
            label="신고당한 사용자 이름"
            variant="outlined"
            size="small"
            value={reportedNameFilter}
            onChange={handleReportedNameFilterChange}
            sx={{ minWidth: 150 }}
          />

          <Button
            variant="contained"
            onClick={handleApplyFilters}
            sx={{ height: 40 }}
          >
            검색
          </Button>
        </Box>

        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={fetchReports}
        >
          새로고침
        </Button>
      </Box>

      {/* 에러 메시지 */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* 성공 메시지 */}
      {successMessage && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {successMessage}
        </Alert>
      )}

      {/* 신고 목록 테이블 */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>신고자</TableCell>
              <TableCell>신고당한 사용자</TableCell>
              <TableCell>게시글 제목</TableCell>
              <TableCell>신고 사유</TableCell>
              <TableCell>상태</TableCell>
              <TableCell>신고일</TableCell>
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
                  신고 내역이 없습니다.
                </TableCell>
              </TableRow>
            ) : (
              reports.map((report) => (
                <TableRow key={report.id}>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Avatar
                        src={report.reporter?.profileImageUrl}
                        sx={{
                          width: 32,
                          height: 32,
                          cursor: 'pointer',
                          '&:hover': {
                            opacity: 0.8
                          }
                        }}
                        onClick={() => handleOpenUserDetailModal(report.reporter?.id)}
                      >
                        <PersonIcon />
                      </Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight="medium">
                          {report.reporter?.name || '알 수 없음'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {report.reporter?.phoneNumber || ''}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Avatar
                        src={report.reported?.profileImageUrl}
                        sx={{
                          width: 32,
                          height: 32,
                          cursor: 'pointer',
                          '&:hover': {
                            opacity: 0.8
                          }
                        }}
                        onClick={() => handleOpenUserDetailModal(report.reported?.id)}
                      >
                        <PersonIcon />
                      </Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight="medium">
                          {report.reported?.name || '알 수 없음'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {report.reported?.phoneNumber || ''}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                      {report.article?.title || '제목 없음'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" noWrap sx={{ maxWidth: 150 }}>
                      {report.reason || '사유 없음'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={getStatusText(report.status)}
                      color={getStatusChipColor(report.status) as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {new Date(report.createdAt).toLocaleDateString('ko-KR', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => handleViewDetail(report)}
                      >
                        상세보기
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        color={report.article?.blindedAt ? "success" : "warning"}
                        onClick={() => handleBlindArticle(report.article?.id, !!report.article?.blindedAt)}
                        disabled={actionLoading}
                      >
                        {report.article?.blindedAt ? '블라인드 해제' : '블라인드'}
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        color="error"
                        onClick={() => handleDeleteArticle(report.article?.id)}
                        disabled={actionLoading}
                      >
                        삭제
                      </Button>
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* 페이지네이션 */}
      <TablePagination
        rowsPerPageOptions={[5, 10, 25]}
        component="div"
        count={totalCount}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        labelRowsPerPage="페이지당 행 수:"
        labelDisplayedRows={({ from, to, count }) => `${from}-${to} / ${count}`}
      />

      {/* 신고 상세 다이얼로그 */}
      <Dialog
        open={openDetailDialog}
        onClose={() => setOpenDetailDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>신고 상세 정보</DialogTitle>
        <DialogContent>
          {selectedReport && (
            <Box sx={{ mt: 1 }}>
              <Typography variant="h6" gutterBottom>신고 정보</Typography>
              <Box sx={{ mb: 2 }}>
                <Typography><Box component="span" fontWeight="bold">신고 ID:</Box> {selectedReport.id}</Typography>
                <Typography><Box component="span" fontWeight="bold">신고 사유:</Box> {selectedReport.reason}</Typography>
                <Typography><Box component="span" fontWeight="bold">상태:</Box> {getStatusText(selectedReport.status)}</Typography>
                <Typography><Box component="span" fontWeight="bold">신고일:</Box> {new Date(selectedReport.createdAt).toLocaleString('ko-KR')}</Typography>
              </Box>

              <Typography variant="h6" gutterBottom>신고자 정보</Typography>
              <Box sx={{ mb: 2 }}>
                <Typography><Box component="span" fontWeight="bold">이름:</Box> {selectedReport.reporter?.name}</Typography>
                <Typography><Box component="span" fontWeight="bold">이메일:</Box> {selectedReport.reporter?.email}</Typography>
                <Typography><Box component="span" fontWeight="bold">전화번호:</Box> {selectedReport.reporter?.phoneNumber}</Typography>
                <Typography><Box component="span" fontWeight="bold">나이:</Box> {selectedReport.reporter?.age}세</Typography>
                <Typography><Box component="span" fontWeight="bold">성별:</Box> {selectedReport.reporter?.gender === 'MALE' ? '남성' : '여성'}</Typography>
              </Box>

              <Typography variant="h6" gutterBottom>신고당한 사용자 정보</Typography>
              <Box sx={{ mb: 2 }}>
                <Typography><Box component="span" fontWeight="bold">이름:</Box> {selectedReport.reported?.name}</Typography>
                <Typography><Box component="span" fontWeight="bold">이메일:</Box> {selectedReport.reported?.email}</Typography>
                <Typography><Box component="span" fontWeight="bold">전화번호:</Box> {selectedReport.reported?.phoneNumber}</Typography>
                <Typography><Box component="span" fontWeight="bold">나이:</Box> {selectedReport.reported?.age}세</Typography>
                <Typography><Box component="span" fontWeight="bold">성별:</Box> {selectedReport.reported?.gender === 'MALE' ? '남성' : '여성'}</Typography>
              </Box>

              <Typography variant="h6" gutterBottom>게시글 정보</Typography>
              <Box sx={{ mb: 2 }}>
                <Typography><Box component="span" fontWeight="bold">제목:</Box> {selectedReport.article?.title}</Typography>
                <Typography><Box component="span" fontWeight="bold">내용:</Box></Typography>
                <Paper sx={{ p: 2, mt: 1, backgroundColor: '#f5f5f5' }}>
                  <Typography variant="body2" style={{ whiteSpace: 'pre-wrap' }}>
                    {selectedReport.article?.content}
                  </Typography>
                </Paper>
                <Typography><Box component="span" fontWeight="bold">작성일:</Box> {new Date(selectedReport.article?.createdAt).toLocaleString('ko-KR')}</Typography>
                <Typography><Box component="span" fontWeight="bold">블라인드 상태:</Box> {selectedReport.article?.blindedAt ? '블라인드 처리됨' : '정상'}</Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDetailDialog(false)}>닫기</Button>
        </DialogActions>
      </Dialog>

      {/* 블라인드 확인 다이얼로그 */}
      <Dialog
        open={openBlindDialog}
        onClose={() => setOpenBlindDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          게시글 {blindAction === 'blind' ? '블라인드' : '블라인드 해제'} 확인
        </DialogTitle>
        <DialogContent>
          <Typography>
            정말로 이 게시글을 {blindAction === 'blind' ? '블라인드' : '블라인드 해제'} 처리하시겠습니까?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenBlindDialog(false)}>취소</Button>
          <Button
            onClick={handleConfirmBlind}
            color={blindAction === 'blind' ? 'warning' : 'success'}
            variant="contained"
            disabled={actionLoading}
          >
            {actionLoading ? '처리중...' : (blindAction === 'blind' ? '블라인드' : '블라인드 해제')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 사용자 상세 정보 모달 */}
      {!!userDetail && (
        <UserDetailModal
          open={userDetailModalOpen}
          onClose={handleCloseUserDetailModal}
          userId={selectedUserId}
          userDetail={userDetail}
          loading={loadingUserDetail}
          error={userDetailError}
          onRefresh={() => {
            fetchReports();
          }}
        />
      )}
    </Box>
  );
}

export default function AdminCommunity() {
  const router = useRouter();
  const { user, loading, isAdmin } = useAuth();
  const [currentTab, setCurrentTab] = useState(0);

  // 탭 변경 핸들러
  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

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
        {/* 탭 네비게이션 */}
        <Tabs
          value={currentTab}
          onChange={handleTabChange}
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            px: 2
          }}
        >
          <Tab
            label="게시글 관리"
            icon={<ArticleIcon />}
            iconPosition="start"
          />
          <Tab
            label="신고 관리"
            icon={<ReportIcon />}
            iconPosition="start"
          />
        </Tabs>

        {/* 탭 컨텐츠 */}
        <Box sx={{ p: 2 }}>
          {currentTab === 0 && <ArticleList />}
          {currentTab === 1 && <ReportList />}
        </Box>
      </Box>
    </Box>
  );
}
