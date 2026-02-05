import axiosServer from '@/utils/axios';
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
} from './types';
import type { MatchingPoolStatsResponse, MatchingPoolCountry } from '@/types/admin';

const BASE_PATH = '/admin/scheduled-matching/config';

export const scheduledMatchingService = {
  getAllConfigs: async (): Promise<ScheduledMatchingConfig[]> => {
    const response = await axiosServer.get(BASE_PATH);
    return response.data;
  },

  getConfigByCountry: async (country: Country): Promise<ScheduledMatchingConfig> => {
    const response = await axiosServer.get(`${BASE_PATH}/${country}`);
    return response.data;
  },

  createConfig: async (
    data: CreateScheduledMatchingConfigRequest
  ): Promise<ScheduledMatchingConfig> => {
    const response = await axiosServer.post(BASE_PATH, data);
    return response.data;
  },

  updateConfig: async (
    country: Country,
    data: UpdateScheduledMatchingConfigRequest
  ): Promise<ScheduledMatchingConfig> => {
    const response = await axiosServer.patch(`${BASE_PATH}/${country}`, data);
    return response.data;
  },

  triggerManualExecution: async (country: Country): Promise<TriggerManualExecutionResponse> => {
    const response = await axiosServer.post(`${BASE_PATH}/trigger`, { country });
    return response.data;
  },

  getAllJobStatus: async (): Promise<JobStatus[]> => {
    const response = await axiosServer.get(`${BASE_PATH}/jobs/status`);
    return response.data;
  },

  getJobStatusByCountry: async (country: Country): Promise<JobStatus> => {
    const response = await axiosServer.get(`${BASE_PATH}/jobs/status/${country}`);
    return response.data;
  },

  getRunningBatches: async (): Promise<BatchHistory[]> => {
    const response = await axiosServer.get(`${BASE_PATH}/batches/running`);
    return response.data;
  },

  getBatchesByCountry: async (
    country: Country,
    limit = 20,
    offset = 0
  ): Promise<BatchHistory[]> => {
    const response = await axiosServer.get(`${BASE_PATH}/batches/${country}`, {
      params: { limit, offset },
    });
    return response.data;
  },

  getBatchDetails: async (
    batchId: string,
    limit = 100,
    offset = 0
  ): Promise<BatchDetailsWithStats> => {
    const response = await axiosServer.get(`${BASE_PATH}/batches/detail/${batchId}`, {
      params: { limit, offset },
    });
    return response.data;
  },

  cancelBatch: async (batchId: string): Promise<BatchHistory> => {
    const response = await axiosServer.post(`${BASE_PATH}/batches/${batchId}/cancel`);
    return response.data;
  },

  getMatchingPoolStats: async (
    country: MatchingPoolCountry,
    startDate?: string,
    endDate?: string
  ): Promise<MatchingPoolStatsResponse> => {
    const response = await axiosServer.get('/admin/stats/matching-pool', {
      params: { country, startDate, endDate },
    });
    return response.data;
  },

  // ==================== Manual Matching APIs ====================

  createManualMatching: async (data: ManualMatchingRequest): Promise<ManualMatching> => {
    const response = await axiosServer.post('/admin/matching/manual', data);
    return response.data.data;
  },

  validateManualMatching: async (userIds: string[]): Promise<ValidateMatchingResponse> => {
    const response = await axiosServer.post('/admin/matching/validate', { userIds });
    return response.data.data;
  },

  getManualMatchingList: async (
    params: ManualMatchingListParams = {}
  ): Promise<ManualMatchingListResponse> => {
    const response = await axiosServer.get('/admin/matching/manual', { params });
    return response.data;
  },

  getManualMatchingDetail: async (id: string): Promise<ManualMatching> => {
    const response = await axiosServer.get(`/admin/matching/manual/${id}`);
    return response.data.data;
  },

  cancelManualMatching: async (id: string, reason: string): Promise<ManualMatching> => {
    const response = await axiosServer.delete(`/admin/matching/manual/${id}`, {
      data: { reason },
    });
    return response.data.data;
  },

  executeManualMatching: async (id: string): Promise<ManualMatching> => {
    const response = await axiosServer.post(`/admin/matching/manual/${id}/execute`);
    return response.data.data;
  },
};

export default scheduledMatchingService;
