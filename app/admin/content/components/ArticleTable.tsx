'use client';

import { useState } from 'react';
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
import PublishIcon from '@mui/icons-material/Publish';
import type { ContentStatus } from '@/types/admin';
import {
  useSometimeArticleList,
  useDeleteSometimeArticle,
} from '@/app/admin/hooks';
import { useToast } from '@/shared/ui/admin/toast/toast-context';
import { useConfirm } from '@/shared/ui/admin/confirm-dialog/confirm-dialog-context';
import { safeToLocaleString } from '@/app/utils/formatters';
import { StatusBadge } from './StatusBadge';
import { CategoryBadge } from './CategoryBadge';
import { ContentFilters } from './ContentFilters';
import { PublishDialog } from './PublishDialog';

const NEW_CATEGORY_CODES = ['relationship', 'dating', 'psychology', 'essay', 'qna', 'event'];

function mapArticleStatusToContentStatus(s: string): ContentStatus {
  if (s === 'published') return 'published';
  if (s === 'archived') return 'archived';
  return 'draft';
}

export function ArticleTable() {
  const router = useRouter();
  const toast = useToast();
  const confirmAction = useConfirm();

  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [publishItem, setPublishItem] = useState<{ id: string; title: string } | null>(null);

  const categoryParam =
    category && category !== '__legacy__' ? category : undefined;

  const { data, isLoading } = useSometimeArticleList({
    page: page + 1,
    limit: rowsPerPage,
    ...(categoryParam ? { category: categoryParam } : {}),
    ...(status ? { status } : {}),
  });

  const deleteArticle = useDeleteSometimeArticle();
  const items = data?.items || [];

  const filtered = items.filter((it) => {
    if (search && !it.title.toLowerCase().includes(search.toLowerCase())) return false;
    if (category === '__legacy__') {
      return !NEW_CATEGORY_CODES.includes(it.category as string);
    }
    return true;
  });

  const handleEdit = (id: string) => {
    router.push(`/admin/content/article/edit/${id}`);
  };

  const handleDelete = async (id: string) => {
    const ok = await confirmAction({
      title: '아티클 삭제',
      message: '이 아티클을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.',
    });
    if (!ok) return;
    try {
      await deleteArticle.mutateAsync(id);
      toast.success('아티클이 삭제되었습니다.');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || '삭제에 실패했습니다.');
    }
  };

  const formatDate = (dateString: string | null) =>
    safeToLocaleString(dateString, 'ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });

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
              <TableCell align="center">발행일</TableCell>
              <TableCell align="center">작업</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <Typography color="text.secondary" sx={{ py: 4 }}>
                    아티클이 없습니다.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((item) => {
                const derived = mapArticleStatusToContentStatus(item.status);
                return (
                  <TableRow key={item.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {item.title}
                      </Typography>
                      {item.subtitle && (
                        <Typography variant="caption" color="text.secondary">
                          {item.subtitle}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell align="center">
                      <CategoryBadge code={item.category as string} />
                    </TableCell>
                    <TableCell align="center">
                      <StatusBadge status={derived} />
                    </TableCell>
                    <TableCell align="center">{item.viewCount}</TableCell>
                    <TableCell align="center">{formatDate(item.publishedAt)}</TableCell>
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
                            <PublishIcon fontSize="small" />
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
          count={data?.meta?.totalItems || 0}
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
        type="article"
        item={publishItem}
      />
    </Box>
  );
}
