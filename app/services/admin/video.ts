import {
  adminDelete,
  adminGet,
  adminPatch,
  adminPost,
} from '@/shared/lib/http/admin-fetch';
import type {
  AdminVideoItem,
  AdminVideoListResponse,
  BulkCreateVideoRequest,
  BulkCreateVideoResponse,
  CreateVideoRequest,
  UpdateVideoRequest,
  VideoPreviewResponse,
  VideoStatus,
} from '@/types/admin';

interface CreateVideoApiResponse {
  id: string;
  status: VideoStatus;
  video: AdminVideoItem['video'];
}

// 커뮤니티 영상 링크(릴스) 운영자 어드민. BE: admin/v2/content/videos
export const videos = {
  getList: async (
    params: { page?: number; limit?: number; status?: VideoStatus } = {},
  ): Promise<AdminVideoListResponse> => {
    const page = params.page ?? 1;
    const limit = params.limit ?? 20;
    const query: Record<string, string> = {
      page: String(page),
      limit: String(limit),
    };
    if (params.status) query.status = params.status;
    const res = await adminGet<{
      data: AdminVideoItem[];
      meta: { total: number; page: number; limit: number };
    }>('/admin/v2/content/videos', query);
    return {
      items: res.data,
      total: res.meta.total,
      page: res.meta.page,
      limit: res.meta.limit,
    };
  },

  getDetail: async (id: string): Promise<AdminVideoItem> => {
    const res = await adminGet<{ data: AdminVideoItem }>(`/admin/v2/content/videos/${id}`);
    return res.data;
  },

  // URL oEmbed 메타 미리보기 (저장 안 함). 실패 시 throw (No silent fallback).
  preview: async (url: string): Promise<VideoPreviewResponse> => {
    const res = await adminPost<{ data: VideoPreviewResponse }>(
      '/admin/v2/content/videos/preview',
      { url },
    );
    return res.data;
  },

  create: async (data: CreateVideoRequest): Promise<CreateVideoApiResponse> => {
    const res = await adminPost<{ data: CreateVideoApiResponse }>(
      '/admin/v2/content/videos',
      data,
    );
    return res.data;
  },

  update: async (id: string, data: UpdateVideoRequest): Promise<AdminVideoItem> => {
    const res = await adminPatch<{ data: AdminVideoItem }>(
      `/admin/v2/content/videos/${id}`,
      data,
    );
    return res.data;
  },

  publish: async (id: string): Promise<{ success: boolean; message: string }> => {
    const res = await adminPost<{ data: { success: boolean; message: string } }>(
      `/admin/v2/content/videos/${id}/publish`,
      {},
    );
    return res.data;
  },

  delete: async (id: string): Promise<void> => {
    await adminDelete(`/admin/v2/content/videos/${id}`);
  },

  bulkCreate: async (data: BulkCreateVideoRequest): Promise<BulkCreateVideoResponse> => {
    const res = await adminPost<{ data: BulkCreateVideoResponse }>(
      '/admin/v2/content/videos/bulk',
      data,
    );
    return res.data;
  },
};
