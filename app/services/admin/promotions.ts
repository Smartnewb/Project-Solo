import { adminGet, adminPost, adminPatch, adminDelete, adminRequest } from '@/shared/lib/http/admin-fetch';
import type {
  Promotion,
  PromotionImageUploadResponse,
  CreatePromotionRequest,
  UpdatePromotionRequest,
} from '@/types/admin';

export const promotions = {
  uploadImage: async (file: File): Promise<PromotionImageUploadResponse> => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await adminRequest<{ data: PromotionImageUploadResponse }>(
        '/v1/admin/promotions/images',
        { method: 'POST', body: formData },
      );
      return res.data;
    } catch (error: any) {
      throw error;
    }
  },

  deleteImage: async (s3Key: string): Promise<void> => {
    try {
      await adminDelete('/v1/admin/promotions/images', { s3Key });
    } catch (error: any) {
      throw error;
    }
  },

  getList: async (): Promise<Promotion[]> => {
    try {
      const res = await adminGet<{ data: Promotion[] }>('/v1/admin/promotions');
      return res.data;
    } catch (error: any) {
      throw error;
    }
  },

  getOne: async (id: string): Promise<Promotion> => {
    try {
      const res = await adminGet<{ data: Promotion }>(`/v1/admin/promotions/${id}`);
      return res.data;
    } catch (error: any) {
      throw error;
    }
  },

  create: async (data: CreatePromotionRequest): Promise<Promotion> => {
    try {
      const res = await adminPost<{ data: Promotion }>('/v1/admin/promotions', data);
      return res.data;
    } catch (error: any) {
      throw error;
    }
  },

  update: async (id: string, data: UpdatePromotionRequest): Promise<Promotion> => {
    try {
      const res = await adminPatch<{ data: Promotion }>(`/v1/admin/promotions/${id}`, data);
      return res.data;
    } catch (error: any) {
      throw error;
    }
  },

  toggleActive: async (id: string, isActive: boolean): Promise<Promotion> => {
    try {
      const res = await adminPatch<{ data: Promotion }>(`/v1/admin/promotions/${id}/active`, { isActive });
      return res.data;
    } catch (error: any) {
      throw error;
    }
  },

  remove: async (id: string): Promise<void> => {
    try {
      await adminDelete(`/v1/admin/promotions/${id}`);
    } catch (error: any) {
      throw error;
    }
  },
};
