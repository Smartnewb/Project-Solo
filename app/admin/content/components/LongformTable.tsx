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
import { useLongformList, useDeleteCardNews, useUrlState } from '@/app/admin/hooks';
import {
  CONTENT_URL_KEYS,
  useDebouncedUrlSearch,
} from '@/app/admin/hooks/use-url-state';
import { useToast } from '@/shared/ui/admin/toast/toast-context';
import { useConfirm } from '@/shared/ui/admin/confirm-dialog/confirm-dialog-context';
import { formatDateTimeKR } from '@/app/utils/formatters';
import { getApiErrorMessage } from '@/app/utils/errors';
import { StatusBadge } from './StatusBadge';
import { CategoryBadge } from './CategoryBadge';
import { ContentFilters } from './ContentFilters';
import { PublishDialog } from './PublishDialog';
import { ExternalPageButton } from './seo/ExternalPageButton';
import { LEGACY_CATEGORY_SENTINEL } from '../constants';

function deriveStatus(item: AdminCardNewsItem): ContentStatus {
  return item.publishedAt ? 'published' : 'draft';
}

export function LongformTable() {
  const router = useRouter();
  const toast = useToast();
  const confirmAction = useConfirm();

  const { get, getNumber, setMany } = useUrlState();
  const category = get(CONTENT_URL_KEYS.category);
  const status = get(CONTENT_URL_KEYS.status);
  const search = get(CONTENT_URL_KEYS.search);
  const page = getNumber(CONTENT_URL_KEYS.page, 0);
  const rowsPerPage = getNumber(CONTENT_URL_KEYS.rowsPerPage, 10);

  const [searchInput, setSearchInput] = useDebouncedUrlSearch(search, setMany);

  const [publishItem, setPublishItem] = useState<{ id: string; title: string } | null>(null);

  const categoryParam =
    category && category !== LEGACY_CATEGORY_SENTINEL ? category : undefined;

  const { data, isLoading } = useLongformList({
    page: page + 1,
    limit: rowsPerPage,
    ...(categoryParam ? { categoryCode: categoryParam } : {}),
  });
  const deleteCardNews = useDeleteCardNews();

  const items = data?.items || [];

  const filtered = useMemo(() => {
    if (category === LEGACY_CATEGORY_SENTINEL) return [];
    return items.filter((it) => {
      if (search && !it.title.toLowerCase().includes(search.toLowerCase())) return false;
      if (status) {
        const s = deriveStatus(it);
        if (s !== status) return false;
      }
      return true;
    });
  }, [items, category, status, search]);

  const handleEdit = (id: string) => {
    router.push(`/admin/content/longform/edit/${id}`);
  };

  const handleDelete = async (id: string) => {
    const ok = await confirmAction({
      title: '롱폼 아티클 삭제',
      message: '이 롱폼 아티클을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.',
    });
    if (!ok) return;
    try {
      await deleteCardNews.mutateAsync(id);
      toast.success('롱폼 아티클이 삭제되었습니다.');
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
        search={searchInput}
        onChange={(next) => {
          if (next.search !== undefined) {
            setSearchInput(next.search);
            return;
          }
          const update: Record<string, string | null> = {
            [CONTENT_URL_KEYS.page]: '0',
          };
          if (next.category !== undefined)
            update[CONTENT_URL_KEYS.category] = next.category || null;
          if (next.status !== undefined)
            update[CONTENT_URL_KEYS.status] = next.status || null;
          setMany(update);
        }}
      />

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>제목</TableCell>
              <TableCell align="center">카테고리</TableCell>
              <TableCell align="center">발행일</TableCell>
              <TableCell align="center">읽기시간</TableCell>
              <TableCell align="center">조회수</TableCell>
              <TableCell align="center">상태</TableCell>
              <TableCell align="center">작업</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <Typography color="text.secondary" sx={{ py: 4 }}>
                    롱폼 아티클이 없습니다.
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
                      {item.publishedAt ? formatDateTimeKR(item.publishedAt) : '-'}
                    </TableCell>
                    <TableCell align="center">
                      {item.readTimeMinutes ? `${item.readTimeMinutes}분` : '-'}
                    </TableCell>
                    <TableCell align="center">{item.readCount}</TableCell>
                    <TableCell align="center">
                      <StatusBadge status={derived} />
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
                        {derived === 'published' && (
                          <ExternalPageButton kind="card-news" slugOrId={item.id} />
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
          onPageChange={(_, newPage) => setMany({ p: newPage })}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) =>
            setMany({ rpp: parseInt(e.target.value, 10), p: 0 })
          }
          rowsPerPageOptions={[5, 10, 25, 50]}
          labelRowsPerPage="페이지당 행 수"
        />
      </TableContainer>

      <PublishDialog
        open={!!publishItem}
        onClose={() => setPublishItem(null)}
        type="longform"
        item={publishItem}
      />
    </Box>
  );
}
