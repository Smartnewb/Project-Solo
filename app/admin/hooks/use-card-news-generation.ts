import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import AdminService from '@/app/services/admin';
import { contentKeys } from './use-content';

export const generationKeys = {
  all: ['admin', 'card-news-generation'] as const,
  queueStats: () => [...generationKeys.all, 'queue-stats'] as const,
  job: (jobId: string) => [...generationKeys.all, 'job', jobId] as const,
};

export function useQueueStats(refetchMs = 5000) {
  return useQuery({
    queryKey: generationKeys.queueStats(),
    queryFn: () => AdminService.cardNewsGeneration.queueStats(),
    refetchInterval: refetchMs,
  });
}

export function useJobStatus(jobId: string | null, refetchMs = 2000) {
  return useQuery({
    queryKey: generationKeys.job(jobId ?? ''),
    queryFn: () => AdminService.cardNewsGeneration.status(jobId!),
    enabled: !!jobId,
    refetchInterval: refetchMs,
  });
}

export function useGenerate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (topic: string) => AdminService.cardNewsGeneration.generate(topic),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: generationKeys.queueStats() });
      qc.invalidateQueries({ queryKey: contentKeys.cardNews() });
    },
  });
}

export function usePreview() {
  return useMutation({
    mutationFn: (topic: string) => AdminService.cardNewsGeneration.preview(topic),
  });
}
