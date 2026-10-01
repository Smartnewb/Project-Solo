'use client';
import { Button, Input } from '@heroui/react';
import { useEffect, useMemo, useState } from 'react';
import { Images, RefreshCw } from 'lucide-react';
import { profileImageAudit, userReview } from '@/app/services/admin';
import type { ProfileImageAuditBulkActionResponse, ProfileImageAuditItem, ProfileImageAuditProfileRank, } from '@/app/services/admin';
import { getAdminErrorMessage } from '@/shared/lib/http/admin-fetch';
import { BlacklistRegisterModal } from '@/app/admin/blacklist/components/BlacklistRegisterModal';
import { DEFAULT_FILTERS, DELETE_REASON, PAGE_SIZE, SIMPLE_REJECT_REASON, } from './constants';
import { AuditBulkToolbar } from './components/AuditBulkToolbar';
import { AuditFiltersBar } from './components/AuditFiltersBar';
import { ConfirmAuditActionDialog } from './components/ConfirmAuditActionDialog';
import { ProfileImageAuditGrid } from './components/ProfileImageAuditGrid';
import { filterVisibleAuditItems, formatProfileRank, getBulkActionCounts, getSelectedAuditGroup, summarizeBulkActionFailure } from './profile-image-audit-utils';
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
    const selectedGroup = useMemo(() => getSelectedAuditGroup(items, selectedIds), [items, selectedIds]);
    const load = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await profileImageAudit.list({ page, limit: PAGE_SIZE, ...filters });
            const visibleItems = filterVisibleAuditItems(response.data, filters);
            const hiddenItemCount = response.data.length - visibleItems.length;
            setItems(visibleItems);
            setTotal(Math.max(response.meta.total - hiddenItemCount, visibleItems.length));
            setTotalPages(response.meta.totalPages);
            setSelectedIds(new Set());
        }
        catch (loadError) {
            const message = loadError instanceof Error
                ? getAdminErrorMessage(loadError, '프로필 이미지 전수검사 목록 조회 실패')
                : '프로필 이미지 전수검사 목록 조회 실패';
            setError(message);
        }
        finally {
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
            }
            else {
                next.add(profileImageId);
            }
            return next;
        });
    };
    const selectVisibleItems = () => {
        setSelectedIds(new Set(items.map((item) => item.profileImageId)));
    };
    const handleRankChange = async (item: ProfileImageAuditItem, rank: ProfileImageAuditProfileRank) => {
        if ((item.profileRank ?? 'UNKNOWN') === rank || rankUpdatingUserId !== null)
            return;
        const previousItems = items;
        setRankUpdatingUserId(item.userId);
        setItems((current) => current.map((entry) => entry.userId === item.userId ? { ...entry, profileRank: rank } : entry));
        try {
            await userReview.updateUserRank(item.userId, rank);
            setNotice(`등급을 ${formatProfileRank(rank)}로 변경했습니다.`);
        }
        catch (rankError) {
            setItems(previousItems);
            const message = rankError instanceof Error
                ? getAdminErrorMessage(rankError, '등급 변경 실패')
                : '등급 변경 실패';
            setError(message);
        }
        finally {
            setRankUpdatingUserId(null);
        }
    };
    const runAction = async (rejectReason?: string) => {
        if (!pendingAction || selectedGroup.selectedIds.length === 0)
            return;
        try {
            setBusy(true);
            setError(null);
            let response: ProfileImageAuditBulkActionResponse;
            if (pendingAction === 'mark-ok') {
                response = await profileImageAudit.bulkMarkOk({ profileImageIds: selectedGroup.selectedIds });
            }
            else if (pendingAction === 'second-review') {
                response = await profileImageAudit.bulkFlagSecondReview({ profileImageIds: selectedGroup.selectedIds });
            }
            else if (pendingAction === 'reject') {
                response = await profileImageAudit.bulkReject({
                    profileImageIds: selectedGroup.selectedIds,
                    reason: rejectReason?.trim() || SIMPLE_REJECT_REASON,
                });
            }
            else {
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
        }
        catch (actionError) {
            const message = actionError instanceof Error
                ? getAdminErrorMessage(actionError, '프로필 이미지 처리 실패')
                : '프로필 이미지 처리 실패';
            setError(message);
        }
        finally {
            setBusy(false);
        }
    };
    const openBlacklist = () => {
        if (selectedGroup.selectedItems.length === 0 || selectedGroup.selectedUserIds.length !== 1)
            return;
        setBlacklistTarget(selectedGroup.selectedItems[0] ?? null);
    };
    const blacklistHandoff = useMemo(() => {
        if (selectedGroup.selectedItems.length === 0 || selectedGroup.selectedUserIds.length !== 1) {
            return null;
        }
        return profileImageAudit.buildBlacklistHandoff(selectedGroup.selectedItems);
    }, [selectedGroup]);
    return (<div style={{ padding: 24 }}>
      <div style={{ marginBottom: 16 }}>
        <div>
          <Images></Images>
          <h1 className="text-2xl font-bold">프로필 이미지 전수검사</h1>
          <p>
            · 총 {total.toLocaleString()}장
          </p>
        </div>
        <Button onPress={load} isDisabled={loading || busy} variant="secondary">{<RefreshCw></RefreshCw>}
          새로고침
        </Button>
      </div>

      <div>
        <AuditFiltersBar filters={filters} onChange={handleFilterChange}></AuditFiltersBar>
        <AuditBulkToolbar group={selectedGroup} visibleCount={items.length} busy={busy} onSelectVisible={selectVisibleItems} onAction={setPendingAction} onBlacklist={openBlacklist}></AuditBulkToolbar>
        {notice && <aside role="alert" className="rounded-lg border p-3">{notice}</aside>}
        {error && <aside role="alert" className="rounded-lg border p-3">{error}</aside>}
        <ProfileImageAuditGrid items={items} selectedIds={selectedIds} loading={loading} onToggle={toggleSelection} onRankChange={handleRankChange} rankUpdatingUserId={rankUpdatingUserId}></ProfileImageAuditGrid>
        {totalPages > 1 && (<div style={{ display: "flex", paddingTop: 8 }}>
            <nav aria-label="페이지 이동" className="flex items-center justify-center gap-3"><Button variant="secondary" isDisabled={page <= 1} onPress={() => ((_, value) => setPage(value))({} as never, page - 1)}>이전</Button><Input type="number" aria-label="페이지 번호" min={1} max={totalPages} value={page} onChange={event => setPage(Number(event.target.value))} className="w-16 rounded border p-2"></Input><span>/ {totalPages}</span><Button variant="secondary" isDisabled={page >= totalPages} onPress={() => ((_, value) => setPage(value))({} as never, page + 1)}>다음</Button></nav>
          </div>)}
      </div>

      <ConfirmAuditActionDialog action={pendingAction} selectedCount={selectedGroup.selectedIds.length} busy={busy} onClose={() => setPendingAction(null)} onConfirm={runAction}></ConfirmAuditActionDialog>

      {blacklistTarget && (<BlacklistRegisterModal open user={{
                id: blacklistTarget.userId,
                name: `유저 ${blacklistTarget.userId}`,
                age: blacklistTarget.age ?? undefined,
                gender: blacklistTarget.gender ?? undefined,
                universityName: blacklistTarget.universityName ?? undefined,
            }} initialReason={blacklistHandoff?.reason} initialMemo={blacklistHandoff?.memo} onClose={() => setBlacklistTarget(null)} onSuccess={() => {
                setBlacklistTarget(null);
                load();
            }}></BlacklistRegisterModal>)}
    </div>);
}
