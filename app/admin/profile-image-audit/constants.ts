import type {
  ProfileImageAuditProfileRank,
  ProfileImageAuditStatus,
  ProfileImageAuditValidationDecision,
} from '@/app/services/admin';
import { PRESET_REASONS } from '@/app/admin/profile-review/components/RejectReasonModal';
import type { AuditAction, AuditFilters } from './types';

export const PAGE_SIZE = 18;
export const SIMPLE_REJECT_REASON = '더 원활한 매칭을 위해 사진을 변경해주세요!';
export const REJECT_REASON_OPTIONS: readonly string[] = [
  SIMPLE_REJECT_REASON,
  '화질 문제로 사진 변경이 필요합니다.',
  '얼굴이 드러나도록 사진을 변경해주세요.',
  '다른 사람이 찍어 준 사진으로 바꾸면 더 좋을 것 같아요!',
];
export const DUPLICATE_REJECT_REASON = '중복 사진이라 사진 변경이 필요합니다.';
export const DUPLICATE_MODE_REASON_OPTIONS: readonly string[] = Array.from(new Set([
  DUPLICATE_REJECT_REASON,
  ...REJECT_REASON_OPTIONS,
  ...(PRESET_REASONS.INAPPROPRIATE_PROFILE_IMAGE ?? []),
  ...(PRESET_REASONS.FAKE_PROFILE ?? []),
]));
export const DUPLICATE_MODE_PAGE_SIZE = 100;
export const DUPLICATE_MODE_BULK_LIMIT = 100;
export const DELETE_REASON = '전체 프로필 이미지 전수검사 중 부적절 이미지 즉시 삭제';

export const DEFAULT_FILTERS: AuditFilters = {
  population: 'regular_photo',
  auditStatus: 'unreviewed',
  gender: undefined,
  isMain: undefined,
  hasReport: undefined,
  validationDecision: undefined,
  includeSuspended: false,
  includeBlacklisted: false,
};

// '삭제됨'은 없다: 삭제한 사진은 서버 목록에서 빠져 그 탭은 항상 비어 있었다.
// 상태 이름은 처리 버튼(정상 처리·2차 검토)과 겹치지 않게 '~됨/~대기'로 쓴다.
export const AUDIT_STATUS_OPTIONS: readonly {
  readonly value: ProfileImageAuditStatus;
  readonly label: string;
  readonly description: string;
}[] = [
  { value: 'unreviewed', label: '미검수', description: '아직 아무도 보지 않은 사진입니다.' },
  {
    value: 'needs_second_review',
    label: '2차 검토 대기',
    description: '다시 보기로 한 사진, 그리고 변경 요청 뒤 회원이 새로 올려 사진 심사를 통과한 사진입니다.',
  },
  {
    value: 'rejected',
    label: '거절됨',
    description: '사진 변경을 요청한 사진입니다. 회원이 새 사진을 올리면 사진 심사를 거쳐 2차 검토로 갑니다. 잘못 요청했다면 정상 처리로 되돌릴 수 있습니다.',
  },
  { value: 'ok', label: '정상 처리됨', description: '검수를 끝낸 사진입니다.' },
];

export const ALL_STATUS_DESCRIPTION = '검수 상태와 상관없이 모두 봅니다. 거절한 사진은 어둡게 가려 표시합니다.';

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
