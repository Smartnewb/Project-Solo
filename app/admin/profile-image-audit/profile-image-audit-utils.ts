import type {
  ProfileImageAuditBulkActionResponse,
  ProfileImageAuditItem,
  ProfileImageAuditReviewStatus,
  ProfileImageAuditStatus,
  ProfileImageAuditValidationDecision,
} from '@/app/services/admin';
import type { ProfileImageAuditProfileRank } from '@/app/services/admin';
import type { AuditAction, AuditFilters, SelectedAuditGroup } from './types';

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

export function formatImageKind(item: ProfileImageAuditItem): string {
  return item.isMain ? '대표' : '추가';
}

export function sortAuditSiblingImages(
  images: readonly ProfileImageAuditItem['siblingImages'][number][],
): readonly ProfileImageAuditItem['siblingImages'][number][] {
  return [...images].sort((left, right) => {
    if (left.isMain !== right.isMain) return left.isMain ? -1 : 1;
    if (left.slotIndex !== right.slotIndex) return left.slotIndex - right.slotIndex;
    return left.profileImageId.localeCompare(right.profileImageId);
  });
}

export function formatProfileRank(rank: ProfileImageAuditProfileRank | null): string {
  if (rank === null || rank === 'UNKNOWN') return '등급 미분류';
  return `등급 ${rank}`;
}

export function formatReviewedType(reviewedType: string | null): string {
  if (reviewedType === 'admin') return '관리자 승인';
  if (reviewedType === 'auto') return '자동 승인';
  return reviewedType ?? '승인 주체 미상';
}

export function formatReviewStatus(status: ProfileImageAuditReviewStatus): string {
  if (status === 'approved') return '승인';
  if (status === 'rejected') return '거절';
  return '대기';
}

export function formatValidationDecision(
  decision: ProfileImageAuditValidationDecision | null,
): string {
  if (decision === 'approved') return '자동 승인';
  if (decision === 'manual_review') return '수동 검토';
  if (decision === 'rejected') return '자동 거절';
  return '자동 판정 없음';
}

export function formatValidationSummary(item: ProfileImageAuditItem): string {
  if (!item.validation) return '검증 없음';
  return `${formatValidationDecision(item.validation.autoDecision)} · ${item.validation.totalScore ?? '-'}점`;
}

export function formatAuditStatus(status: ProfileImageAuditStatus): string {
  if (status === 'unreviewed') return '미검수';
  if (status === 'needs_second_review') return '2차 검토';
  if (status === 'ok') return '정상 처리';
  if (status === 'rejected') return '거절됨';
  return '삭제됨';
}

export function parseProfileRank(value: string): ProfileImageAuditProfileRank | null {
  switch (value) {
    case 'S':
    case 'A':
    case 'B':
    case 'C':
    case 'UNKNOWN':
      return value;
    default:
      return null;
  }
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

export function filterVisibleAuditItems(
  items: readonly ProfileImageAuditItem[],
  filters: AuditFilters,
): readonly ProfileImageAuditItem[] {
  return items.filter((item) => {
    if (filters.includeBlacklisted !== true && item.isBlacklisted) return false;
    if (filters.includeSuspended !== true && item.suspendedAt !== null) return false;
    return true;
  });
}

export function getActionTone(action: AuditAction): 'success' | 'warning' | 'error' | 'primary' {
  if (action === 'mark-ok') return 'success';
  if (action === 'second-review') return 'warning';
  if (action === 'delete') return 'error';
  return 'primary';
}

export function translateBulkFailureMessage(message: string | undefined): string {
  if (message === 'main image removal requires replacementMainProfileImageId') {
    return '대표 사진은 대체 대표 사진 지정이 필요합니다.';
  }
  if (message === 'last approved image removal requires reupload confirmation') {
    return '마지막 승인 사진은 재업로드 필요 확인이 필요합니다.';
  }
  if (message?.startsWith('already audited as ')) {
    return '이미 처리된 사진입니다.';
  }
  if (message === 'active approved image not found') {
    return '이미 삭제되었거나 승인 상태가 아닌 사진입니다.';
  }
  return message ?? '처리하지 못했습니다.';
}

function normalizeBulkCount(value: number | undefined): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

export function getBulkActionCounts(
  response: ProfileImageAuditBulkActionResponse,
): { readonly requested: number; readonly succeeded: number; readonly failed: number } {
  const results = response.data.results ?? [];
  const failedFromResults = results.filter((result) => result.status !== 'success').length;
  const requested = normalizeBulkCount(response.data.requested) ?? results.length;
  const failed = normalizeBulkCount(response.data.failed) ?? failedFromResults;
  const succeeded = normalizeBulkCount(response.data.succeeded) ?? Math.max(requested - failed, 0);

  return { requested, succeeded, failed };
}

export function summarizeBulkActionFailure(
  response: ProfileImageAuditBulkActionResponse,
): string | null {
  const counts = getBulkActionCounts(response);
  if (counts.failed === 0) return null;

  const failedMessages = (response.data.results ?? [])
    .filter((result) => result.status !== 'success')
    .map((result) => translateBulkFailureMessage(result.message));
  const uniqueMessages = Array.from(new Set(failedMessages));
  const summary =
    uniqueMessages.length === 0
      ? translateBulkFailureMessage(undefined)
      : uniqueMessages.slice(0, 2).join(' ');
  const suffix = uniqueMessages.length > 2 ? ` 외 ${uniqueMessages.length - 2}건` : '';

  return `처리 실패 ${counts.failed.toLocaleString()}장: ${summary}${suffix}`;
}
