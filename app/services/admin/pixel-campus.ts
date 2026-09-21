import { adminGet, adminPatch, adminPost, adminPut, adminUpload } from '@/shared/lib/http/admin-fetch';
import type {
  PixelCampusEpisode,
  PixelCampusEpisodeListResponse,
  PixelCampusEpisodePayload,
  PixelCampusEpisodeStats,
  PixelCampusEpisodeStatsChoice,
  PixelCampusEpisodeStatus,
  UploadImageResponse,
} from '@/types/admin';

const BASE_PATH = '/admin/v2/pixel-campus';

interface ApiListResponse {
  data: PixelCampusEpisode[];
  meta?: {
    total?: number;
    totalItems?: number;
    page?: number;
    currentPage?: number;
    limit?: number;
    itemsPerPage?: number;
  };
}

type ApiDataResponse<T> = { data: T };

export interface PixelCampusListParams {
  status?: PixelCampusEpisodeStatus | 'all';
  page?: number;
  limit?: number;
}

export const pixelCampus = {
  episodes: {
    getList: async (
      params: PixelCampusListParams = {},
    ): Promise<PixelCampusEpisodeListResponse> => {
      const page = params.page ?? 1;
      const limit = params.limit ?? 20;
      const status = params.status && params.status !== 'all' ? params.status : undefined;
      const res = await adminGet<ApiListResponse>(`${BASE_PATH}/episodes`, {
        page,
        limit,
        status,
      });

      return {
        items: res.data,
        total: res.meta?.total ?? res.meta?.totalItems ?? res.data.length,
        page: res.meta?.page ?? res.meta?.currentPage ?? page,
        limit: res.meta?.limit ?? res.meta?.itemsPerPage ?? limit,
      };
    },

    getDetail: async (id: string): Promise<PixelCampusEpisode> => {
      const res = await adminGet<ApiDataResponse<PixelCampusEpisode>>(`${BASE_PATH}/episodes/${id}`);
      return res.data;
    },

    create: async (payload: PixelCampusEpisodePayload): Promise<PixelCampusEpisode> => {
      const res = await adminPost<ApiDataResponse<PixelCampusEpisode>>(`${BASE_PATH}/episodes`, payload);
      return res.data;
    },

    update: async (
      id: string,
      payload: PixelCampusEpisodePayload,
    ): Promise<PixelCampusEpisode> => {
      const res = await adminPut<ApiDataResponse<PixelCampusEpisode>>(`${BASE_PATH}/episodes/${id}`, payload);
      return res.data;
    },

    updateStatus: async (
      id: string,
      payload: { status: PixelCampusEpisodeStatus; publishAt?: string | null },
    ): Promise<PixelCampusEpisode> => {
      const res = await adminPatch<ApiDataResponse<PixelCampusEpisode>>(
        `${BASE_PATH}/episodes/${id}/status`,
        payload,
      );
      return res.data;
    },

    getStats: async (id: string): Promise<PixelCampusEpisodeStats> => {
      const res = await adminGet<ApiDataResponse<PixelCampusEpisodeStatsChoice[] | PixelCampusEpisodeStats>>(
        `${BASE_PATH}/episodes/${id}/stats`,
      );
      return Array.isArray(res.data) ? { choices: res.data } : res.data;
    },
  },

  assets: {
    upload: async (file: File): Promise<UploadImageResponse> => {
      const formData = new FormData();
      formData.append('file', file);
      const res = await adminUpload<ApiDataResponse<UploadImageResponse>>(
        `${BASE_PATH}/assets/upload`,
        formData,
      );
      return res.data;
    },
  },
};
