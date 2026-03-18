// app/services/admin/style-reference.ts
import axiosServer from '@/utils/axios';

export interface StyleReferenceItem {
  id: string;
  imageUrl: string;
  thumbnailUrl: string | null;
  tags: string[];
  category: 'VIBE' | 'FASHION' | 'COLOR_TONE';
  gender: 'MALE' | 'FEMALE';
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
}

export interface StyleReferenceListResponse {
  items: StyleReferenceItem[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface StyleReferenceStatsItem {
  gender: 'MALE' | 'FEMALE';
  category: 'VIBE' | 'FASHION' | 'COLOR_TONE';
  count: number;
  activeCount: number;
}

export interface StyleReferenceStats {
  stats: StyleReferenceStatsItem[];
}

export interface CreateStyleReferenceRequest {
  imageUrl: string;
  thumbnailUrl?: string;
  tags?: string[];
  category: 'VIBE' | 'FASHION' | 'COLOR_TONE';
  gender: 'MALE' | 'FEMALE';
  sortOrder?: number;
}

export interface BulkCreateResult {
  created: number;
  analyzed: number;
  errors: string[];
}

export interface StyleReferenceListParams {
  page?: number;
  pageSize?: number;
  gender?: 'MALE' | 'FEMALE';
  category?: 'VIBE' | 'FASHION' | 'COLOR_TONE';
}

export const styleReference = {
  getList: async (params: StyleReferenceListParams = {}): Promise<StyleReferenceListResponse> => {
    const response = await axiosServer.get('/v4/admin/style-reference', { params });
    return response.data;
  },

  create: async (data: CreateStyleReferenceRequest): Promise<StyleReferenceItem> => {
    const response = await axiosServer.post('/v4/admin/style-reference', data);
    return response.data;
  },

  bulkCreate: async (items: CreateStyleReferenceRequest[]): Promise<BulkCreateResult> => {
    const response = await axiosServer.post('/v4/admin/style-reference/bulk', { items });
    return response.data;
  },

  deactivate: async (id: string): Promise<{ success: boolean }> => {
    const response = await axiosServer.delete(`/v4/admin/style-reference/${id}`);
    return response.data;
  },

  reactivate: async (id: string): Promise<{ success: boolean }> => {
    const response = await axiosServer.post(`/v4/admin/style-reference/${id}/reactivate`);
    return response.data;
  },

  getStats: async (): Promise<StyleReferenceStats> => {
    const response = await axiosServer.get('/v4/admin/style-reference/stats');
    return response.data;
  },
};
