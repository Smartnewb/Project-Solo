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
  Chip,
  IconButton,
  CircularProgress,
  TablePagination,
  Link as MuiLink,
} from '@mui/material';
import { useRouter } from 'next/navigation';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SendIcon from '@mui/icons-material/Send';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import ArchiveIcon from '@mui/icons-material/Archive';
import CampaignIcon from '@mui/icons-material/Campaign';
import {
  useNoticeList,
  useDeleteNotice,
  useArchiveNotice,
} from '@/app/admin/hooks';
import { useToast } from '@/shared/ui/admin/toast/toast-context';
import { useConfirm } from '@/shared/ui/admin/confirm-dialog/confirm-dialog-context';
import { getApiErrorMessage } from '@/app/utils/errors';
import { useDebounce } from '@/shared/hooks/use-debounce';
import { StatusBadge } from './StatusBadge';
import { ContentFilters } from './ContentFilters';
import { UrgentNoticeBox } from './UrgentNoticeBox';
import { PublishDialog } from './PublishDialog';
import { PushResendDialog } from './PushResendDialog';

function formatExpires(expiresAt?: string | null) {
  if (!expiresAt) return '제한없음';
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff < 0) return '만료됨';
  const days = Math.ceil(diff / 86400000);
  return `D-${days}`;
}

export function NoticeTable() {
  const router = useRouter();
  const toast = useToast();
  const confirmAction = useConfirm();

  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [publishItem, setPublishItem] = useState<{ id: string; title: string } | null>(null);
  const [resendItem, setResendItem] = useState<{
    id: string;
    title: string;
    pushTitle?: string | null;
    pushMessage?: string | null;
  } | null>(null);

  const debouncedSearch = useDebounce(search, 300);

  const { data, isLoading } = useNoticeList({
    page: page + 1,
    limit: rowsPerPage,
    ...(status ? { status } : {}),
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
  });

  const deleteNotice = useDeleteNotice();
  const archiveNotice = useArchiveNotice();
  const items = data?.items || [];

  const handleEdit = (id: string) => {
    router.push(`/admin/content/notice/edit/${id}`);
  };

  const handleDelete = async (id: string) => {
    const ok = await confirmAction({
      title: '공지 삭제',
      message: '이 공지를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.',
    });
    if (!ok) return;
    try {
      await deleteNotice.mutateAsync(id);
      toast.success('공지가 삭제되었습니다.');
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, '삭제에 실패했습니다.'));
    }
  };

  const handleArchive = async (id: string) => {
    const ok = await confirmAction({
      title: '공지 보관',
      message: '이 공지를 보관 처리하시겠습니까? 사용자에게 더 이상 노출되지 않습니다.',
    });
    if (!ok) return;
    try {
      await archiveNotice.mutateAsync(id);
      toast.success('공지가 보관되었습니다.');
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, '보관에 실패했습니다.'));
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
      <UrgentNoticeBox />

      <ContentFilters
        category=""
        status={status}
        search={search}
        onChange={(next) => {
          if (next.status !== undefined) setStatus(next.status);
          if (next.search !== undefined) setSearch(next.search);
          setPage(0);
        }}
        hideCategory
      />

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>제목</TableCell>
              <TableCell align="center">우선순위</TableCell>
              <TableCell align="center">만료</TableCell>
              <TableCell align="center">링크</TableCell>
              <TableCell align="center">상태</TableCell>
              <TableCell align="center">작업</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <Typography color="text.secondary" sx={{ py: 4 }}>
                    공지가 없습니다.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              items.map((item) => (
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
                    <Chip
                      label={item.priority === 'high' ? '긴급' : '일반'}
                      size="small"
                      color={item.priority === 'high' ? 'error' : 'default'}
                    />
                  </TableCell>
                  <TableCell align="center">{formatExpires(item.expiresAt)}</TableCell>
                  <TableCell align="center">
                    {item.url ? (
                      <MuiLink
                        href={item.url}
                        target="_blank"
                        rel="noopener"
                        sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}
                      >
                        이동 <OpenInNewIcon fontSize="inherit" />
                      </MuiLink>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell align="center">
                    <StatusBadge status={item.status} expiresAt={item.expiresAt} />
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
                      {item.status === 'published' && (
                        <>
                          <IconButton
                            size="small"
                            color="info"
                            onClick={() =>
                              setResendItem({
                                id: item.id,
                                title: item.title,
                                pushTitle: item.pushTitle,
                                pushMessage: item.pushMessage,
                              })
                            }
                            title="푸시 재발송"
                          >
                            <CampaignIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleArchive(item.id)}
                            title="보관"
                            disabled={archiveNotice.isPending}
                          >
                            <ArchiveIcon fontSize="small" />
                          </IconButton>
                        </>
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
        type="notice"
        item={publishItem}
      />

      <PushResendDialog
        open={!!resendItem}
        onClose={() => setResendItem(null)}
        item={resendItem}
      />
    </Box>
  );
}
