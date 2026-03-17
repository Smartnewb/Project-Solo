'use client';

import { useState } from 'react';
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
  CircularProgress,
  TextField
} from '@mui/material';
import { useRouter } from 'next/navigation';
import type { AdminCardNewsItem } from '@/types/admin';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SendIcon from '@mui/icons-material/Send';
import {
  useCardNewsList,
  useDeleteCardNews,
  usePublishCardNews,
} from '@/app/admin/hooks';
import { useToast } from '@/shared/ui/admin/toast/toast-context';
import { useConfirm } from '@/shared/ui/admin/confirm-dialog/confirm-dialog-context';
import { safeToLocaleString } from '@/app/utils/formatters';

function CardNewsPageContent() {
  const router = useRouter();
  const toast = useToast();
  const confirmAction = useConfirm();

  const [publishDialogOpen, setPublishDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<AdminCardNewsItem | null>(null);
  const [publishPushTitle, setPublishPushTitle] = useState('');
  const [publishPushMessage, setPublishPushMessage] = useState('');

  const { data, isLoading } = useCardNewsList();
  const cardNewsList = data?.items || [];

  const deleteCardNews = useDeleteCardNews();
  const publishCardNews = usePublishCardNews();

  const handleCreate = () => {
    router.push('/admin/card-news/create');
  };

  const handleEdit = (id: string) => {
    router.push(`/admin/card-news/edit/${id}`);
  };

  const handleDeleteClick = async (id: string) => {
    const ok = await confirmAction({
      title: '카드뉴스 삭제',
      message: '이 카드뉴스를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.',
    });
    if (!ok) return;

    try {
      await deleteCardNews.mutateAsync(id);
      toast.success('카드뉴스가 삭제되었습니다.');
    } catch (err: any) {
      toast.error(err.response?.data?.message || '삭제에 실패했습니다.');
    }
  };

  const handlePublishClick = (item: AdminCardNewsItem) => {
    setSelectedItem(item);
    setPublishPushTitle(item.pushNotificationTitle || '');
    setPublishPushMessage(item.pushNotificationMessage || '');
    setPublishDialogOpen(true);
  };

  const handlePublishConfirm = async () => {
    if (!selectedItem) return;

    try {
      const result = await publishCardNews.mutateAsync({
        id: selectedItem.id,
        data: {
          ...(publishPushTitle.trim() && { pushNotificationTitle: publishPushTitle.trim() }),
          ...(publishPushMessage.trim() && { pushNotificationMessage: publishPushMessage.trim() }),
        },
      });

      setPublishDialogOpen(false);
      setSelectedItem(null);
      setPublishPushTitle('');
      setPublishPushMessage('');

      if (result.success) {
        toast.success(`푸시 알림이 ${result.sentCount}명에게 발송되었습니다.`);
      } else {
        toast.error('모든 사용자에게 발송 실패했습니다. 다시 시도해주세요.');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || '발행에 실패했습니다.';
      if (errorMessage.includes('이미 발송')) {
        toast.error('이미 발행된 카드뉴스입니다.');
      } else if (errorMessage.includes('메시지가 설정되지')) {
        toast.error('푸시 알림 메시지를 먼저 설정해주세요.');
      } else {
        toast.error(errorMessage);
      }
    }
  };

  const formatDate = (dateString: string) => {
    return safeToLocaleString(dateString, 'ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
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
                      <Chip label="발행됨" size="small" color="success" />
                    ) : (
                      <Chip label="미발행" size="small" color="default" />
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

      {/* 발행 확인 다이얼로그 */}
      {publishDialogOpen && selectedItem && (
        <Box
          sx={{
            position: 'fixed', inset: 0, zIndex: 1300,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
          onClick={() => setPublishDialogOpen(false)}
        >
          <Paper
            sx={{ p: 3, maxWidth: 480, width: '100%', mx: 2 }}
            onClick={(e) => e.stopPropagation()}
          >
            <Typography variant="h6" sx={{ mb: 2 }}>카드뉴스 발행</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              이 카드뉴스를 모든 활성 사용자에게 푸시 알림으로 발송하시겠습니까?
            </Typography>
            <Box sx={{ mb: 3, p: 2, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                <strong>제목:</strong> {selectedItem.title}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <strong>카테고리:</strong> {selectedItem.category.displayName}
              </Typography>
            </Box>
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
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 3 }}>
              <Button onClick={() => setPublishDialogOpen(false)} disabled={publishCardNews.isPending}>
                취소
              </Button>
              <Button
                onClick={handlePublishConfirm}
                color="primary"
                variant="contained"
                disabled={publishCardNews.isPending || !publishPushMessage.trim()}
              >
                {publishCardNews.isPending ? '발행 중...' : '발행'}
              </Button>
            </Box>
          </Paper>
        </Box>
      )}
    </Box>
  );
}

export default function CardNewsPageV2() {
  return <CardNewsPageContent />;
}
