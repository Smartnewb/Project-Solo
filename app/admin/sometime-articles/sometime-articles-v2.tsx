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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TablePagination,
} from '@mui/material';
import { useRouter } from 'next/navigation';
import type {
  SometimeArticleStatus,
  SometimeArticleCategory,
} from '@/types/admin';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PublishIcon from '@mui/icons-material/Publish';
import {
  useSometimeArticleList,
  useDeleteSometimeArticle,
  useUpdateSometimeArticle,
} from '@/app/admin/hooks';
import { useToast } from '@/shared/ui/admin/toast/toast-context';
import { useConfirm } from '@/shared/ui/admin/confirm-dialog/confirm-dialog-context';

const STATUS_LABELS: Record<SometimeArticleStatus, string> = {
  draft: '초안',
  scheduled: '예약됨',
  published: '발행됨',
  archived: '보관됨',
};

const STATUS_COLORS: Record<SometimeArticleStatus, 'default' | 'warning' | 'success' | 'secondary'> = {
  draft: 'default',
  scheduled: 'warning',
  published: 'success',
  archived: 'secondary',
};

const CATEGORY_LABELS: Record<SometimeArticleCategory, string> = {
  story: '스토리',
  interview: '인터뷰',
  tips: '팁',
  team: '팀 소개',
  update: '업데이트',
  safety: '안전 가이드',
};

function SometimeArticlesPageContent() {
  const router = useRouter();
  const toast = useToast();
  const confirmAction = useConfirm();

  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const { data, isLoading } = useSometimeArticleList({
    page: page + 1,
    limit: rowsPerPage,
    ...(categoryFilter && { category: categoryFilter }),
    ...(statusFilter && { status: statusFilter }),
  });

  const articles = data?.items || [];
  const totalItems = data?.meta?.totalItems || 0;

  const deleteArticle = useDeleteSometimeArticle();
  const updateArticle = useUpdateSometimeArticle();

  const handleCreate = () => {
    router.push('/admin/sometime-articles/create');
  };

  const handleEdit = (id: string) => {
    router.push(`/admin/sometime-articles/edit/${id}`);
  };

  const handleDeleteClick = async (id: string) => {
    const ok = await confirmAction({
      title: '아티클 삭제',
      message: '이 아티클을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.',
    });
    if (!ok) return;

    try {
      await deleteArticle.mutateAsync(id);
      toast.success('아티클이 삭제되었습니다.');
    } catch (err: any) {
      toast.error(err.response?.data?.message || '삭제에 실패했습니다.');
    }
  };

  const handlePublish = async (id: string) => {
    const ok = await confirmAction({
      title: '아티클 발행',
      message: '이 아티클을 발행하시겠습니까?',
    });
    if (!ok) return;

    try {
      await updateArticle.mutateAsync({
        id,
        data: {
          status: 'published',
          publishedAt: new Date().toISOString(),
        },
      });
      toast.success('아티클이 발행되었습니다.');
    } catch (err: any) {
      toast.error(err.response?.data?.message || '발행에 실패했습니다.');
    }
  };

  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading && articles.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>목록을 불러오는 중...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight="bold">
          썸타임 이야기 관리
        </Typography>
        <Button variant="contained" color="primary" onClick={handleCreate}>
          새 아티클 작성
        </Button>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>카테고리</InputLabel>
            <Select
              value={categoryFilter}
              label="카테고리"
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setPage(0);
              }}
            >
              <MenuItem value="">전체</MenuItem>
              {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                <MenuItem key={value} value={value}>
                  {label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>상태</InputLabel>
            <Select
              value={statusFilter}
              label="상태"
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(0);
              }}
            >
              <MenuItem value="">전체</MenuItem>
              {Object.entries(STATUS_LABELS).map(([value, label]) => (
                <MenuItem key={value} value={value}>
                  {label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </Paper>

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
            {articles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <Typography color="text.secondary" sx={{ py: 4 }}>
                    작성된 아티클이 없습니다.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              articles.map((item) => (
                <TableRow key={item.id} hover>
                  <TableCell>
                    <Box>
                      <Typography variant="body2" fontWeight="medium">
                        {item.title}
                      </Typography>
                      {item.subtitle && (
                        <Typography variant="caption" color="text.secondary">
                          {item.subtitle}
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={CATEGORY_LABELS[item.category] || item.category}
                      size="small"
                      color="default"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={STATUS_LABELS[item.status] || item.status}
                      size="small"
                      color={STATUS_COLORS[item.status] || 'default'}
                    />
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
                      {item.status !== 'published' && (
                        <IconButton
                          size="small"
                          color="success"
                          onClick={() => handlePublish(item.id)}
                          title="발행"
                          disabled={updateArticle.isPending}
                        >
                          <PublishIcon fontSize="small" />
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
        <TablePagination
          component="div"
          count={totalItems}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[5, 10, 25, 50]}
          labelRowsPerPage="페이지당 행 수"
        />
      </TableContainer>
    </Box>
  );
}

export default function SometimeArticlesPageV2() {
  return <SometimeArticlesPageContent />;
}
