import type {
  ProfileImageAuditStatus,
  ProfileImageAuditValidationDecision,
} from '@/app/services/admin';
import type { AuditAction, AuditFilters } from './types';

export const PAGE_SIZE = 16;
export const SIMPLE_REJECT_REASON = '기준에 미달하는 프로필 이미지입니다.';
export const DELETE_REASON = '전체 프로필 이미지 전수검사 중 부적절 이미지 즉시 삭제';

export const DEFAULT_FILTERS: AuditFilters = {
  auditStatus: 'unreviewed',
  gender: undefined,
  isMain: undefined,
  hasReport: undefined,
  validationDecision: undefined,
  includeSuspended: false,
  includeBlacklisted: false,
};

export const AUDIT_STATUS_OPTIONS: readonly {
  readonly value: ProfileImageAuditStatus;
  readonly label: string;
}[] = [
  { value: 'unreviewed', label: '미검수' },
  { value: 'needs_second_review', label: '2차 검토' },
  { value: 'ok', label: '정상 처리' },
  { value: 'rejected', label: '거절됨' },
  { value: 'deleted', label: '삭제됨' },
];

export const VALIDATION_OPTIONS: readonly {
  readonly value: ProfileImageAuditValidationDecision;
  readonly label: string;
}[] = [
  { value: 'approved', label: '자동 승인' },
  { value: 'manual_review', label: '수동 검토' },
  { value: 'rejected', label: '자동 거절' },
];

export const ACTION_LABELS: Record<AuditAction, string> = {
  'mark-ok': '정상 처리',
  'second-review': '2차 검토',
  reject: '기준 미달 거절',
  delete: '즉시 삭제',
};
