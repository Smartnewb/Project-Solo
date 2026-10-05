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
export function groupConsecutiveByProfile(items: readonly ProfileImageAuditItem[]): readonly (readonly ProfileImageAuditItem[])[] {
    const groups: ProfileImageAuditItem[][] = [];
    for (const item of items) {
        const last = groups[groups.length - 1];
        if (last && last[0].profileId === item.profileId) last.push(item);
        else groups.push([item]);
    }
    return groups;
}
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
    const cardWidth = items.some(item => item.presentationMode === 'BLIND') ? 360 : 200;
    return (<div style={{ display: "flex", flexWrap: "wrap", gap: 16, alignItems: "flex-start" }}>
      {groupConsecutiveByProfile(items).map((group) => (<div key={`${group[0].profileId}:${group[0].profileImageId}`} data-testid="profile-image-audit-user-group" aria-label={`${group[0].userName || group[0].userId} 사진 묶음`} style={{ display: "flex", flexWrap: "wrap", gap: 8, padding: 8, border: "2px solid #94a3b8", borderRadius: 14, backgroundColor: "#f8fafc", maxWidth: "100%", boxSizing: "border-box" }}>
          {group.map((item) => (<div key={item.profileImageId} style={{ flex: `0 1 ${cardWidth}px`, minWidth: 150, maxWidth: cardWidth }}>
              <ProfileImageAuditCard item={item} selected={selectedIds.has(item.profileImageId)} onToggle={onToggle} onRankChange={onRankChange} rankUpdating={rankUpdatingUserId === item.userId}></ProfileImageAuditCard>
            </div>))}
        </div>))}
    </div>);
}
