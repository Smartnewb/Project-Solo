import type { ProfileImageAuditItem } from '@/app/services/admin';
import type { AuditAction, SelectedAuditGroup } from './types';

export function formatGender(gender: string | null): string {
  if (gender === 'FEMALE') return '여성';
  if (gender === 'MALE') return '남성';
  return gender ?? '성별 미상';
}

export function formatAgeGender(item: ProfileImageAuditItem): string {
  const age = item.age == null ? '나이 미상' : `${item.age}세`;
  return `${age} · ${formatGender(item.gender)}`;
}

export function formatImageSlot(item: ProfileImageAuditItem): string {
  return item.isMain ? '대표 사진' : `${item.slotIndex + 1}번 사진`;
}

export function formatProfileRank(rank: string | null): string {
  if (rank === null || rank === 'UNKNOWN') return '등급 미분류';
  return `등급 ${rank}`;
}

export function getSelectedAuditGroup(
  items: readonly ProfileImageAuditItem[],
  selectedIds: ReadonlySet<string>,
): SelectedAuditGroup {
  const selectedItems = items.filter((item) => selectedIds.has(item.profileImageId));
  const selectedUserIds = Array.from(new Set(selectedItems.map((item) => item.userId)));

  return {
    selectedItems,
    selectedIds: selectedItems.map((item) => item.profileImageId),
    selectedUserIds,
  };
}

export function getActionTone(action: AuditAction): 'success' | 'warning' | 'error' | 'primary' {
  if (action === 'mark-ok') return 'success';
  if (action === 'second-review') return 'warning';
  if (action === 'delete') return 'error';
  return 'primary';
}
