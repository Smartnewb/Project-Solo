'use client';

import { useMemo, useState } from 'react';
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
  IconButton,
  CircularProgress,
  TablePagination,
} from '@mui/material';
import { useRouter } from 'next/navigation';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SendIcon from '@mui/icons-material/Send';
import type { AdminCardNewsItem, ContentStatus } from '@/types/admin';
import {
  useCardNewsList,
  useDeleteCardNews,
} from '@/app/admin/hooks';
import { useToast } from '@/shared/ui/admin/toast/toast-context';
import { useConfirm } from '@/shared/ui/admin/confirm-dialog/confirm-dialog-context';
import { formatDateTimeKR } from '@/app/utils/formatters';
import { getApiErrorMessage } from '@/app/utils/errors';
import { StatusBadge } from './StatusBadge';
import { CategoryBadge } from './CategoryBadge';
import { ContentFilters } from './ContentFilters';
import { PublishDialog } from './PublishDialog';
import { LEGACY_CATEGORY_SENTINEL } from '../constants';

function deriveStatus(item: AdminCardNewsItem): ContentStatus {
  return item.pushSentAt ? 'published' : 'draft';
}

export function CardSeriesTable() {
  const router = useRouter();
  const toast = useToast();
  const confirmAction = useConfirm();

  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [publishItem, setPublishItem] = useState<{ id: string; title: string } | null>(null);

  const { data, isLoading } = useCardNewsList(page + 1, rowsPerPage);
  const deleteCardNews = useDeleteCardNews();

  const items = data?.items || [];

  const filtered = useMemo(() => {
    return items.filter((it) => {
      if (search && !it.title.toLowerCase().includes(search.toLowerCase())) return false;
      if (category === LEGACY_CATEGORY_SENTINEL) {
        return false;
      }
      if (category && it.category?.code !== category) return false;
      if (status) {
        const s = deriveStatus(it);
        if (s !== status) return false;
      }
      return true;
    });
  }, [items, category, status, search]);

  const handleEdit = (id: string) => {
    router.push(`/admin/content/card-series/edit/${id}`);
  };

  const handleDelete = async (id: string) => {
    const ok = await confirmAction({
      title: '카드시리즈 삭제',
      message: '이 카드시리즈를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.',
    });
    if (!ok) return;
    try {
      await deleteCardNews.mutateAsync(id);
      toast.success('카드시리즈가 삭제되었습니다.');
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
      <ContentFilters
        category={category}
        status={status}
        search={search}
        onChange={(next) => {
          if (next.category !== undefined) setCategory(next.category);
          if (next.status !== undefined) setStatus(next.status);
          if (next.search !== undefined) setSearch(next.search);
          setPage(0);
        }}
      />

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>제목</TableCell>
              <TableCell align="center">카테고리</TableCell>
              <TableCell align="center">상태</TableCell>
              <TableCell align="center">조회수</TableCell>
              <TableCell align="center">생성일</TableCell>
              <TableCell align="center">작업</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <Typography color="text.secondary" sx={{ py: 4 }}>
                    카드시리즈가 없습니다.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((item) => {
                const derived = deriveStatus(item);
                return (
                  <TableRow key={item.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {item.title}
                      </Typography>
                      {item.description && (
                        <Typography variant="caption" color="text.secondary">
                          {item.description}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell align="center">
                      <CategoryBadge code={item.category?.code || 'unknown'} />
                    </TableCell>
                    <TableCell align="center">
                      <StatusBadge status={derived} />
                    </TableCell>
                    <TableCell align="center">{item.readCount}</TableCell>
                    <TableCell align="center">{formatDateTimeKR(item.createdAt)}</TableCell>
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
                        {derived !== 'published' && (
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
                );
              })
            )}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={data?.total || 0}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          rowsPerPageOptions={[5, 10, 25, 50]}
          labelRowsPerPage="페이지당 행 수"
        />
      </TableContainer>

      <PublishDialog
        open={!!publishItem}
        onClose={() => setPublishItem(null)}
        type="card-series"
        item={publishItem}
      />
    </Box>
  );
}
