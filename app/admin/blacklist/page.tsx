'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useDebounce } from '@/shared/hooks/use-debounce';
import {
  Box,
  Typography,
  TextField,
  Pagination,
  Stack,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from '@mui/material';
import { ShieldBan } from 'lucide-react';
import { blacklist, type BlacklistItem } from '@/app/services/admin';
import { getAdminErrorMessage } from '@/shared/lib/http/admin-fetch';
import { BlacklistTable } from './components/BlacklistTable';
import { BlacklistReleaseDialog } from './components/BlacklistReleaseDialog';
import { BlacklistHistoryTimeline } from './components/BlacklistHistoryTimeline';

const PAGE_SIZE = 20;
const DEBOUNCE_MS = 400;

export default function BlacklistPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  const initialPage = Number(searchParams?.get('page') ?? '1') || 1;
  const initialSearch = searchParams?.get('search') ?? '';

  const [page, setPage] = useState<number>(initialPage);
  const [searchInput, setSearchInput] = useState<string>(initialSearch);
  const debouncedSearch = useDebounce(searchInput, DEBOUNCE_MS);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  useEffect(() => {
    const sp = new URLSearchParams();
    if (debouncedSearch) sp.set('search', debouncedSearch);
    if (page > 1) sp.set('page', String(page));
    const qs = sp.toString();
    router.replace(qs ? `/admin/blacklist?${qs}` : '/admin/blacklist');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, page]);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['blacklist', { page, search: debouncedSearch }],
    queryFn: () =>
      blacklist.getList({
        page,
        limit: PAGE_SIZE,
        search: debouncedSearch || undefined,
      }),
    placeholderData: (prev) => prev,
  });

  const items = data?.data ?? [];
  const meta = data?.meta;
  const total = meta?.total ?? 0;
  const totalPages = meta?.totalPages ?? 1;

  const [releaseTarget, setReleaseTarget] = useState<BlacklistItem | null>(null);
  const [historyUserId, setHistoryUserId] = useState<string | null>(null);

  const handleReleaseSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['blacklist', { page, search: debouncedSearch }] });
    if (historyUserId) {
      queryClient.invalidateQueries({ queryKey: ['blacklist-history', historyUserId] });
    }
  };

  const errorMessage = useMemo(
    () => (isError ? getAdminErrorMessage(error, '블랙리스트 목록 조회 실패') : null),
    [isError, error],
  );

  return (
    <Box p={3}>
      <Stack direction="row" alignItems="center" spacing={1} mb={2}>
        <ShieldBan size={24} color="#dc2626" />
        <Typography variant="h5" fontWeight={700}>
          블랙리스트
        </Typography>
        <Typography variant="body2" color="text.secondary">
          · 총 {total.toLocaleString()}건
        </Typography>
      </Stack>

      <Box mb={2}>
        <TextField
          size="small"
          placeholder="이름 또는 전화번호 검색"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          sx={{ width: 320 }}
        />
      </Box>

      {errorMessage && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {errorMessage}
        </Alert>
      )}

      <BlacklistTable
        data={items}
        loading={isLoading}
        onRelease={(item) => setReleaseTarget(item)}
        onViewHistory={(userId) => setHistoryUserId(userId)}
      />

      {totalPages > 1 && (
        <Box mt={2} display="flex" justifyContent="center">
          <Pagination
            page={page}
            count={totalPages}
            onChange={(_, p) => setPage(p)}
            color="primary"
          />
        </Box>
      )}

      {releaseTarget && (
        <BlacklistReleaseDialog
          open={!!releaseTarget}
          onClose={() => setReleaseTarget(null)}
          userId={releaseTarget.userId}
          userName={releaseTarget.name}
          currentReason={releaseTarget.reason}
          blacklistedAt={releaseTarget.blacklistedAt}
          onSuccess={handleReleaseSuccess}
        />
      )}

      <Dialog
        open={!!historyUserId}
        onClose={() => setHistoryUserId(null)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>블랙리스트 이력</DialogTitle>
        <DialogContent dividers>
          {historyUserId && (
            <BlacklistHistoryTimeline
              userId={historyUserId}
              onRelease={(entry) => {
                const found = items.find((i) => i.userId === entry.userId);
                if (found) {
                  setHistoryUserId(null);
                  setReleaseTarget(found);
                }
              }}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setHistoryUserId(null)}>닫기</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
