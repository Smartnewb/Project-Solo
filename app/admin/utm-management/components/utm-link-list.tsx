'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  IconButton,
  TextField,
  InputAdornment,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Tooltip,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import LinkIcon from '@mui/icons-material/Link';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AdminService from '@/app/services/admin';
import type { UtmLink } from '@/app/services/admin';
import { useToast } from '@/shared/ui/admin/toast';
import { useConfirm } from '@/shared/ui/admin/confirm-dialog';

interface UtmLinkListProps {
  refreshKey: number;
}

export default function UtmLinkList({ refreshKey }: UtmLinkListProps) {
  const toast = useToast();
  const confirm = useConfirm();

  const [links, setLinks] = useState<UtmLink[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);

  const [editOpen, setEditOpen] = useState(false);
  const [editLink, setEditLink] = useState<UtmLink | null>(null);
  const [editName, setEditName] = useState('');
  const [editMemo, setEditMemo] = useState('');
  const [editSaving, setEditSaving] = useState(false);

  const fetchLinks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await AdminService.utm.getLinks({
        page: page + 1,
        search: search || undefined,
      });
      setLinks(result.data);
      setTotal(result.total);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || '링크 목록을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchLinks();
  }, [fetchLinks, refreshKey]);

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(0);
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} 복사 완료`);
    } catch {
      toast.error('클립보드 복사에 실패했습니다.');
    }
  };

  const openEdit = (link: UtmLink) => {
    setEditLink(link);
    setEditName(link.name);
    setEditMemo(link.memo || '');
    setEditOpen(true);
  };

  const handleEditSave = async () => {
    if (!editLink) return;
    setEditSaving(true);
    try {
      const updated = await AdminService.utm.updateLink(editLink.id, {
        name: editName,
        memo: editMemo || undefined,
      });
      setLinks((prev) => prev.map((l) => (l.id === editLink.id ? { ...l, ...updated } : l)));
      setEditOpen(false);
      toast.success('수정되었습니다.');
    } catch (err: any) {
      toast.error(err.response?.data?.message || '수정에 실패했습니다.');
    } finally {
      setEditSaving(false);
    }
  };

  const handleDelete = async (link: UtmLink) => {
    const confirmed = await confirm({
      title: '링크 삭제',
      message: `"${link.name}" 링크를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`,
      confirmText: '삭제',
      severity: 'error',
    });
    if (!confirmed) return;

    try {
      await AdminService.utm.deleteLink(link.id);
      toast.success('삭제되었습니다.');
      fetchLinks();
    } catch (err: any) {
      toast.error(err.response?.data?.message || '삭제에 실패했습니다.');
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  return (
    <>
      <Paper variant="outlined" sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" fontWeight={600}>
            UTM 링크 목록
          </Typography>
          <TextField
            placeholder="검색 (이름, 캠페인...)"
            size="small"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
              },
            }}
            sx={{ width: 280 }}
          />
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress />
          </Box>
        ) : links.length === 0 ? (
          <Box sx={{ py: 4, textAlign: 'center' }}>
            <Typography color="textSecondary">생성된 링크가 없습니다</Typography>
          </Box>
        ) : (
          <>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#f9fafb' }}>
                    <TableCell sx={{ fontWeight: 600 }}>이름</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>채널</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>캠페인</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="right">클릭 수</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="right">가입 수</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>생성일</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="center">액션</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {links.map((link) => (
                    <TableRow key={link.id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight={500}>
                          {link.name}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={link.utmSource}
                          size="small"
                          variant="outlined"
                          sx={{ fontSize: '0.75rem' }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="textSecondary">
                          {link.utmCampaign}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2">{link.clickCount ?? '-'}</Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2">{link.signupCount ?? '-'}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" color="textSecondary">
                          {formatDate(link.createdAt)}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
                          <Tooltip title="전체 URL 복사">
                            <IconButton
                              size="small"
                              onClick={() => copyToClipboard(link.destinationUrl, '전체 URL')}
                            >
                              <ContentCopyIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          {link.shortUrl && (
                            <Tooltip title="단축 URL 복사">
                              <IconButton
                                size="small"
                                onClick={() => copyToClipboard(link.shortUrl!, '단축 URL')}
                              >
                                <LinkIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                          <Tooltip title="수정">
                            <IconButton size="small" onClick={() => openEdit(link)}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="삭제">
                            <IconButton size="small" color="error" onClick={() => handleDelete(link)}>
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <TablePagination
              component="div"
              count={total}
              page={page}
              onPageChange={(_, newPage) => setPage(newPage)}
              rowsPerPage={20}
              rowsPerPageOptions={[20]}
              labelDisplayedRows={({ from, to, count }) => `${from}-${to} / ${count}`}
            />
          </>
        )}
      </Paper>

      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>링크 수정</DialogTitle>
        <DialogContent dividers>
          <TextField
            label="이름"
            fullWidth
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            sx={{ mb: 2, mt: 1 }}
          />
          <TextField
            label="메모"
            fullWidth
            multiline
            rows={3}
            value={editMemo}
            onChange={(e) => setEditMemo(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setEditOpen(false)} disabled={editSaving}>
            취소
          </Button>
          <Button variant="contained" onClick={handleEditSave} disabled={editSaving}>
            {editSaving ? <CircularProgress size={20} /> : '저장'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
