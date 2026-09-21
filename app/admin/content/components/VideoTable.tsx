'use client';

import { useState } from 'react';
import {
  Box,
  Button,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  CircularProgress,
  TablePagination,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { useRouter } from 'next/navigation';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SendIcon from '@mui/icons-material/Send';
import PlaylistAddIcon from '@mui/icons-material/PlaylistAdd';
import type { VideoStatus } from '@/types/admin';
import { useVideoAdminList, useDeleteVideo, useUrlState } from '@/app/admin/hooks';
import { CONTENT_URL_KEYS } from '@/app/admin/hooks/use-url-state';
import { useToast } from '@/shared/ui/admin/toast/toast-context';
import { useConfirm } from '@/shared/ui/admin/confirm-dialog/confirm-dialog-context';
import { formatDateTimeKR } from '@/app/utils/formatters';
import { getApiErrorMessage } from '@/app/utils/errors';
import { StatusBadge } from './StatusBadge';
import { PublishDialog } from './PublishDialog';
import { BulkVideoImportDialog } from './BulkVideoImportDialog';

export function VideoTable() {
  const router = useRouter();
  const toast = useToast();
  const confirmAction = useConfirm();

  const { get, getNumber, setMany } = useUrlState();
  const status = get(CONTENT_URL_KEYS.status);
  const page = getNumber(CONTENT_URL_KEYS.page, 0);
  const rowsPerPage = getNumber(CONTENT_URL_KEYS.rowsPerPage, 10);

  const [publishItem, setPublishItem] = useState<{ id: string; title: string } | null>(null);
  const [bulkImportOpen, setBulkImportOpen] = useState(false);

  const { data, isLoading } = useVideoAdminList({
    page: page + 1,
    limit: rowsPerPage,
    ...(status ? { status: status as VideoStatus } : {}),
  });
  const deleteVideo = useDeleteVideo();

  const items = data?.items || [];

  const handleEdit = (id: string) => {
    router.push(`/admin/content/video/edit/${id}`);
  };

  const handleDelete = async (id: string) => {
    const ok = await confirmAction({
      title: '영상 삭제',
      message: '이 영상을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.',
    });
    if (!ok) return;
    try {
      await deleteVideo.mutateAsync(id);
      toast.success('영상이 삭제되었습니다.');
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, '삭제에 실패했습니다.'));
    }
  };

  if (isLoading && items.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 2, display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel id="video-filter-status">상태</InputLabel>
          <Select
            labelId="video-filter-status"
            label="상태"
            value={status}
            onChange={(e) =>
              setMany({
                [CONTENT_URL_KEYS.status]: String(e.target.value) || null,
                [CONTENT_URL_KEYS.page]: '0',
              })
            }
          >
            <MenuItem value="">전체</MenuItem>
            <MenuItem value="draft">초안</MenuItem>
            <MenuItem value="published">게시중</MenuItem>
          </Select>
        </FormControl>
        <Box sx={{ flex: 1 }} />
        <Button
          variant="outlined"
          size="small"
          startIcon={<PlaylistAddIcon />}
          onClick={() => setBulkImportOpen(true)}
        >
          일괄 추가
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>영상</TableCell>
              <TableCell align="center">채널</TableCell>
              <TableCell align="center">상태</TableCell>
              <TableCell align="center">발행일</TableCell>
              <TableCell align="center">조회/좋아요</TableCell>
              <TableCell align="center">작업</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <Typography color="text.secondary" sx={{ py: 4 }}>
                    등록된 영상이 없습니다.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              items.map((item) => (
                <TableRow key={item.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.video.thumbnailUrl}
                        alt={item.title}
                        width={40}
                        height={56}
                        style={{ borderRadius: 4, objectFit: 'cover', flexShrink: 0 }}
                      />
                      <Box sx={{ minWidth: 0 }}>
                        <Typography variant="body2" fontWeight="medium" noWrap>
                          {item.title}
                        </Typography>
                        {item.displayTitle && (
                          <Typography variant="caption" color="text.secondary" noWrap display="block">
                            노출명: {item.displayTitle}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell align="center">{item.video.channelTitle || '-'}</TableCell>
                  <TableCell align="center">
                    <StatusBadge status={item.status} />
                  </TableCell>
                  <TableCell align="center">
                    {item.publishedAt ? formatDateTimeKR(item.publishedAt) : '-'}
                  </TableCell>
                  <TableCell align="center">
                    {item.readCount} / {item.likeCount}
                  </TableCell>
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
                      {item.status !== 'published' && (
                        <IconButton
                          size="small"
                          color="success"
                          onClick={() => setPublishItem({ id: item.id, title: item.title })}
                          title="발행"
                        >
                          <SendIcon fontSize="small" />
                        </IconButton>
                      )}
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDelete(item.id)}
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
        <TablePagination
          component="div"
          count={data?.total || 0}
          page={page}
          onPageChange={(_, newPage) => setMany({ p: newPage })}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => setMany({ rpp: parseInt(e.target.value, 10), p: 0 })}
          rowsPerPageOptions={[5, 10, 25, 50]}
          labelRowsPerPage="페이지당 행 수"
        />
      </TableContainer>

      <PublishDialog
        open={!!publishItem}
        onClose={() => setPublishItem(null)}
        type="video"
        item={publishItem}
      />

      <BulkVideoImportDialog
        open={bulkImportOpen}
        onClose={() => setBulkImportOpen(false)}
      />
    </Box>
  );
}
