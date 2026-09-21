import { adminGet, adminPost, adminPatch, adminDelete, adminRequest } from '@/shared/lib/http/admin-fetch';
import type {
  Promotion,
  PromotionImageUploadResponse,
  CreatePromotionRequest,
  UpdatePromotionRequest,
} from '@/types/admin';

type AdminDataResponse<T> = T | { data: T };

function unwrapAdminData<T>(response: AdminDataResponse<T>): T {
  if (response && typeof response === 'object' && 'data' in response) {
    return response.data;
  }
  return response;
}

function unwrapAdminList<T>(response: AdminDataResponse<T[]> | undefined): T[] {
  const data = response === undefined ? undefined : unwrapAdminData(response);
  return Array.isArray(data) ? data : [];
}

export const promotions = {
  uploadImage: async (file: File): Promise<PromotionImageUploadResponse> => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await adminRequest<AdminDataResponse<PromotionImageUploadResponse>>(
        '/v1/admin/promotions/images',
        { method: 'POST', body: formData },
      );
      return unwrapAdminData(res);
    } catch (error: unknown) {
      throw error;
    }
  },

  deleteImage: async (s3Key: string): Promise<void> => {
    try {
      await adminDelete('/v1/admin/promotions/images', { s3Key });
    } catch (error: unknown) {
      throw error;
    }
  },

  getList: async (): Promise<Promotion[]> => {
    try {
      const res = await adminGet<AdminDataResponse<Promotion[]>>('/v1/admin/promotions');
      return unwrapAdminList(res);
    } catch (error: unknown) {
      throw error;
    }
  },

  getOne: async (id: string): Promise<Promotion> => {
    try {
      const res = await adminGet<AdminDataResponse<Promotion>>(`/v1/admin/promotions/${id}`);
      return unwrapAdminData(res);
    } catch (error: unknown) {
      throw error;
    }
  },

  create: async (data: CreatePromotionRequest): Promise<Promotion> => {
    try {
      const res = await adminPost<AdminDataResponse<Promotion>>('/v1/admin/promotions', data);
      return unwrapAdminData(res);
    } catch (error: unknown) {
      throw error;
    }
  },

  update: async (id: string, data: UpdatePromotionRequest): Promise<Promotion> => {
    try {
      const res = await adminPatch<AdminDataResponse<Promotion>>(`/v1/admin/promotions/${id}`, data);
      return unwrapAdminData(res);
    } catch (error: unknown) {
      throw error;
    }
  },

  toggleActive: async (id: string, isActive: boolean): Promise<Promotion> => {
    try {
      const res = await adminPatch<AdminDataResponse<Promotion>>(`/v1/admin/promotions/${id}/active`, { isActive });
      return unwrapAdminData(res);
    } catch (error: unknown) {
      throw error;
    }
  },

  remove: async (id: string): Promise<void> => {
    try {
      await adminDelete(`/v1/admin/promotions/${id}`);
    } catch (error: unknown) {
      throw error;
    }
  },
};
