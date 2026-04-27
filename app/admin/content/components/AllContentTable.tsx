'use client';

import { useState, useMemo } from 'react';
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
  Chip,
  IconButton,
  CircularProgress,
  Button,
} from '@mui/material';
import { useRouter } from 'next/navigation';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import type { ContentStatus } from '@/types/admin';
import {
  useCardNewsList,
  useSometimeArticleList,
  useNoticeList,
  useDeleteCardNews,
  useDeleteSometimeArticle,
  useDeleteNotice,
} from '@/app/admin/hooks';
import { useToast } from '@/shared/ui/admin/toast/toast-context';
import { useConfirm } from '@/shared/ui/admin/confirm-dialog/confirm-dialog-context';
import { formatDateTimeKR } from '@/app/utils/formatters';
import { getApiErrorMessage } from '@/app/utils/errors';
import { StatusBadge } from './StatusBadge';
import { CategoryBadge } from './CategoryBadge';
import type { ContentType } from '../constants';

type UnifiedRow = {
  id: string;
  type: ContentType;
  title: string;
  categoryCode: string;
  status: ContentStatus;
  createdAt: string;
};

function mapArticleStatusToContentStatus(s: string): ContentStatus {
  if (s === 'published') return 'published';
  if (s === 'archived') return 'archived';
  return 'draft';
}

const TYPE_LABELS: Record<UnifiedRow['type'], string> = {
  'card-series': '카드시리즈',
  longform: '롱폼',
  article: '아티클',
  notice: '공지',
};

const TYPE_COLORS: Record<UnifiedRow['type'], 'primary' | 'secondary' | 'info' | 'error'> = {
  'card-series': 'primary',
  longform: 'secondary',
  article: 'info',
  notice: 'error',
};

const PAGE_INCREMENT = 20;

export function AllContentTable() {
  const router = useRouter();
  const toast = useToast();
  const confirmAction = useConfirm();

  const [pageSize, setPageSize] = useState(PAGE_INCREMENT);

  const { data: cardsData, isLoading: cardsLoading } = useCardNewsList(1, pageSize);
  const { data: articlesData, isLoading: articlesLoading } = useSometimeArticleList({
    page: 1,
    limit: pageSize,
  });
  const { data: noticesData, isLoading: noticesLoading } = useNoticeList({
    page: 1,
    limit: pageSize,
  });

  const deleteCardNews = useDeleteCardNews();
  const deleteArticle = useDeleteSometimeArticle();
  const deleteNotice = useDeleteNotice();

  const merged: UnifiedRow[] = useMemo(() => {
    const rows: UnifiedRow[] = [];
    (cardsData?.items || []).forEach((c) => {
      const cardType: ContentType = c.layoutMode === 'longform' ? 'longform' : 'card-series';
      rows.push({
        id: c.id,
        type: cardType,
        title: c.title,
        categoryCode: c.category?.code || 'unknown',
        status: c.publishedAt ? 'published' : 'draft',
        createdAt: c.createdAt,
      });
    });
    (articlesData?.items || []).forEach((a) => {
      rows.push({
        id: a.id,
        type: 'article',
        title: a.title,
        categoryCode: a.category as string,
        status: mapArticleStatusToContentStatus(a.status),
        createdAt: a.publishedAt || '',
      });
    });
    (noticesData?.items || []).forEach((n) => {
      rows.push({
        id: n.id,
        type: 'notice',
        title: n.title,
        categoryCode: n.categoryCode,
        status: n.status,
        createdAt: n.createdAt,
      });
    });
    return rows.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  }, [cardsData, articlesData, noticesData]);

  const isLoading = cardsLoading || articlesLoading || noticesLoading;

  const visible = merged.slice(0, pageSize);
  const hasMore =
    (cardsData?.total ?? 0) > pageSize ||
    (articlesData?.meta?.totalItems ?? 0) > pageSize ||
    (noticesData?.meta?.totalItems ?? 0) > pageSize ||
    merged.length > pageSize;

  const handleEdit = (row: UnifiedRow) => {
    router.push(`/admin/content/${row.type}/edit/${row.id}`);
  };

  const handleDelete = async (row: UnifiedRow) => {
    const ok = await confirmAction({
      title: `${TYPE_LABELS[row.type]} 삭제`,
      message: '이 콘텐츠를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.',
    });
    if (!ok) return;
    try {
      if (row.type === 'card-series' || row.type === 'longform')
        await deleteCardNews.mutateAsync(row.id);
      else if (row.type === 'article') await deleteArticle.mutateAsync(row.id);
      else await deleteNotice.mutateAsync(row.id);
      toast.success('삭제되었습니다.');
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, '삭제에 실패했습니다.'));
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell align="center">타입</TableCell>
              <TableCell>제목</TableCell>
              <TableCell align="center">카테고리</TableCell>
              <TableCell align="center">상태</TableCell>
              <TableCell align="center">생성일</TableCell>
              <TableCell align="center">작업</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {visible.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <Typography color="text.secondary" sx={{ py: 4 }}>
                    콘텐츠가 없습니다.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              visible.map((row) => (
                <TableRow key={`${row.type}-${row.id}`} hover>
                  <TableCell align="center">
                    <Chip
                      label={TYPE_LABELS[row.type]}
                      size="small"
                      color={TYPE_COLORS[row.type]}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      {row.title}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <CategoryBadge code={row.categoryCode} />
                  </TableCell>
                  <TableCell align="center">
                    <StatusBadge status={row.status} />
                  </TableCell>
                  <TableCell align="center">
                    {row.createdAt ? formatDateTimeKR(row.createdAt) : '-'}
                  </TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => handleEdit(row)}
                        title="수정"
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDelete(row)}
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

      {hasMore && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
          <Button
            size="small"
            variant="outlined"
            onClick={() => setPageSize((p) => p + PAGE_INCREMENT)}
          >
            더 보기 (+{PAGE_INCREMENT})
          </Button>
        </Box>
      )}
    </Box>
  );
}
