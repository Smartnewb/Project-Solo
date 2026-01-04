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
  description?: string;
}

export interface UpdateScheduledMatchingConfigRequest {
  cronExpression?: string;
  timezone?: string;
  isEnabled?: boolean;
  batchSize?: number;
  delayBetweenUsersMs?: number;
  maxRetryCount?: number;
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
