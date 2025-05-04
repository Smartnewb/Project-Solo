'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import communityService from '@/app/services/community';
import {
  Box,
  Typography,
  Paper,
  Divider,
  Chip,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Card,
  CardContent,
  CardHeader,
  Avatar,
  Tooltip,
  Grid
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Delete as DeleteIcon,
  Report as ReportIcon,
  ArrowBack as ArrowBackIcon,
  Warning as WarningIcon
} from '@mui/icons-material';

export default function ArticleDetail() {
  const router = useRouter();
  const params = useParams();
  const { user, loading, isAuthenticated } = useAdminAuth();
  const [article, setArticle] = useState<any>(null);
  const [articleLoading, setArticleLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openBlindDialog, setOpenBlindDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [blindReason, setBlindReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [selectedComment, setSelectedComment] = useState<any>(null);
  const [openCommentBlindDialog, setOpenCommentBlindDialog] = useState(false);
  const [openCommentDeleteDialog, setOpenCommentDeleteDialog] = useState(false);
  const [commentBlindReason, setCommentBlindReason] = useState('');

  // 게시글 ID
  const articleId = params?.id as string;

  // 게시글 상세 조회
  const fetchArticleDetail = async () => {
    try {
      setArticleLoading(true);
      setError(null);
      const response = await communityService.getArticleDetail(articleId);
      setArticle(response);
    } catch (error) {
      console.error('게시글 상세 조회 중 오류:', error);
      setError('게시글을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setArticleLoading(false);
    }
  };

  // 블라인드 처리 다이얼로그 열기
  const handleOpenBlindDialog = () => {
    setBlindReason(article?.blindReason || '');
    setOpenBlindDialog(true);
  };

  // 블라인드 처리 다이얼로그 닫기
  const handleCloseBlindDialog = () => {
    setOpenBlindDialog(false);
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
  const handleBlindArticle = async (isBlinded: boolean) => {
    try {
      setActionLoading(true);
      await communityService.blindArticle(articleId, isBlinded, blindReason);
      setSuccessMessage(`게시글을 ${isBlinded ? '블라인드' : '블라인드 해제'} 처리했습니다.`);
      fetchArticleDetail();
      handleCloseBlindDialog();
    } catch (error) {
      console.error('게시글 블라인드 처리 중 오류:', error);
      setError(`게시글 ${isBlinded ? '블라인드' : '블라인드 해제'} 처리 중 오류가 발생했습니다.`);
    } finally {
      setActionLoading(false);
    }
  };

  // 게시글 삭제
  const handleDeleteArticle = async () => {
    try {
      setActionLoading(true);
      await communityService.deleteArticle(articleId);
      setSuccessMessage('게시글을 삭제했습니다.');
      router.push('/admin/community');
    } catch (error) {
      console.error('게시글 삭제 중 오류:', error);
      setError('게시글 삭제 중 오류가 발생했습니다.');
      setActionLoading(false);
      handleCloseDeleteDialog();
    }
  };

  // 댓글 블라인드 다이얼로그 열기
  const handleOpenCommentBlindDialog = (comment: any) => {
    setSelectedComment(comment);
    setCommentBlindReason(comment?.blindReason || '');
    setOpenCommentBlindDialog(true);
  };

  // 댓글 블라인드 다이얼로그 닫기
  const handleCloseCommentBlindDialog = () => {
    setOpenCommentBlindDialog(false);
    setSelectedComment(null);
  };

  // 댓글 삭제 다이얼로그 열기
  const handleOpenCommentDeleteDialog = (comment: any) => {
    setSelectedComment(comment);
    setOpenCommentDeleteDialog(true);
  };

  // 댓글 삭제 다이얼로그 닫기
  const handleCloseCommentDeleteDialog = () => {
    setOpenCommentDeleteDialog(false);
    setSelectedComment(null);
  };

  // 댓글 블라인드 처리
  const handleBlindComment = async (isBlinded: boolean) => {
    if (!selectedComment) return;

    try {
      setActionLoading(true);
      await communityService.blindComment(selectedComment.id, isBlinded, commentBlindReason);
      setSuccessMessage(`댓글을 ${isBlinded ? '블라인드' : '블라인드 해제'} 처리했습니다.`);
      fetchArticleDetail();
      handleCloseCommentBlindDialog();
    } catch (error) {
      console.error('댓글 블라인드 처리 중 오류:', error);
      setError(`댓글 ${isBlinded ? '블라인드' : '블라인드 해제'} 처리 중 오류가 발생했습니다.`);
    } finally {
      setActionLoading(false);
    }
  };

  // 댓글 삭제
  const handleDeleteComment = async () => {
    if (!selectedComment) return;

    try {
      setActionLoading(true);
      await communityService.deleteComment(selectedComment.id);
      setSuccessMessage('댓글을 삭제했습니다.');
      fetchArticleDetail();
      handleCloseCommentDeleteDialog();
    } catch (error) {
      console.error('댓글 삭제 중 오류:', error);
      setError('댓글 삭제 중 오류가 발생했습니다.');
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

  // 게시글 상세 조회
  useEffect(() => {
    if (articleId) {
      fetchArticleDetail();
    }
  }, [articleId]);

  // 관리자 권한 확인
  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    } else if (!loading && user && !isAuthenticated) {
      router.push('/');
    }
  }, [user, loading, isAuthenticated, router]);

  if (loading || articleLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!user || !isAuthenticated) {
    return null;
  }

  if (error && !article) {
    return (
      <Box sx={{ p: 3 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => router.push('/admin/community')}
          sx={{ mb: 2 }}
        >
          목록으로 돌아가기
        </Button>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => router.push('/admin/community')}
        sx={{ mb: 2 }}
      >
        목록으로 돌아가기
      </Button>

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

      {article && (
        <>
          {/* 게시글 정보 */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h5">게시글 상세</Typography>
              <Box>
                <Button
                  variant="outlined"
                  color={article.isBlinded ? "success" : "warning"}
                  onClick={handleOpenBlindDialog}
                  startIcon={article.isBlinded ? <VisibilityIcon /> : <VisibilityOffIcon />}
                  sx={{ mr: 1 }}
                >
                  {article.isBlinded ? '블라인드 해제' : '블라인드'}
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  onClick={handleOpenDeleteDialog}
                  startIcon={<DeleteIcon />}
                >
                  삭제
                </Button>
              </Box>
            </Box>

            <Divider sx={{ mb: 2 }} />

            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="textSecondary">작성자</Typography>
                <Typography variant="body1">
                  {article.anonymous ? '익명' : (article.author?.name || '알 수 없음')}
                  {article.author?.email && `(${article.author.email})`}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="textSecondary">작성일</Typography>
                <Typography variant="body1">
                  {article.createdAt ? new Date(article.createdAt).toLocaleString() : '알 수 없음'}
                  {article.isEdited && ' (수정됨)'}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="textSecondary">상태</Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  {article.isBlinded ? (
                    <Chip label="블라인드" color="warning" />
                  ) : article.isDeleted ? (
                    <Chip label="삭제됨" color="error" />
                  ) : (
                    <Chip label="정상" color="success" />
                  )}
                  {article.isEdited && (
                    <Chip label="수정됨" color="info" variant="outlined" />
                  )}
                </Box>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="textSecondary">통계</Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Chip label={`좋아요 ${article.likeCount}`} color="primary" variant="outlined" />
                  <Chip label={`댓글 ${article.commentCount}`} color="primary" variant="outlined" />
                  <Chip
                    label={`신고 ${article.reportCount}`}
                    color={article.reportCount > 0 ? "error" : "default"}
                    variant="outlined"
                    icon={article.reportCount > 0 ? <ReportIcon /> : undefined}
                  />
                </Box>
              </Grid>
            </Grid>

            {article.isBlinded && article.blindReason && (
              <Box sx={{ mt: 2, p: 2, bgcolor: 'warning.light', borderRadius: 1 }}>
                <Typography variant="subtitle2" color="warning.dark">블라인드 사유</Typography>
                <Typography variant="body2">{article.blindReason}</Typography>
              </Box>
            )}

            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle2" color="textSecondary">내용</Typography>
              <Paper variant="outlined" sx={{ p: 2, mt: 1, whiteSpace: 'pre-wrap' }}>
                <Typography variant="body1">
                  {article.emoji && article.emoji} {article.content}
                </Typography>
              </Paper>
            </Box>
          </Paper>

          {/* 신고 목록 */}
          {article.reports && article.reports.length > 0 && (
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                신고 내역 ({article.reports.length})
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <List>
                {article.reports.map((report: any) => (
                  <ListItem key={report.id} divider>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <ReportIcon color="error" fontSize="small" />
                          <Typography variant="subtitle2">
                            {report.reason}
                          </Typography>
                          <Chip
                            label={report.status === 'pending' ? '대기 중' : report.result === 'accepted' ? '수락됨' : '거절됨'}
                            color={report.status === 'pending' ? 'warning' : report.result === 'accepted' ? 'success' : 'error'}
                            size="small"
                          />
                        </Box>
                      }
                      secondary={
                        <>
                          <Typography variant="body2" component="span">
                            신고자: {report.reporterNickname} | 신고일: {new Date(report.createdAt).toLocaleString()}
                          </Typography>
                          {report.description && (
                            <Typography variant="body2" sx={{ mt: 1 }}>
                              상세 내용: {report.description}
                            </Typography>
                          )}
                          {report.status === 'processed' && (
                            <Typography variant="body2" sx={{ mt: 1 }}>
                              처리 결과: {report.result === 'accepted' ? '수락' : '거절'}
                              {report.processMemo && ` (${report.processMemo})`}
                            </Typography>
                          )}
                        </>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </Paper>
          )}

          {/* 댓글 목록 */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              댓글 목록 ({article.comments?.length || 0})
            </Typography>
            <Divider sx={{ mb: 2 }} />

            {article.comments && article.comments.length > 0 ? (
              <List>
                {article.comments.map((comment: any) => (
                  <Card key={comment.id} sx={{ mb: 2, ...(comment.isBlinded && { bgcolor: 'action.hover' }) }}>
                    <CardHeader
                      avatar={
                        <Avatar>
                          {(comment.nickname || comment.author?.name || '')?.charAt(0) || 'U'}
                        </Avatar>
                      }
                      title={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="subtitle2">
                            {comment.anonymous || comment.isAnonymous ? '익명' :
                             (comment.nickname || comment.author?.name || '알 수 없음')}
                          </Typography>
                          {comment.isBlinded && (
                            <Chip label="블라인드" size="small" color="warning" />
                          )}
                          {comment.isDeleted && (
                            <Chip label="삭제됨" size="small" color="error" />
                          )}
                          {(comment.reportCount > 0) && (
                            <Chip
                              icon={<ReportIcon />}
                              label={comment.reportCount}
                              size="small"
                              color="error"
                            />
                          )}
                        </Box>
                      }
                      subheader={
                        <Typography variant="caption" color="textSecondary">
                          {comment.createdAt ? new Date(comment.createdAt).toLocaleString() : '알 수 없음'}
                          {comment.isEdited && ' (수정됨)'}
                        </Typography>
                      }
                      action={
                        <Box>
                          <Tooltip title={comment.isBlinded ? "블라인드 해제" : "블라인드"}>
                            <IconButton
                              size="small"
                              color={comment.isBlinded ? "success" : "warning"}
                              onClick={() => handleOpenCommentBlindDialog(comment)}
                            >
                              {comment.isBlinded ? (
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
                              onClick={() => handleOpenCommentDeleteDialog(comment)}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      }
                    />
                    <CardContent>
                      {comment.isBlinded && comment.blindReason && (
                        <Box sx={{ mb: 2, p: 1, bgcolor: 'warning.light', borderRadius: 1 }}>
                          <Typography variant="caption" color="warning.dark">
                            블라인드 사유: {comment.blindReason}
                          </Typography>
                        </Box>
                      )}
                      <Typography
                        variant="body2"
                        sx={{
                          whiteSpace: 'pre-wrap',
                          ...(comment.isBlinded && { color: 'text.disabled', textDecoration: 'line-through' })
                        }}
                      >
                        {comment.emoji && comment.emoji} {comment.content || '(내용 없음)'}
                      </Typography>
                    </CardContent>
                  </Card>
                ))}
              </List>
            ) : (
              <Typography variant="body2" color="textSecondary" align="center">
                댓글이 없습니다.
              </Typography>
            )}
          </Paper>
        </>
      )}

      {/* 블라인드 처리 다이얼로그 */}
      <Dialog open={openBlindDialog} onClose={handleCloseBlindDialog}>
        <DialogTitle>
          {article?.isBlinded ? '게시글 블라인드 해제' : '게시글 블라인드 처리'}
        </DialogTitle>
        <DialogContent>
          {article?.isBlinded ? (
            <Typography variant="body1">
              이 게시글의 블라인드를 해제하시겠습니까?
            </Typography>
          ) : (
            <>
              <Typography variant="body1" sx={{ mb: 2 }}>
                이 게시글을 블라인드 처리하시겠습니까?
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
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseBlindDialog} disabled={actionLoading}>
            취소
          </Button>
          <Button
            onClick={() => handleBlindArticle(!article?.isBlinded)}
            color={article?.isBlinded ? "success" : "warning"}
            disabled={actionLoading}
          >
            {actionLoading ? (
              <CircularProgress size={24} />
            ) : article?.isBlinded ? (
              '블라인드 해제'
            ) : (
              '블라인드 처리'
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 삭제 다이얼로그 */}
      <Dialog open={openDeleteDialog} onClose={handleCloseDeleteDialog}>
        <DialogTitle>게시글 삭제</DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            이 게시글을 삭제하시겠습니까?
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
            onClick={handleDeleteArticle}
            color="error"
            disabled={actionLoading}
          >
            {actionLoading ? <CircularProgress size={24} /> : '삭제'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 댓글 블라인드 다이얼로그 */}
      <Dialog open={openCommentBlindDialog} onClose={handleCloseCommentBlindDialog}>
        <DialogTitle>
          {selectedComment?.isBlinded ? '댓글 블라인드 해제' : '댓글 블라인드 처리'}
        </DialogTitle>
        <DialogContent>
          {selectedComment?.isBlinded ? (
            <Typography variant="body1">
              이 댓글의 블라인드를 해제하시겠습니까?
            </Typography>
          ) : (
            <>
              <Typography variant="body1" sx={{ mb: 2 }}>
                이 댓글을 블라인드 처리하시겠습니까?
              </Typography>
              <TextField
                autoFocus
                margin="dense"
                label="블라인드 사유"
                fullWidth
                variant="outlined"
                value={commentBlindReason}
                onChange={(e) => setCommentBlindReason(e.target.value)}
              />
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCommentBlindDialog} disabled={actionLoading}>
            취소
          </Button>
          <Button
            onClick={() => handleBlindComment(!selectedComment?.isBlinded)}
            color={selectedComment?.isBlinded ? "success" : "warning"}
            disabled={actionLoading}
          >
            {actionLoading ? (
              <CircularProgress size={24} />
            ) : selectedComment?.isBlinded ? (
              '블라인드 해제'
            ) : (
              '블라인드 처리'
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 댓글 삭제 다이얼로그 */}
      <Dialog open={openCommentDeleteDialog} onClose={handleCloseCommentDeleteDialog}>
        <DialogTitle>댓글 삭제</DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            이 댓글을 삭제하시겠습니까?
          </Typography>
          <Typography variant="body2" color="error" sx={{ mt: 1 }}>
            <WarningIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
            이 작업은 되돌릴 수 없습니다.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCommentDeleteDialog} disabled={actionLoading}>
            취소
          </Button>
          <Button
            onClick={handleDeleteComment}
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
