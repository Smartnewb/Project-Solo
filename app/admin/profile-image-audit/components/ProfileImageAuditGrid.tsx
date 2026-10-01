'use client';
import { Spinner } from '@heroui/react';
import type { ProfileImageAuditItem, ProfileImageAuditProfileRank } from '@/app/services/admin';
import { ProfileImageAuditCard } from './ProfileImageAuditCard';
type Props = {
    readonly items: readonly ProfileImageAuditItem[];
    readonly selectedIds: ReadonlySet<string>;
    readonly loading: boolean;
    readonly onToggle: (profileImageId: string) => void;
    readonly onRankChange: (item: ProfileImageAuditItem, rank: ProfileImageAuditProfileRank) => void;
    readonly rankUpdatingUserId: string | null;
};
export function ProfileImageAuditGrid({ items, selectedIds, loading, onToggle, onRankChange, rankUpdatingUserId, }: Props) {
    if (loading) {
        return (<div style={{ minHeight: 360, display: "flex" }}>
        <Spinner size="sm"></Spinner>
      </div>);
    }
    if (items.length === 0) {
        return (<div style={{ border: "1px dashed #cbd5e1", borderRadius: 2, padding: 40, textAlign: "center" }}>
        <p>검수할 이미지가 없습니다.</p>
        <p style={{ marginTop: 4 }}>
          필터를 바꾸거나 이미 처리된 항목 포함 여부를 확인하세요.
        </p>
      </div>);
    }
    return (<div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))" }}>
      {items.map((item) => (<ProfileImageAuditCard key={item.profileImageId} item={item} selected={selectedIds.has(item.profileImageId)} onToggle={onToggle} onRankChange={onRankChange} rankUpdating={rankUpdatingUserId === item.userId}></ProfileImageAuditCard>))}
    </div>);
}
