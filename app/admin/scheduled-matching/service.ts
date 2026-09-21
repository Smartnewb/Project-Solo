import { adminGet, adminPost, adminPatch, adminRequest } from '@/shared/lib/http/admin-fetch';
import type {
  Country,
  ScheduledMatchingConfig,
  CreateScheduledMatchingConfigRequest,
  UpdateScheduledMatchingConfigRequest,
  JobStatus,
  BatchHistory,
  BatchDetailsWithStats,
  TriggerManualExecutionResponse,
  ManualMatchingRequest,
  ManualMatching,
  ManualMatchingListResponse,
  ManualMatchingListParams,
  ValidateMatchingResponse,
  ScheduleMatchingRequest,
  ScheduleMatchingResponse,
} from './types';
import type { MatchingPoolStatsResponse, MatchingPoolCountry } from '@/types/admin';

const BASE_PATH = '/admin/v2/scheduled-matching/config';

export const scheduledMatchingService = {
  getAllConfigs: async (): Promise<ScheduledMatchingConfig[]> => {
    return adminGet<ScheduledMatchingConfig[]>(BASE_PATH);
  },

  getConfigByCountry: async (country: Country): Promise<ScheduledMatchingConfig> => {
    return adminGet<ScheduledMatchingConfig>(`${BASE_PATH}/${country}`);
  },

  createConfig: async (
    data: CreateScheduledMatchingConfigRequest
  ): Promise<ScheduledMatchingConfig> => {
    return adminPost<ScheduledMatchingConfig>(BASE_PATH, data);
  },

  updateConfig: async (
    country: Country,
    data: UpdateScheduledMatchingConfigRequest
  ): Promise<ScheduledMatchingConfig> => {
    return adminPatch<ScheduledMatchingConfig>(`${BASE_PATH}/${country}`, data);
  },

  triggerManualExecution: async (country: Country): Promise<TriggerManualExecutionResponse> => {
    return adminPost<TriggerManualExecutionResponse>(`${BASE_PATH}/trigger`, { country });
  },

  getAllJobStatus: async (): Promise<JobStatus[]> => {
    return adminGet<JobStatus[]>(`${BASE_PATH}/jobs/status`);
  },

  getJobStatusByCountry: async (country: Country): Promise<JobStatus> => {
    return adminGet<JobStatus>(`${BASE_PATH}/jobs/status/${country}`);
  },

  getRunningBatches: async (): Promise<BatchHistory[]> => {
    return adminGet<BatchHistory[]>(`${BASE_PATH}/batches/running`);
  },

  getBatchesByCountry: async (
    country: Country,
    limit = 20,
    offset = 0
  ): Promise<BatchHistory[]> => {
    return adminGet<BatchHistory[]>(`${BASE_PATH}/batches/${country}`, {
      limit: String(limit),
      offset: String(offset),
    });
  },

  getBatchDetails: async (
    batchId: string,
    limit = 100,
    offset = 0
  ): Promise<BatchDetailsWithStats> => {
    return adminGet<BatchDetailsWithStats>(`${BASE_PATH}/batches/detail/${batchId}`, {
      limit: String(limit),
      offset: String(offset),
    });
  },

  cancelBatch: async (batchId: string): Promise<BatchHistory> => {
    return adminPost<BatchHistory>(`${BASE_PATH}/batches/${batchId}/cancel`);
  },

  getMatchingPoolStats: async (
    country: MatchingPoolCountry,
    startDate?: string,
    endDate?: string
  ): Promise<MatchingPoolStatsResponse> => {
    const params: Record<string, string> = { country };
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    return adminGet<MatchingPoolStatsResponse>('/admin/v2/stats/matching-pool', params);
  },

  createManualMatching: async (data: ManualMatchingRequest): Promise<ManualMatching> => {
    const response = await adminPost<{ data: ManualMatching }>('/admin/v2/matching/manual', data);
    return response.data;
  },

  validateManualMatching: async (userIds: string[]): Promise<ValidateMatchingResponse> => {
    const response = await adminPost<{ data: ValidateMatchingResponse }>('/admin/v2/matching/validate', { userIds });
    return response.data;
  },

  getManualMatchingList: async (
    params: ManualMatchingListParams = {}
  ): Promise<ManualMatchingListResponse> => {
    const queryParams: Record<string, string> = {};
    if (params.page) queryParams.page = String(params.page);
    if (params.limit) queryParams.limit = String(params.limit);
    if (params.status) queryParams.status = params.status;
    if (params.matchType) queryParams.type = params.matchType;
    else if (params.type) queryParams.type = params.type;
    return adminGet<ManualMatchingListResponse>('/admin/v2/matching/manual', queryParams);
  },

  getManualMatchingDetail: async (id: string): Promise<ManualMatching> => {
    const response = await adminGet<{ data: ManualMatching }>(`/admin/v2/matching/manual/${id}`);
    return response.data;
  },

  cancelManualMatching: async (id: string, reason: string): Promise<ManualMatching> => {
    const response = await adminRequest<{ data: ManualMatching }>(`/admin/v2/matching/manual/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason }),
    });
    return response.data;
  },

  executeManualMatching: async (id: string): Promise<ManualMatching> => {
    const response = await adminPost<{ data: ManualMatching }>(`/admin/v2/matching/manual/${id}/execute`);
    return response.data;
  },

  executeScheduleMatching: async (
    data: ScheduleMatchingRequest
  ): Promise<ScheduleMatchingResponse> => {
    return adminPost<ScheduleMatchingResponse>('/admin/v2/matching/schedule', data);
  },
};

export default scheduledMatchingService;
