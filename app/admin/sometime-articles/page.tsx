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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TablePagination,
} from '@mui/material';
import { useRouter } from 'next/navigation';
import AdminService from '@/app/services/admin';
import type {
  AdminSometimeArticleItem,
  SometimeArticleStatus,
  SometimeArticleCategory,
} from '@/types/admin';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PublishIcon from '@mui/icons-material/Publish';

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

export default function SometimeArticlesPage() {
  const router = useRouter();
  const [articles, setArticles] = useState<AdminSometimeArticleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  // Filters
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);

  useEffect(() => {
    fetchArticles();
  }, [page, rowsPerPage, categoryFilter, statusFilter]);

  const fetchArticles = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await AdminService.sometimeArticles.getList({
        page: page + 1,
        limit: rowsPerPage,
        ...(categoryFilter && { category: categoryFilter }),
        ...(statusFilter && { status: statusFilter }),
      });
      setArticles(response.items || []);
      setTotalItems(response.meta?.totalItems || 0);
    } catch (err: any) {
      console.error('썸타임 이야기 목록 조회 실패:', err);
      setError(err.response?.data?.message || '목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    router.push('/admin/sometime-articles/create');
  };

  const handleEdit = (id: string) => {
    router.push(`/admin/sometime-articles/edit/${id}`);
  };

  const handleDeleteClick = (id: string) => {
    setSelectedId(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedId) return;

    try {
      setProcessing(true);
      await AdminService.sometimeArticles.delete(selectedId);
      setDeleteDialogOpen(false);
      setSelectedId(null);
      await fetchArticles();
    } catch (err: any) {
      console.error('썸타임 이야기 삭제 실패:', err);
      alert(err.response?.data?.message || '삭제에 실패했습니다.');
    } finally {
      setProcessing(false);
    }
  };

  const handlePublish = async (id: string) => {
    if (!confirm('이 아티클을 발행하시겠습니까?')) return;

    try {
      setProcessing(true);
      await AdminService.sometimeArticles.update(id, {
        status: 'published',
        publishedAt: new Date().toISOString(),
      });
      await fetchArticles();
      alert('아티클이 발행되었습니다.');
    } catch (err: any) {
      console.error('아티클 발행 실패:', err);
      alert(err.response?.data?.message || '발행에 실패했습니다.');
    } finally {
      setProcessing(false);
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

  if (loading && articles.length === 0) {
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

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

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
                          disabled={processing}
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

      {/* 삭제 확인 다이얼로그 */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>아티클 삭제</DialogTitle>
        <DialogContent>
          <DialogContentText>
            이 아티클을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
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
    </Box>
  );
}
