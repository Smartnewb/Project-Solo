import type {
  ProfileImageAuditProfileRank,
  ProfileImageAuditStatus,
  ProfileImageAuditValidationDecision,
} from '@/app/services/admin';
import type { AuditAction, AuditFilters } from './types';

export const PAGE_SIZE = 18;
export const SIMPLE_REJECT_REASON = '더 원활한 매칭을 위해 사진을 변경해주세요!';
export const REJECT_REASON_OPTIONS: readonly string[] = [
  SIMPLE_REJECT_REASON,
  '화질 문제로 사진 변경이 필요합니다.',
  '얼굴이 드러나도록 사진을 변경해주세요.',
  '다른 사람이 찍어 준 사진으로 바꾸면 더 좋을 것 같아요!',
];
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

export const PROFILE_RANK_OPTIONS: readonly {
  readonly value: ProfileImageAuditProfileRank;
  readonly label: string;
}[] = [
  { value: 'S', label: 'S' },
  { value: 'A', label: 'A' },
  { value: 'B', label: 'B' },
  { value: 'C', label: 'C' },
  { value: 'UNKNOWN', label: '미분류' },
];

export const ACTION_LABELS: Record<AuditAction, string> = {
  'mark-ok': '정상 처리',
  'second-review': '2차 검토',
  reject: '사진 변경 요청',
  delete: '즉시 삭제',
};
