export type Country = 'KR' | 'JP';

export type BatchStatus = 'running' | 'completed' | 'failed' | 'cancelled';

export type DetailStatus = 'success' | 'no_candidates' | 'filter_exhausted' | 'error';

export interface ScheduledMatchingConfig {
  id: string;
  country: Country;
  cronExpression: string;
  timezone: string;
  isEnabled: boolean;
  batchSize: number;
  delayBetweenUsersMs: number;
  maxRetryCount: number;
  loginWindowDays: number;
  includeUnknownRank: boolean;
  description: string | null;
  lastModifiedBy: string | null;
  createdAt: string;
  updatedAt: string | null;
  nextExecutionTime: string | null;
}

export interface CreateScheduledMatchingConfigRequest {
  country: Country;
  cronExpression: string;
  timezone?: string;
  isEnabled?: boolean;
  batchSize?: number;
  delayBetweenUsersMs?: number;
  maxRetryCount?: number;
  loginWindowDays?: number;
  includeUnknownRank?: boolean;
  description?: string;
}

export interface UpdateScheduledMatchingConfigRequest {
  cronExpression?: string;
  timezone?: string;
  isEnabled?: boolean;
  batchSize?: number;
  delayBetweenUsersMs?: number;
  maxRetryCount?: number;
  loginWindowDays?: number;
  includeUnknownRank?: boolean;
  description?: string;
  lastModifiedBy?: string;
}

export interface JobStatus {
  country: Country;
  isRegistered: boolean;
  lastExecution: string | null;
  nextExecution: string | null;
}

export interface BatchHistory {
  id: string;
  configId: string;
  country: Country;
  status: BatchStatus;
  startedAt: string;
  completedAt: string | null;
  totalUsers: number;
  processedUsers: number;
  successCount: number;
  failureCount: number;
  errorMessage: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export interface CandidatePool {
  userId: string;
  score: number;
}

export interface BatchDetail {
  id: string;
  batchId: string;
  userId: string;
  partnerId: string | null;
  status: DetailStatus;
  candidatePool: CandidatePool[] | null;
  selectedScore: number | null;
  matchStory: string | null;
  processingTimeMs: number | null;
  errorMessage: string | null;
  createdAt: string;
}

export interface BatchDetailsWithStats {
  batch: BatchHistory;
  details: BatchDetail[];
  stats: {
    totalDetails: number;
    successCount: number;
    averageProcessingTimeMs: number;
  };
}

export interface TriggerManualExecutionResponse {
  success: boolean;
  message: string;
  country: Country;
  triggeredAt: string;
}

export interface CountryOverviewData {
  config: ScheduledMatchingConfig | null;
  jobStatus: JobStatus | null;
  lastBatch: BatchHistory | null;
}

// ==================== Manual Matching Types ====================

export type ManualMatchType = 'cs_support' | 'test' | 'promotion' | 'recovery' | 'vip' | 'other';

export type MatchPriority = 'low' | 'normal' | 'high' | 'urgent';

export type MatchingStatus = 'scheduled' | 'processing' | 'completed' | 'failed' | 'cancelled';

export type UserMatchingStatus = 'eligible' | 'already_matched' | 'blocked' | 'inactive';

export type AdminRole = 'super_admin' | 'admin' | 'cs_manager' | 'operator';

export interface ManualMatchingRequest {
  userIds: string[];
  scheduledAt: string;
  matchType: ManualMatchType;
  reason: string;
  skipValidation?: boolean;
  notifyUsers?: boolean;
  priority?: MatchPriority;
}

export interface MatchedUser {
  id: string;
  name: string;
  gender: 'MALE' | 'FEMALE';
  university: string;
  profileImageUrl: string | null;
  matchingStatus: UserMatchingStatus;
}

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
}

export interface ManualMatchingLog {
  timestamp: string;
  action: string;
  actor: string;
  details: string;
}

export interface ManualMatching {
  id: string;
  status: MatchingStatus;
  users: MatchedUser[];
  scheduledAt: string;
  executedAt?: string;
  matchType: ManualMatchType;
  reason: string;
  createdBy: AdminUser;
  createdAt: string;
  updatedAt?: string;
  cancelledAt?: string;
  cancelledBy?: { id: string; email: string };
  cancelReason?: string;
  chatRoomId?: string;
  logs?: ManualMatchingLog[];
}

export interface ManualMatchingListResponse {
  data: ManualMatching[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasNext: boolean;
  };
}

export interface ValidateUserResult {
  id: string;
  name: string;
  matchingStatus: UserMatchingStatus;
  warnings: string[];
}

export interface ValidateMatchingResponse {
  isValid: boolean;
  users: ValidateUserResult[];
  blockedReasons: string[];
}

export interface ManualMatchingListParams {
  status?: MatchingStatus;
  matchType?: ManualMatchType;
  createdBy?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}
