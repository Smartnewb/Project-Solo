'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  CircularProgress,
  Alert,
  TextField
} from '@mui/material';
import { useRouter } from 'next/navigation';
import AdminService from '@/app/services/admin';
import type { AdminCardNewsItem } from '@/types/admin';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SendIcon from '@mui/icons-material/Send';
import VisibilityIcon from '@mui/icons-material/Visibility';

export default function CardNewsPage() {
  const router = useRouter();
  const [cardNewsList, setCardNewsList] = useState<AdminCardNewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [publishDialogOpen, setPublishDialogOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<AdminCardNewsItem | null>(null);
  const [processing, setProcessing] = useState(false);
  const [publishPushTitle, setPublishPushTitle] = useState('');
  const [publishPushMessage, setPublishPushMessage] = useState('');

  useEffect(() => {
    fetchCardNewsList();
  }, []);

  const fetchCardNewsList = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await AdminService.cardNews.getList();
      setCardNewsList(response.items || []);
    } catch (err: any) {
      console.error('카드뉴스 목록 조회 실패:', err);
      setError(err.response?.data?.message || '카드뉴스 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    router.push('/admin/card-news/create');
  };

  const handleEdit = (id: string) => {
    router.push(`/admin/card-news/edit/${id}`);
  };

  const handleDeleteClick = (id: string) => {
    setSelectedId(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedId) return;

    try {
      setProcessing(true);
      await AdminService.cardNews.delete(selectedId);
      setDeleteDialogOpen(false);
      setSelectedId(null);
      await fetchCardNewsList();
    } catch (err: any) {
      console.error('카드뉴스 삭제 실패:', err);
      alert(err.response?.data?.message || '삭제에 실패했습니다.');
    } finally {
      setProcessing(false);
    }
  };

  const handlePublishClick = (item: AdminCardNewsItem) => {
    setSelectedItem(item);
    setSelectedId(item.id);
    setPublishPushTitle(item.pushNotificationTitle || '');
    setPublishPushMessage(item.pushNotificationMessage || '');
    setPublishDialogOpen(true);
  };

  const handlePublishConfirm = async () => {
    if (!selectedId) return;

    try {
      setProcessing(true);
      const result = await AdminService.cardNews.publish(selectedId, {
        ...(publishPushTitle.trim() && { pushNotificationTitle: publishPushTitle.trim() }),
        ...(publishPushMessage.trim() && { pushNotificationMessage: publishPushMessage.trim() })
      });

      setPublishDialogOpen(false);
      setSelectedId(null);
      setSelectedItem(null);
      setPublishPushTitle('');
      setPublishPushMessage('');

      if (result.success) {
        alert(`푸시 알림이 ${result.sentCount}명에게 발송되었습니다.`);
        await fetchCardNewsList();
      } else {
        alert('모든 사용자에게 발송 실패했습니다. 다시 시도해주세요.');
      }
    } catch (err: any) {
      console.error('카드뉴스 발행 실패:', err);
      const errorMessage = err.response?.data?.message || '발행에 실패했습니다.';

      if (errorMessage.includes('이미 발송')) {
        alert('이미 발행된 카드뉴스입니다.');
      } else if (errorMessage.includes('메시지가 설정되지')) {
        alert('푸시 알림 메시지를 먼저 설정해주세요.');
      } else {
        alert(errorMessage);
      }
    } finally {
      setProcessing(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>카드뉴스 목록을 불러오는 중...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight="bold">
          카드뉴스 관리
        </Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={handleCreate}
        >
          새 카드뉴스 작성
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>제목</TableCell>
              <TableCell align="center">카테고리</TableCell>
              <TableCell align="center">발행 상태</TableCell>
              <TableCell align="center">조회수</TableCell>
              <TableCell align="center">생성일</TableCell>
              <TableCell align="center">작업</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {cardNewsList.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <Typography color="text.secondary" sx={{ py: 4 }}>
                    작성된 카드뉴스가 없습니다.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              cardNewsList.map((item) => (
                <TableRow key={item.id} hover>
                  <TableCell>{item.title}</TableCell>
                  <TableCell align="center">
                    <Chip
                      label={item.category.displayName}
                      size="small"
                      color="default"
                    />
                  </TableCell>
                  <TableCell align="center">
                    {item.pushSentAt ? (
                      <Chip
                        label="발행됨"
                        size="small"
                        color="success"
                      />
                    ) : (
                      <Chip
                        label="미발행"
                        size="small"
                        color="default"
                      />
                    )}
                  </TableCell>
                  <TableCell align="center">{item.readCount}</TableCell>
                  <TableCell align="center">{formatDate(item.createdAt)}</TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => handleEdit(item.id)}
                        title="수정"
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      {!item.pushSentAt && (
                        <IconButton
                          size="small"
                          color="success"
                          onClick={() => handlePublishClick(item)}
                          title="발행"
                        >
                          <SendIcon fontSize="small" />
                        </IconButton>
                      )}
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDeleteClick(item.id)}
                        title="삭제"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* 삭제 확인 다이얼로그 */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>카드뉴스 삭제</DialogTitle>
        <DialogContent>
          <DialogContentText>
            이 카드뉴스를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} disabled={processing}>
            취소
          </Button>
          <Button onClick={handleDeleteConfirm} color="error" disabled={processing}>
            {processing ? '삭제 중...' : '삭제'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 발행 확인 다이얼로그 */}
      <Dialog open={publishDialogOpen} onClose={() => setPublishDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>카드뉴스 발행</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            이 카드뉴스를 모든 활성 사용자에게 푸시 알림으로 발송하시겠습니까?
          </DialogContentText>
          {selectedItem && (
            <Box sx={{ mb: 3, p: 2, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                <strong>제목:</strong> {selectedItem.title}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <strong>카테고리:</strong> {selectedItem.category.displayName}
              </Typography>
            </Box>
          )}

          <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 2 }}>
            푸시 알림 설정
          </Typography>

          <TextField
            fullWidth
            label="푸시 알림 제목 (선택 사항)"
            value={publishPushTitle}
            onChange={(e) => setPublishPushTitle(e.target.value)}
            placeholder="예: 썸타임 새소식 🎉 (비워두면 카드뉴스 제목 사용)"
            inputProps={{ maxLength: 50 }}
            helperText={`${publishPushTitle.length}/50자 | 비워두면 카드뉴스 제목이 사용됩니다.`}
            sx={{ mb: 2 }}
          />

          <TextField
            fullWidth
            label="푸시 알림 메시지"
            value={publishPushMessage}
            onChange={(e) => setPublishPushMessage(e.target.value)}
            placeholder="푸시 알림 메시지를 입력하세요"
            inputProps={{ maxLength: 100 }}
            helperText={`${publishPushMessage.length}/100자 | 필수 항목입니다.`}
            multiline
            rows={2}
            error={!publishPushMessage.trim()}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPublishDialogOpen(false)} disabled={processing}>
            취소
          </Button>
          <Button
            onClick={handlePublishConfirm}
            color="primary"
            disabled={processing || !publishPushMessage.trim()}
          >
            {processing ? '발행 중...' : '발행'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
