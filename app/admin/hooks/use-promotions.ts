import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AdminService from '@/app/services/admin';
import type { CreatePromotionRequest, UpdatePromotionRequest } from '@/types/admin';

export const promotionKeys = {
  all: ['admin', 'promotions'] as const,
  list: () => [...promotionKeys.all, 'list'] as const,
  detail: (id: string) => [...promotionKeys.all, 'detail', id] as const,
};

export function usePromotionList() {
  return useQuery({
    queryKey: promotionKeys.list(),
    queryFn: () => AdminService.promotions.getList(),
  });
}

export function usePromotionDetail(id: string | null) {
  return useQuery({
    queryKey: promotionKeys.detail(id ?? ''),
    queryFn: () => AdminService.promotions.getOne(id!),
    enabled: !!id,
  });
}

export function useCreatePromotion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreatePromotionRequest) => AdminService.promotions.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: promotionKeys.list() });
    },
  });
}

export function useUpdatePromotion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePromotionRequest }) =>
      AdminService.promotions.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: promotionKeys.list() });
    },
  });
}

export function useTogglePromotionActive() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      AdminService.promotions.toggleActive(id, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: promotionKeys.list() });
    },
  });
}

export function useDeletePromotion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => AdminService.promotions.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: promotionKeys.list() });
    },
  });
}

export function useUploadPromotionImage() {
  return useMutation({
    mutationFn: (file: File) => AdminService.promotions.uploadImage(file),
  });
}

export function useDeletePromotionImage() {
  return useMutation({
    mutationFn: (s3Key: string) => AdminService.promotions.deleteImage(s3Key),
  });
}
