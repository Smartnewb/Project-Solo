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
import { safeToLocaleString } from '@/app/utils/formatters';
import { StatusBadge } from './StatusBadge';
import { CategoryBadge } from './CategoryBadge';

type UnifiedRow = {
  id: string;
  type: 'card-series' | 'article' | 'notice';
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
  article: '아티클',
  notice: '공지',
};

const TYPE_COLORS: Record<UnifiedRow['type'], 'primary' | 'info' | 'error'> = {
  'card-series': 'primary',
  article: 'info',
  notice: 'error',
};

export function AllContentTable() {
  const router = useRouter();
  const toast = useToast();
  const confirmAction = useConfirm();

  const [cardsPage, setCardsPage] = useState(1);
  const [articlesPage, setArticlesPage] = useState(1);
  const [noticesPage, setNoticesPage] = useState(1);
  const LIMIT = 20;

  const { data: cardsData, isLoading: cardsLoading } = useCardNewsList(cardsPage, LIMIT);
  const { data: articlesData, isLoading: articlesLoading } = useSometimeArticleList({
    page: articlesPage,
    limit: LIMIT,
  });
  const { data: noticesData, isLoading: noticesLoading } = useNoticeList({
    page: noticesPage,
    limit: LIMIT,
  });

  const deleteCardNews = useDeleteCardNews();
  const deleteArticle = useDeleteSometimeArticle();
  const deleteNotice = useDeleteNotice();

  const merged: UnifiedRow[] = useMemo(() => {
    const rows: UnifiedRow[] = [];
    (cardsData?.items || []).forEach((c) => {
      rows.push({
        id: c.id,
        type: 'card-series',
        title: c.title,
        categoryCode: c.category?.code || 'unknown',
        status: c.pushSentAt ? 'published' : 'draft',
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

  const isLoading = cardsLoading && articlesLoading && noticesLoading;

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
      if (row.type === 'card-series') await deleteCardNews.mutateAsync(row.id);
      else if (row.type === 'article') await deleteArticle.mutateAsync(row.id);
      else await deleteNotice.mutateAsync(row.id);
      toast.success('삭제되었습니다.');
    } catch (err: unknown) {
      const error = err as { message?: string };
      toast.error(error.message || '삭제에 실패했습니다.');
    }
  };

  const formatDate = (dateString: string) =>
    safeToLocaleString(dateString, 'ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  const hasMoreCards = (cardsData?.total ?? 0) > cardsPage * LIMIT;
  const hasMoreArticles = (articlesData?.meta?.totalItems ?? 0) > articlesPage * LIMIT;
  const hasMoreNotices = (noticesData?.meta?.totalItems ?? 0) > noticesPage * LIMIT;

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
            {merged.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <Typography color="text.secondary" sx={{ py: 4 }}>
                    콘텐츠가 없습니다.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              merged.map((row) => (
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
                    {row.createdAt ? formatDate(row.createdAt) : '-'}
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

      {(hasMoreCards || hasMoreArticles || hasMoreNotices) && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2, gap: 1 }}>
          {hasMoreCards && (
            <Button size="small" variant="outlined" onClick={() => setCardsPage((p) => p + 1)}>
              카드시리즈 더 보기
            </Button>
          )}
          {hasMoreArticles && (
            <Button
              size="small"
              variant="outlined"
              onClick={() => setArticlesPage((p) => p + 1)}
            >
              아티클 더 보기
            </Button>
          )}
          {hasMoreNotices && (
            <Button
              size="small"
              variant="outlined"
              onClick={() => setNoticesPage((p) => p + 1)}
            >
              공지 더 보기
            </Button>
          )}
        </Box>
      )}
    </Box>
  );
}
