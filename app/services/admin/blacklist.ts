import {
  adminGet,
  adminPost,
  adminDelete,
  type AdminQueryParams,
} from '@/shared/lib/http/admin-fetch';

export interface BlacklistItem {
  blacklistId: string;
  userId: string;
  name: string;
  phoneNumber: string;
  reason: string;
  memo: string | null;
  blacklistedBy: string;
  blacklistedAt: string;
}

export interface BlacklistHistoryEntry {
  id: string;
  userId: string;
  reason: string;
  memo: string | null;
  blacklistedBy: string;
  blacklistedAt: string;
  releasedAt: string | null;
  releasedBy: string | null;
  releaseReason: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface BlacklistRegisterRequest {
  reason: string;
  memo?: string;
}

export interface BlacklistReleaseRequest {
  releaseReason?: string;
}

export interface BlacklistRegisterResponse {
  success: boolean;
  userId: string;
  blacklist: {
    id: string;
    reason: string;
    blacklistedAt: string;
    blacklistedBy: string;
  };
}

export interface BlacklistReleaseResponse {
  success: boolean;
  userId: string;
  message: string;
}

export interface BlacklistListParams {
  page?: number;
  limit?: number;
  search?: string;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const BASE = '/admin/v2/users';

export const blacklist = {
  getList: (params: BlacklistListParams) =>
    adminGet<{ data: BlacklistItem[]; meta: PaginationMeta }>(
      `${BASE}/blacklist`,
      params as AdminQueryParams,
    ),

  register: (userId: string, body: BlacklistRegisterRequest) =>
    adminPost<{ data: BlacklistRegisterResponse }>(
      `${BASE}/${userId}/blacklist`,
      body,
    ),

  release: (userId: string, body?: BlacklistReleaseRequest) =>
    adminDelete<{ data: BlacklistReleaseResponse }>(
      `${BASE}/${userId}/blacklist`,
      body ?? {},
    ),

  getHistory: (userId: string) =>
    adminGet<{ data: { userId: string; history: BlacklistHistoryEntry[] } }>(
      `${BASE}/${userId}/blacklist/history`,
    ),
};

export interface UsersStatsResponse {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  suspended: number;
  deleted: number;
  blacklisted: number;
}

export const usersStats = {
  get: () => adminGet<{ data: UsersStatsResponse }>(`${BASE}/stats`),
};
