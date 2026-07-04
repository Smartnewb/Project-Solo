import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import AdminService from '@/app/services/admin';
import type {
  PixelCampusEpisodePayload,
  PixelCampusEpisodeStatus,
} from '@/types/admin';
import type { PixelCampusListParams } from '@/app/services/admin/pixel-campus';
import { useAdminSession } from '@/shared/contexts/admin-session-context';

export const pixelCampusKeys = {
  all: ['admin', 'pixel-campus'] as const,
  list: (filters: PixelCampusListParams, country: string) =>
    [...pixelCampusKeys.all, 'list', { ...filters, country }] as const,
  detail: (id: string | null, country: string) =>
    [...pixelCampusKeys.all, 'detail', { id, country }] as const,
  stats: (id: string | null, country: string) =>
    [...pixelCampusKeys.all, 'stats', { id, country }] as const,
};

function useSelectedCountry() {
  const { session } = useAdminSession();
  return session?.selectedCountry ?? 'kr';
}

export function usePixelCampusEpisodes(params: PixelCampusListParams = {}, enabled = true) {
  const country = useSelectedCountry();

  return useQuery({
    queryKey: pixelCampusKeys.list(params, country),
    queryFn: () => AdminService.pixelCampus.episodes.getList(params),
    enabled,
  });
}

export function usePixelCampusEpisode(id: string | null) {
  const country = useSelectedCountry();

  return useQuery({
    queryKey: pixelCampusKeys.detail(id, country),
    queryFn: () => AdminService.pixelCampus.episodes.getDetail(id as string),
    enabled: !!id,
  });
}

export function usePixelCampusEpisodeStats(id: string | null, enabled = true) {
  const country = useSelectedCountry();

  return useQuery({
    queryKey: pixelCampusKeys.stats(id, country),
    queryFn: () => AdminService.pixelCampus.episodes.getStats(id as string),
    enabled: enabled && !!id,
  });
}

export function useCreatePixelCampusEpisode() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: PixelCampusEpisodePayload) =>
      AdminService.pixelCampus.episodes.create(payload),
    onSuccess: (episode) => {
      queryClient.invalidateQueries({ queryKey: pixelCampusKeys.all });
      queryClient.invalidateQueries({ queryKey: [...pixelCampusKeys.all, 'detail', { id: episode.id }] });
    },
  });
}

export function useUpdatePixelCampusEpisode() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: PixelCampusEpisodePayload }) =>
      AdminService.pixelCampus.episodes.update(id, payload),
    onSuccess: (_episode, { id }) => {
      queryClient.invalidateQueries({ queryKey: pixelCampusKeys.all });
      queryClient.invalidateQueries({ queryKey: [...pixelCampusKeys.all, 'detail', { id }] });
    },
  });
}

export function useUpdatePixelCampusStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: { status: PixelCampusEpisodeStatus; publishAt?: string | null };
    }) => AdminService.pixelCampus.episodes.updateStatus(id, payload),
    onSuccess: (_episode, { id }) => {
      queryClient.invalidateQueries({ queryKey: pixelCampusKeys.all });
      queryClient.invalidateQueries({ queryKey: [...pixelCampusKeys.all, 'detail', { id }] });
      queryClient.invalidateQueries({ queryKey: [...pixelCampusKeys.all, 'stats', { id }] });
    },
  });
}

export function useUploadPixelCampusAsset() {
  return useMutation({
    mutationFn: (file: File) => AdminService.pixelCampus.assets.upload(file),
  });
}
