import { adminGet } from '@/shared/lib/http/admin-fetch';

export type AdminAccessLogMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface AdminAccessLogItem {
  id: string;
  adminUserId: string;
  adminName: string | null;
  adminEmail: string | null;
  method: string;
  path: string;
  route: string | null;
  targetUserId: string | null;
  country: string | null;
  statusCode: number | null;
  ip: string | null;
  userAgent: string | null;
  query: Record<string, string> | null;
  createdAt: string;
}

export type AdminAccessLogListParams = {
  page?: number;
  limit?: number;
  adminUserId?: string;
  targetUserId?: string;
  method?: AdminAccessLogMethod;
  pathContains?: string;
  from?: string;
  to?: string;
};

export interface AdminAccessLogListResponse {
  items: AdminAccessLogItem[];
  total: number;
  page: number;
  limit: number;
}

export const accessLogs = {
  getList: async (params: AdminAccessLogListParams = {}): Promise<AdminAccessLogListResponse> => {
    const response = await adminGet<{ data: AdminAccessLogListResponse }>(
      '/admin/v2/access-logs',
      params,
    );
    return response.data;
  },
};
