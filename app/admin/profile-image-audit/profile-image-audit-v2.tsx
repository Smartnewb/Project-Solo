'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Pagination,
  Stack,
  Typography,
} from '@mui/material';
import { Images, RefreshCw } from 'lucide-react';
import { profileImageAudit, userReview } from '@/app/services/admin';
import type {
  ProfileImageAuditBulkActionResponse,
  ProfileImageAuditItem,
  ProfileImageAuditProfileRank,
} from '@/app/services/admin';
import { getAdminErrorMessage } from '@/shared/lib/http/admin-fetch';
import { BlacklistRegisterModal } from '@/app/admin/blacklist/components/BlacklistRegisterModal';
import {
  DEFAULT_FILTERS,
  DELETE_REASON,
  PAGE_SIZE,
  SIMPLE_REJECT_REASON,
} from './constants';
import { AuditBulkToolbar } from './components/AuditBulkToolbar';
import { AuditFiltersBar } from './components/AuditFiltersBar';
import { ConfirmAuditActionDialog } from './components/ConfirmAuditActionDialog';
import { ProfileImageAuditGrid } from './components/ProfileImageAuditGrid';
import { formatProfileRank, getBulkActionCounts, getSelectedAuditGroup, summarizeBulkActionFailure } from './profile-image-audit-utils';
import type { AuditAction, AuditFilters } from './types';

export default function ProfileImageAuditV2() {
  const [items, setItems] = useState<readonly ProfileImageAuditItem[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<AuditFilters>(DEFAULT_FILTERS);
  const [selectedIds, setSelectedIds] = useState<ReadonlySet<string>>(() => new Set());
  const [pendingAction, setPendingAction] = useState<AuditAction | null>(null);
  const [blacklistTarget, setBlacklistTarget] = useState<ProfileImageAuditItem | null>(null);
  const [rankUpdatingUserId, setRankUpdatingUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const selectedGroup = useMemo(
    () => getSelectedAuditGroup(items, selectedIds),
    [items, selectedIds],
  );

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await profileImageAudit.list({ page, limit: PAGE_SIZE, ...filters });
      setItems(response.data);
      setTotal(response.meta.total);
      setTotalPages(response.meta.totalPages);
      setSelectedIds(new Set());
    } catch (loadError) {
      const message =
        loadError instanceof Error
          ? getAdminErrorMessage(loadError, '프로필 이미지 전수검사 목록 조회 실패')
          : '프로필 이미지 전수검사 목록 조회 실패';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [page, filters]);

  const handleFilterChange = (nextFilters: AuditFilters) => {
    setFilters(nextFilters);
    setPage(1);
  };

  const toggleSelection = (profileImageId: string) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(profileImageId)) {
        next.delete(profileImageId);
      } else {
        next.add(profileImageId);
      }
      return next;
    });
  };

  const selectVisibleItems = () => {
    setSelectedIds(new Set(items.map((item) => item.profileImageId)));
  };

  const handleRankChange = async (
    item: ProfileImageAuditItem,
    rank: ProfileImageAuditProfileRank,
  ) => {
    if ((item.profileRank ?? 'UNKNOWN') === rank || rankUpdatingUserId !== null) return;

    const previousItems = items;
    setRankUpdatingUserId(item.userId);
    setItems((current) =>
      current.map((entry) =>
        entry.userId === item.userId ? { ...entry, profileRank: rank } : entry,
      ),
    );

    try {
      await userReview.updateUserRank(item.userId, rank);
      setNotice(`등급을 ${formatProfileRank(rank)}로 변경했습니다.`);
    } catch (rankError) {
      setItems(previousItems);
      const message =
        rankError instanceof Error
          ? getAdminErrorMessage(rankError, '등급 변경 실패')
          : '등급 변경 실패';
      setError(message);
    } finally {
      setRankUpdatingUserId(null);
    }
  };

  const runAction = async () => {
    if (!pendingAction || selectedGroup.selectedIds.length === 0) return;

    try {
      setBusy(true);
      setError(null);
      let response: ProfileImageAuditBulkActionResponse;
      if (pendingAction === 'mark-ok') {
        response = await profileImageAudit.bulkMarkOk({ profileImageIds: selectedGroup.selectedIds });
      } else if (pendingAction === 'second-review') {
        response = await profileImageAudit.bulkFlagSecondReview({ profileImageIds: selectedGroup.selectedIds });
      } else if (pendingAction === 'reject') {
        response = await profileImageAudit.bulkReject({
          profileImageIds: selectedGroup.selectedIds,
          reason: SIMPLE_REJECT_REASON,
        });
      } else {
        response = await profileImageAudit.bulkDelete({
          profileImageIds: selectedGroup.selectedIds,
          reason: DELETE_REASON,
        });
      }
      const failureMessage = summarizeBulkActionFailure(response);
      const counts = getBulkActionCounts(response);
      if (failureMessage) {
        setError(failureMessage);
        if (counts.succeeded === 0) {
          setPendingAction(null);
          return;
        }
      }
      if (counts.succeeded > 0) {
        setNotice(`선택한 ${counts.succeeded.toLocaleString()}장을 처리했습니다.`);
      }
      setPendingAction(null);
      await load();
    } catch (actionError) {
      const message =
        actionError instanceof Error
          ? getAdminErrorMessage(actionError, '프로필 이미지 처리 실패')
          : '프로필 이미지 처리 실패';
      setError(message);
    } finally {
      setBusy(false);
    }
  };

  const openBlacklist = () => {
    if (selectedGroup.selectedItems.length === 0 || selectedGroup.selectedUserIds.length !== 1) return;
    setBlacklistTarget(selectedGroup.selectedItems[0] ?? null);
  };

  const blacklistHandoff = useMemo(() => {
    if (selectedGroup.selectedItems.length === 0 || selectedGroup.selectedUserIds.length !== 1) {
      return null;
    }
    return profileImageAudit.buildBlacklistHandoff(selectedGroup.selectedItems);
  }, [selectedGroup]);

  return (
    <Box p={3}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
        <Stack direction="row" spacing={1} alignItems="center">
          <Images size={26} color="#2563eb" />
          <Typography variant="h4" component="h1" fontWeight={800}>
            프로필 이미지 전수검사
          </Typography>
          <Typography variant="body2" color="text.secondary">
            · 총 {total.toLocaleString()}장
          </Typography>
        </Stack>
        <Button
          size="small"
          variant="outlined"
          startIcon={<RefreshCw size={16} />}
          onClick={load}
          disabled={loading || busy}
        >
          새로고침
        </Button>
      </Stack>

      <Stack spacing={2}>
        <AuditFiltersBar filters={filters} onChange={handleFilterChange} />
        <AuditBulkToolbar
          group={selectedGroup}
          visibleCount={items.length}
          busy={busy}
          onSelectVisible={selectVisibleItems}
          onAction={setPendingAction}
          onBlacklist={openBlacklist}
        />
        {notice && <Alert severity="success" onClose={() => setNotice(null)}>{notice}</Alert>}
        {error && <Alert severity="error">{error}</Alert>}
        <ProfileImageAuditGrid
          items={items}
          selectedIds={selectedIds}
          loading={loading}
          onToggle={toggleSelection}
          onRankChange={handleRankChange}
          rankUpdatingUserId={rankUpdatingUserId}
        />
        {totalPages > 1 && (
          <Box display="flex" justifyContent="center" pt={1}>
            <Pagination page={page} count={totalPages} onChange={(_, value) => setPage(value)} />
          </Box>
        )}
      </Stack>

      <ConfirmAuditActionDialog
        action={pendingAction}
        selectedCount={selectedGroup.selectedIds.length}
        busy={busy}
        onClose={() => setPendingAction(null)}
        onConfirm={runAction}
      />

      {blacklistTarget && (
        <BlacklistRegisterModal
          open
          user={{
            id: blacklistTarget.userId,
            name: `유저 ${blacklistTarget.userId}`,
            age: blacklistTarget.age ?? undefined,
            gender: blacklistTarget.gender ?? undefined,
            universityName: blacklistTarget.universityName ?? undefined,
          }}
          initialReason={blacklistHandoff?.reason}
          initialMemo={blacklistHandoff?.memo}
          onClose={() => setBlacklistTarget(null)}
          onSuccess={() => {
            setBlacklistTarget(null);
            load();
          }}
        />
      )}
    </Box>
  );
}
