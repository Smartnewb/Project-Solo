'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  CircularProgress,
  Alert,
  Pagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Checkbox,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import TranslateIcon from '@mui/icons-material/Translate';
import VisibilityIcon from '@mui/icons-material/Visibility';
import AdminService from '@/app/services/admin';
import type {
  Big5Dimension,
  QuestionListItem,
  QuestionListPagination,
  QuestionDetail,
} from '@/types/moment';
import QuestionDetailDialog from './QuestionDetailDialog';
import QuestionEditDialog from './QuestionEditDialog';

const DIMENSION_LABELS: Record<Big5Dimension, string> = {
  openness: '개방성',
  conscientiousness: '성실성',
  extraversion: '외향성',
  agreeableness: '우호성',
  neuroticism: '신경성',
};

const DIMENSION_COLORS: Record<Big5Dimension, 'primary' | 'secondary' | 'success' | 'warning' | 'error'> = {
  openness: 'primary',
  conscientiousness: 'secondary',
  extraversion: 'success',
  agreeableness: 'warning',
  neuroticism: 'error',
};

export default function QuestionListTab() {
  const [questions, setQuestions] = useState<QuestionListItem[]>([]);
  const [pagination, setPagination] = useState<QuestionListPagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchText, setSearchText] = useState('');
  const [dimensionFilter, setDimensionFilter] = useState<Big5Dimension | ''>('');
  const [translationFilter, setTranslationFilter] = useState<'kr_only' | 'kr_jp' | 'all' | ''>('');
  const [page, setPage] = useState(1);
  const [limit] = useState(15);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<QuestionDetail | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  const fetchQuestions = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await AdminService.momentQuestions.getList({
        search: searchText || undefined,
        dimension: dimensionFilter || undefined,
        translationStatus: translationFilter || undefined,
        page,
        limit,
        isActive: true,
      });

      setQuestions(response.questions);
      setPagination(response.pagination);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || '질문 목록 조회에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, [searchText, dimensionFilter, translationFilter, page, limit]);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  const handleSearch = () => {
    setPage(1);
    fetchQuestions();
  };

  const handlePageChange = (_: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };

  const handleViewDetail = async (id: string) => {
    try {
      const detail = await AdminService.momentQuestions.getDetail(id);
      setSelectedQuestion(detail);
      setDetailDialogOpen(true);
    } catch (err: any) {
      setError(err.response?.data?.message || '상세 조회에 실패했습니다.');
    }
  };

  const handleEdit = async (id: string) => {
    try {
      const detail = await AdminService.momentQuestions.getDetail(id);
      setSelectedQuestion(detail);
      setEditDialogOpen(true);
    } catch (err: any) {
      setError(err.response?.data?.message || '질문 조회에 실패했습니다.');
    }
  };

  const handleDeleteClick = (id: string) => {
    setDeleteTargetId(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTargetId) return;

    setProcessing(true);
    try {
      await AdminService.momentQuestions.delete(deleteTargetId);
      setDeleteDialogOpen(false);
      setDeleteTargetId(null);
      fetchQuestions();
    } catch (err: any) {
      setError(err.response?.data?.message || '삭제에 실패했습니다.');
    } finally {
      setProcessing(false);
    }
  };

  const handleEditSave = async (id: string, data: { text?: string; options?: { text: string; order: number }[] }) => {
    setProcessing(true);
    try {
      await AdminService.momentQuestions.update(id, data);
      setEditDialogOpen(false);
      setSelectedQuestion(null);
      fetchQuestions();
    } catch (err: any) {
      setError(err.response?.data?.message || '수정에 실패했습니다.');
    } finally {
      setProcessing(false);
    }
  };

  const handleToggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedIds.size === questions.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(questions.map(q => q.id)));
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  return (
    <Box>
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <TextField
            label="검색"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="질문 텍스트 검색"
            size="small"
            sx={{ minWidth: 200 }}
          />

          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>차원</InputLabel>
            <Select
              value={dimensionFilter}
              label="차원"
              onChange={(e) => {
                setDimensionFilter(e.target.value as Big5Dimension | '');
                setPage(1);
              }}
            >
              <MenuItem value="">전체</MenuItem>
              <MenuItem value="openness">개방성</MenuItem>
              <MenuItem value="conscientiousness">성실성</MenuItem>
              <MenuItem value="extraversion">외향성</MenuItem>
              <MenuItem value="agreeableness">우호성</MenuItem>
              <MenuItem value="neuroticism">신경성</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>번역 상태</InputLabel>
            <Select
              value={translationFilter}
              label="번역 상태"
              onChange={(e) => {
                setTranslationFilter(e.target.value as 'kr_only' | 'kr_jp' | 'all' | '');
                setPage(1);
              }}
            >
              <MenuItem value="">전체</MenuItem>
              <MenuItem value="kr_only">KR만</MenuItem>
              <MenuItem value="kr_jp">KR+JP</MenuItem>
            </Select>
          </FormControl>

          <Button
            variant="contained"
            onClick={handleSearch}
            startIcon={<SearchIcon />}
          >
            검색
          </Button>
        </Box>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={questions.length > 0 && selectedIds.size === questions.length}
                      indeterminate={selectedIds.size > 0 && selectedIds.size < questions.length}
                      onChange={handleSelectAll}
                    />
                  </TableCell>
                  <TableCell>질문</TableCell>
                  <TableCell align="center" width={100}>차원</TableCell>
                  <TableCell align="center" width={80}>옵션</TableCell>
                  <TableCell align="center" width={100}>번역</TableCell>
                  <TableCell align="center" width={100}>생성일</TableCell>
                  <TableCell align="center" width={120}>작업</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {questions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <Typography color="text.secondary" sx={{ py: 4 }}>
                        질문이 없습니다.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  questions.map((question) => (
                    <TableRow key={question.id} hover>
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={selectedIds.has(question.id)}
                          onChange={() => handleToggleSelect(question.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography
                          variant="body2"
                          sx={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                          }}
                        >
                          {question.text}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={DIMENSION_LABELS[question.dimension]}
                          size="small"
                          color={DIMENSION_COLORS[question.dimension]}
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell align="center">{question.optionCount}개</TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                          {question.translationStatus.kr && (
                            <Chip label="KR" size="small" color="primary" />
                          )}
                          {question.translationStatus.jp && (
                            <Chip label="JP" size="small" color="secondary" />
                          )}
                        </Box>
                      </TableCell>
                      <TableCell align="center">{formatDate(question.createdAt)}</TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                          <IconButton
                            size="small"
                            onClick={() => handleViewDetail(question.id)}
                            title="상세 보기"
                          >
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleEdit(question.id)}
                            title="수정"
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteClick(question.id)}
                            title="삭제"
                            color="error"
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

          {pagination && pagination.totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
              <Pagination
                count={pagination.totalPages}
                page={page}
                onChange={handlePageChange}
                color="primary"
              />
            </Box>
          )}

          {pagination && (
            <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 1 }}>
              전체 {pagination.total}개 중 {(page - 1) * limit + 1}-{Math.min(page * limit, pagination.total)}개 표시
            </Typography>
          )}
        </>
      )}

      <QuestionDetailDialog
        open={detailDialogOpen}
        onClose={() => {
          setDetailDialogOpen(false);
          setSelectedQuestion(null);
        }}
        question={selectedQuestion}
      />

      <QuestionEditDialog
        open={editDialogOpen}
        onClose={() => {
          setEditDialogOpen(false);
          setSelectedQuestion(null);
        }}
        question={selectedQuestion}
        onSave={handleEditSave}
        processing={processing}
      />

      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>질문 삭제</DialogTitle>
        <DialogContent>
          <DialogContentText>
            이 질문을 삭제하시겠습니까? 삭제된 질문은 비활성화되며, 새로운 주차 생성 시 제외됩니다.
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
