import type {
  ProfileImageAuditBulkActionResponse,
  ProfileImageAuditItem,
  ProfileImageAuditListResponse,
} from '@/app/services/admin/profile-image-audit';

export const profileImageAuditItemFixture: ProfileImageAuditItem = {
  profileImageId: 'profile-image-1',
  imageId: 'image-1',
  imageUrl: 'https://cdn.example.com/profile-image-1.jpg',
  thumbnailUrl: 'https://cdn.example.com/profile-image-1-thumb.jpg',
  userId: 'user-1',
  profileId: 'profile-1',
  age: 24,
  gender: 'FEMALE',
  universityName: '서울대학교',
  slotIndex: 0,
  isMain: true,
  reviewStatus: 'approved',
  reviewedType: 'admin',
  reviewedAt: '2026-06-10T03:12:00.000Z',
  rejectionReason: null,
  auditStatus: 'unreviewed',
  auditReviewedAt: null,
  auditReviewedBy: null,
  auditDecisionReason: null,
  isBlacklisted: false,
  suspendedAt: null,
  approvedImageCount: 2,
  totalActiveImageCount: 3,
  hasReport: true,
  siblingImages: [
    {
      profileImageId: 'profile-image-1',
      imageId: 'image-1',
      imageUrl: 'https://cdn.example.com/profile-image-1.jpg',
      thumbnailUrl: 'https://cdn.example.com/profile-image-1-thumb.jpg',
      slotIndex: 0,
      isMain: true,
      reviewStatus: 'approved',
    },
    {
      profileImageId: 'profile-image-2',
      imageId: 'image-2',
      imageUrl: 'https://cdn.example.com/profile-image-2.jpg',
      thumbnailUrl: 'https://cdn.example.com/profile-image-2-thumb.jpg',
      slotIndex: 1,
      isMain: false,
      reviewStatus: 'approved',
    },
  ],
  validation: {
    totalScore: 88,
    autoDecision: 'approved',
    decisionReason: 'face_detected',
    createdAt: '2026-06-10T03:10:00.000Z',
  },
  riskSignals: {
    reportCount: 1,
    hasSuspensionHistory: false,
    isFirstReview: false,
    isUniversityVerified: true,
    hasPurchaseHistory: true,
  },
};

export const profileImageAuditListFixture: ProfileImageAuditListResponse = {
  data: [profileImageAuditItemFixture],
  meta: {
    page: 1,
    limit: 16,
    total: 1,
    totalPages: 1,
  },
};

export const profileImageAuditBulkActionFixture: ProfileImageAuditBulkActionResponse = {
  data: {
    requested: 1,
    succeeded: 1,
    failed: 0,
    results: [
      {
        profileImageId: 'profile-image-1',
        userId: 'user-1',
        status: 'success',
        message: 'ok',
      },
    ],
  },
};
