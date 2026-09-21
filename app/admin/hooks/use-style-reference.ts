// app/admin/hooks/use-style-reference.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AdminService from '@/app/services/admin';
import type { CreateStyleReferenceRequest, StyleReferenceListParams } from '@/app/services/admin';

export const styleReferenceKeys = {
  all: ['admin', 'style-reference'] as const,
  list: (params: StyleReferenceListParams) =>
    [...styleReferenceKeys.all, 'list', params] as const,
  stats: () => [...styleReferenceKeys.all, 'stats'] as const,
};

export function useStyleReferenceList(params: StyleReferenceListParams = {}) {
  return useQuery({
    queryKey: styleReferenceKeys.list(params),
    queryFn: () => AdminService.styleReference.getList(params),
  });
}

export function useStyleReferenceStats() {
  return useQuery({
    queryKey: styleReferenceKeys.stats(),
    queryFn: () => AdminService.styleReference.getStats(),
  });
}

export function useCreateStyleReference() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateStyleReferenceRequest) =>
      AdminService.styleReference.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: styleReferenceKeys.all });
    },
  });
}

export function useBulkCreateStyleReference() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (items: CreateStyleReferenceRequest[]) =>
      AdminService.styleReference.bulkCreate(items),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: styleReferenceKeys.all });
    },
  });
}

export function useDeactivateStyleReference() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => AdminService.styleReference.deactivate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: styleReferenceKeys.all });
    },
  });
}

export function useReactivateStyleReference() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => AdminService.styleReference.reactivate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: styleReferenceKeys.all });
    },
  });
}
