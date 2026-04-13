export type ReviewInboxBucket = 'approval' | 'judgment' | 'done';

export type PendingReviewInboxBucket = Exclude<ReviewInboxBucket, 'done'>;

export type ReviewInboxSourceKind = 'profile_report' | 'community_report' | 'support_chat';

export type ReviewInboxEvidenceType = 'image' | 'text' | 'history';

export type ReviewInboxActionTone = 'primary' | 'neutral' | 'danger';

export interface ReviewInboxEvidence {
  id: string;
  type: ReviewInboxEvidenceType;
  label: string;
}

export interface ReviewInboxAction {
  id: string;
  label: string;
  tone: ReviewInboxActionTone;
  href: string;
}

export interface ReviewInboxItem {
  id: string;
  sourceKind: ReviewInboxSourceKind;
  sourceId: string;
  sourceStatus: string;
  bucket: PendingReviewInboxBucket;
  title: string;
  source: string;
  recommendation: string;
  why: string;
  summary: string;
  createdAt: string;
  evidence: ReviewInboxEvidence[];
  actions: ReviewInboxAction[];
}

export interface ReviewInboxBucketData {
  total: number;
  items: ReviewInboxItem[];
}

export interface ReviewInboxSummaryCounts {
  approval: number;
  judgment: number;
  done: number;
}

export interface ReviewInboxResponse {
  summary: ReviewInboxSummaryCounts;
  buckets: Record<PendingReviewInboxBucket, ReviewInboxBucketData>;
  generatedAt: string;
  warnings: string[];
}
