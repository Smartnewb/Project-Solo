import {
  adminGet,
  adminPost,
  type AdminQueryParams,
} from '@/shared/lib/http/admin-fetch';

const BASE_PATH = '/admin/v2/profile-image-audit/images';
const BLACKLIST_HANDOFF_REASON = '부적절한 프로필 이미지';

export type ProfileImageAuditStatus =
  | 'unreviewed'
  | 'ok'
  | 'rejected'
  | 'deleted'
  | 'needs_second_review';

export type ProfileImageAuditReviewStatus = 'approved' | 'rejected' | 'pending';
export type ProfileImageAuditReviewedType = string;
export type ProfileImageAuditValidationDecision =
  | 'approved'
  | 'manual_review'
  | 'rejected';

export type ProfileImageAuditSiblingImage = {
  readonly profileImageId: string;
  readonly imageId: string;
  readonly imageUrl: string;
  readonly thumbnailUrl: string | null;
  readonly slotIndex: number;
  readonly isMain: boolean;
  readonly reviewStatus: ProfileImageAuditReviewStatus;
};

export type ProfileImageAuditValidation = {
  readonly totalScore: number | null;
  readonly autoDecision: ProfileImageAuditValidationDecision | null;
  readonly decisionReason: string | null;
  readonly createdAt: string | null;
};

export type ProfileImageAuditRiskSignals = {
  readonly reportCount: number;
  readonly hasSuspensionHistory: boolean;
  readonly isFirstReview: boolean;
  readonly isUniversityVerified: boolean;
  readonly hasPurchaseHistory: boolean;
};

export type ProfileImageAuditItem = {
  readonly profileImageId: string;
  readonly imageId: string;
  readonly imageUrl: string;
  readonly thumbnailUrl?: string | null;
  readonly userId: string;
  readonly profileId: string;
  readonly profileRank: string | null;
  readonly age: number | null;
  readonly gender: string | null;
  readonly universityName: string | null;
  readonly slotIndex: number;
  readonly isMain: boolean;
  readonly reviewStatus: ProfileImageAuditReviewStatus;
  readonly reviewedType: ProfileImageAuditReviewedType | null;
  readonly reviewedAt: string | null;
  readonly rejectionReason: string | null;
  readonly auditStatus: ProfileImageAuditStatus;
  readonly auditReviewedAt: string | null;
  readonly auditReviewedBy: string | null;
  readonly auditDecisionReason: string | null;
  readonly isBlacklisted: boolean;
  readonly suspendedAt: string | null;
  readonly approvedImageCount: number;
  readonly totalActiveImageCount: number;
  readonly hasReport: boolean;
  readonly siblingImages: readonly ProfileImageAuditSiblingImage[];
  readonly validation: ProfileImageAuditValidation | null;
  readonly riskSignals: ProfileImageAuditRiskSignals;
};

export type ProfileImageAuditListMeta = {
  readonly page: number;
  readonly limit: number;
  readonly total: number;
  readonly totalPages: number;
};

export type ProfileImageAuditListResponse = {
  readonly data: readonly ProfileImageAuditItem[];
  readonly meta: ProfileImageAuditListMeta;
};

export type ProfileImageAuditListParams = {
  readonly page?: number;
  readonly limit?: number;
  readonly search?: string;
  readonly gender?: string;
  readonly university?: string;
  readonly reviewedType?: ProfileImageAuditReviewedType;
  readonly from?: string;
  readonly to?: string;
  readonly reviewedAtFrom?: string;
  readonly reviewedAtTo?: string;
  readonly isMain?: boolean;
  readonly slotIndex?: number;
  readonly auditStatus?: ProfileImageAuditStatus;
  readonly includeAlreadyAudited?: boolean;
  readonly includeSuspended?: boolean;
  readonly includeBlacklisted?: boolean;
  readonly hasReport?: boolean;
  readonly validationDecision?: ProfileImageAuditValidationDecision;
};

export type ProfileImageAuditActionResultStatus =
  | 'success'
  | 'skipped'
  | 'not_found'
  | 'already_processed'
  | 'conflict'
  | 'error';

export type ProfileImageAuditActionResult = {
  readonly profileImageId: string;
  readonly userId?: string;
  readonly status: ProfileImageAuditActionResultStatus;
  readonly message?: string;
};

export type ProfileImageAuditBulkActionResponse = {
  readonly data: {
    readonly requested: number;
    readonly succeeded: number;
    readonly failed: number;
    readonly results: readonly ProfileImageAuditActionResult[];
  };
};

export type ProfileImageAuditBulkMarkOkRequest = {
  readonly profileImageIds: readonly string[];
};

export type ProfileImageAuditBulkSecondReviewRequest = {
  readonly profileImageIds: readonly string[];
  readonly memo?: string;
};

export type ProfileImageAuditBulkRejectRequest = {
  readonly profileImageIds: readonly string[];
  readonly reason?: string;
  readonly memo?: string;
  readonly replacementMainProfileImageId?: string;
  readonly confirmationPhrase?: string;
};

export type ProfileImageAuditBulkDeleteRequest = {
  readonly profileImageIds: readonly string[];
  readonly reason: string;
  readonly memo?: string;
  readonly replacementMainProfileImageId?: string;
  readonly confirmationPhrase?: string;
};

export type ProfileImageAuditBlacklistHandoff = {
  readonly userId: string;
  readonly reason: string;
  readonly memo: string;
  readonly profileImageIds: readonly string[];
  readonly imageUrls: readonly string[];
};

function toListQueryParams(params: ProfileImageAuditListParams): AdminQueryParams {
  return {
    page: params.page,
    limit: params.limit,
    search: params.search,
    gender: params.gender,
    university: params.university,
    reviewedType: params.reviewedType,
    from: params.from,
    to: params.to,
    reviewedAtFrom: params.reviewedAtFrom,
    reviewedAtTo: params.reviewedAtTo,
    isMain: params.isMain,
    slotIndex: params.slotIndex,
    auditStatus: params.auditStatus,
    includeAlreadyAudited: params.includeAlreadyAudited,
    includeSuspended: params.includeSuspended,
    includeBlacklisted: params.includeBlacklisted,
    hasReport: params.hasReport,
    validationDecision: params.validationDecision,
  };
}

function buildBlacklistHandoff(
  items: readonly ProfileImageAuditItem[],
): ProfileImageAuditBlacklistHandoff {
  const profileImageIds = items.map((item) => item.profileImageId);
  const imageUrls = items.map((item) => item.imageUrl);

  return {
    userId: items[0]?.userId ?? '',
    reason: BLACKLIST_HANDOFF_REASON,
    memo: [
      '프로필 이미지 감사에서 블랙리스트 검토로 전달됨',
      `profileImageIds: ${profileImageIds.join(', ')}`,
      `imageUrls: ${imageUrls.join(', ')}`,
    ].join('\n'),
    profileImageIds,
    imageUrls,
  };
}

export const profileImageAudit = {
  list: (params: ProfileImageAuditListParams = {}) =>
    adminGet<ProfileImageAuditListResponse>(BASE_PATH, toListQueryParams(params)),

  bulkMarkOk: (body: ProfileImageAuditBulkMarkOkRequest) =>
    adminPost<ProfileImageAuditBulkActionResponse>(
      `${BASE_PATH}/bulk-mark-ok`,
      body,
    ),

  bulkFlagSecondReview: (body: ProfileImageAuditBulkSecondReviewRequest) =>
    adminPost<ProfileImageAuditBulkActionResponse>(
      `${BASE_PATH}/bulk-flag-second-review`,
      body,
    ),

  bulkReject: (body: ProfileImageAuditBulkRejectRequest) =>
    adminPost<ProfileImageAuditBulkActionResponse>(
      `${BASE_PATH}/bulk-reject`,
      body,
    ),

  bulkDelete: (body: ProfileImageAuditBulkDeleteRequest) =>
    adminPost<ProfileImageAuditBulkActionResponse>(
      `${BASE_PATH}/bulk-delete`,
      body,
    ),

  buildBlacklistHandoff,
};
