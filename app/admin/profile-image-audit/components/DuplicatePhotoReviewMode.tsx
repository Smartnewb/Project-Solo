'use client';
import { Button, Checkbox, Chip, ListBox, Select, Spinner } from '@heroui/react';
import { useEffect, useRef, useState } from 'react';
import { XCircle } from 'lucide-react';
import { profileImageAudit } from '@/app/services/admin';
import type { ProfileImageAuditItem, ProfileImageAuditSiblingImage } from '@/app/services/admin';
import { getAdminErrorMessage } from '@/shared/lib/http/admin-fetch';
import { DUPLICATE_MODE_PAGE_SIZE, DUPLICATE_MODE_REASON_OPTIONS, DUPLICATE_REJECT_REASON } from '../constants';
import { filterVisibleAuditItems, formatAgeGender, formatReviewStatus, getBulkActionCounts, sortAuditSiblingImages, summarizeBulkActionFailure, } from '../profile-image-audit-utils';
import type { AuditFilters } from '../types';

export type DuplicateReviewUser = {
    readonly profileId: string;
    readonly item: ProfileImageAuditItem;
    readonly images: readonly ProfileImageAuditSiblingImage[];
};

export function groupAuditItemsByUser(items: readonly ProfileImageAuditItem[], seen: ReadonlySet<string>): readonly DuplicateReviewUser[] {
    const rows = new Map<string, DuplicateReviewUser>();
    for (const item of items) {
        if (item.selectable === false || seen.has(item.profileId) || rows.has(item.profileId)) continue;
        const images = item.siblingImages.length > 0
            ? sortAuditSiblingImages(item.siblingImages)
            : [{ profileImageId: item.profileImageId, imageId: item.imageId, imageUrl: item.imageUrl, thumbnailUrl: item.thumbnailUrl ?? null, slotIndex: item.slotIndex, isMain: item.isMain, reviewStatus: item.reviewStatus }];
        rows.set(item.profileId, { profileId: item.profileId, item, images });
    }
    return Array.from(rows.values());
}

type Props = {
    readonly filters: AuditFilters;
};

export function DuplicatePhotoReviewMode({ filters }: Props) {
    const latestLoad = useRef(0);
    const sentinelRef = useRef<HTMLDivElement | null>(null);
    const [rows, setRows] = useState<readonly DuplicateReviewUser[]>([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [notice, setNotice] = useState<string | null>(null);
    const [selected, setSelected] = useState<ReadonlyMap<string, string>>(() => new Map());
    const [requested, setRequested] = useState<ReadonlySet<string>>(() => new Set());

    const loadPage = async (nextPage: number, reset: boolean) => {
        const requestId = ++latestLoad.current;
        try {
            setLoading(true);
            setError(null);
            const response = await profileImageAudit.list({ ...filters, page: nextPage, limit: DUPLICATE_MODE_PAGE_SIZE });
            if (requestId !== latestLoad.current) return;
            const visible = filterVisibleAuditItems(response.data, filters);
            setRows((current) => {
                const base = reset ? [] : current;
                const seen = new Set(base.map((row) => row.profileId));
                return [...base, ...groupAuditItemsByUser(visible, seen)];
            });
            setPage(nextPage);
            setHasMore(nextPage < response.meta.totalPages);
        }
        catch (loadError) {
            if (requestId !== latestLoad.current) return;
            setError(loadError instanceof Error ? getAdminErrorMessage(loadError, '중복검사 목록 조회 실패') : '중복검사 목록 조회 실패');
        }
        finally {
            if (requestId === latestLoad.current) setLoading(false);
        }
    };

    useEffect(() => {
        setSelected(new Map());
        setRequested(new Set());
        setNotice(null);
        loadPage(1, true);
    }, [filters]);

    const loadMoreRef = useRef(() => { });
    loadMoreRef.current = () => {
        if (hasMore && !loading) loadPage(page + 1, false);
    };
    useEffect(() => {
        const el = sentinelRef.current;
        if (!el || typeof IntersectionObserver === 'undefined') return;
        const observer = new IntersectionObserver((entries) => {
            if (entries.some((entry) => entry.isIntersecting)) loadMoreRef.current();
        }, { rootMargin: '600px 0px' });
        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    const toggle = (profileImageId: string) => {
        setSelected((current) => {
            const next = new Map(current);
            if (next.has(profileImageId)) next.delete(profileImageId);
            else next.set(profileImageId, DUPLICATE_REJECT_REASON);
            return next;
        });
    };
    const setReason = (profileImageId: string, reason: string) => {
        setSelected((current) => new Map(current).set(profileImageId, reason));
    };

    const submit = async () => {
        if (selected.size === 0) return;
        const byReason = new Map<string, string[]>();
        for (const [id, reason] of selected) byReason.set(reason, [...(byReason.get(reason) ?? []), id]);
        try {
            setBusy(true);
            setError(null);
            setNotice(null);
            let succeeded = 0;
            const failures: string[] = [];
            const done = new Set<string>();
            for (const [reason, profileImageIds] of byReason) {
                const response = await profileImageAudit.bulkReject({ profileImageIds, reason });
                succeeded += getBulkActionCounts(response).succeeded;
                const failure = summarizeBulkActionFailure(response);
                if (failure) failures.push(failure);
                const results = response.data.results;
                const okIds = results ? results.filter((result) => result.status === 'success').map((result) => result.profileImageId) : (failure ? [] : profileImageIds);
                okIds.forEach((id) => done.add(id));
            }
            setRequested((current) => new Set([...current, ...done]));
            setSelected((current) => new Map([...current].filter(([id]) => !done.has(id))));
            if (succeeded > 0) setNotice(`${succeeded.toLocaleString()}장에 사진 변경을 요청했습니다.`);
            if (failures.length > 0) setError(failures.join(' / '));
        }
        catch (actionError) {
            setError(actionError instanceof Error ? getAdminErrorMessage(actionError, '사진 변경 요청 실패') : '사진 변경 요청 실패');
        }
        finally {
            setBusy(false);
        }
    };

    return (<div data-testid="duplicate-review-mode">
      <div style={{ position: 'sticky', top: 0, zIndex: 5, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12, padding: 12, border: '1px solid #dbe3ef', backgroundColor: '#f8fafc' }}>
        <p>중복검사 · {rows.length.toLocaleString()}명 · 선택 {selected.size.toLocaleString()}장</p>
        <Button variant="secondary" isDisabled={selected.size === 0 || busy} onPress={() => setSelected(new Map())}>선택 해제</Button>
        <Button variant="danger" isDisabled={selected.size === 0 || busy} onPress={submit}>{<XCircle></XCircle>}
          선택한 사진 변경 요청
        </Button>
        <span className="text-xs text-gray-500">앱 푸시로 변경을 요청합니다. 사유는 사진마다 정할 수 있습니다.</span>
      </div>
      {notice && <aside role="alert" className="rounded-lg border p-3">{notice}</aside>}
      {error && <aside role="alert" className="rounded-lg border p-3">{error}</aside>}

      <div style={{ display: 'grid', gap: 12, marginTop: 12 }}>
        {rows.map((row) => (<section key={row.profileId} data-testid="duplicate-review-row" className="rounded-xl border p-3">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'baseline', marginBottom: 8 }}>
              <strong>{row.item.userName || '이름 미등록'}</strong>
              <span className="text-sm text-gray-600">{formatAgeGender(row.item)} · {row.item.universityName ?? '학교 미상'}</span>
              <span className="text-xs text-gray-500">회원 ID: {row.item.userId}</span>
              <Chip size="sm">{`${row.images.length}장`}</Chip>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 240px))', gap: 12 }}>
              {row.images.map((image) => {
                const isRequested = requested.has(image.profileImageId);
                const selectable = image.reviewStatus === 'approved' && !isRequested;
                const reason = selected.get(image.profileImageId);
                return (<div key={image.profileImageId} data-testid="duplicate-review-photo" style={{ outline: reason ? '3px solid #dc2626' : 'none', borderRadius: 8 }}>
                    <div style={{ position: 'relative', aspectRatio: '3 / 4', backgroundColor: '#e5e7eb', borderRadius: 8, overflow: 'hidden' }}>
                      <img src={image.imageUrl} alt={`${row.item.userName || row.item.userId} ${image.isMain ? '대표' : `${image.slotIndex + 1}번`} 사진`} loading="lazy" onError={(event) => {
                        if (image.thumbnailUrl && event.currentTarget.src !== image.thumbnailUrl) event.currentTarget.src = image.thumbnailUrl;
                    }} onClick={() => selectable && toggle(image.profileImageId)} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', opacity: isRequested ? 0.4 : 1, cursor: selectable ? 'pointer' : 'default' }}/>
                      {selectable && (<Checkbox aria-label={`${image.profileImageId} 선택`} isSelected={reason !== undefined} onChange={() => toggle(image.profileImageId)} style={{ position: 'absolute', top: 6, left: 6, zIndex: 2, backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: '50%' }}><Checkbox.Content><Checkbox.Control><Checkbox.Indicator></Checkbox.Indicator></Checkbox.Control></Checkbox.Content></Checkbox>)}
                      <Chip size="sm" style={{ position: 'absolute', top: 6, right: 6, zIndex: 2 }}>{image.isMain ? '대표' : `${image.slotIndex + 1}번`}</Chip>
                    </div>
                    <p className="text-xs text-gray-600" style={{ marginTop: 4 }}>
                      {isRequested ? '변경 요청됨' : formatReviewStatus(image.reviewStatus)}
                    </p>
                    {reason !== undefined && (<Select aria-label={`${image.profileImageId} 변경 사유`} value={reason} onChange={(key) => setReason(image.profileImageId, String(key ?? DUPLICATE_REJECT_REASON))} className="min-w-[120px]"><Select.Trigger><Select.Value></Select.Value><Select.Indicator></Select.Indicator></Select.Trigger><Select.Popover><ListBox>
                        {DUPLICATE_MODE_REASON_OPTIONS.map((option) => (<ListBox.Item key={option} id={option} textValue={option}>{option}</ListBox.Item>))}
                      </ListBox></Select.Popover></Select>)}
                  </div>);
            })}
            </div>
          </section>))}
      </div>

      {!loading && rows.length === 0 && !error && <p style={{ padding: 24 }}>조건에 맞는 회원이 없습니다.</p>}
      <div ref={sentinelRef} style={{ display: 'flex', justifyContent: 'center', padding: 16 }}>
        {loading ? <Spinner></Spinner> : hasMore && <Button variant="secondary" onPress={() => loadMoreRef.current()}>더 보기</Button>}
      </div>
    </div>);
}
