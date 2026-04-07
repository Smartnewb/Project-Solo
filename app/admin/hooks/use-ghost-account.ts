import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ghostAccount } from '@/app/services/admin/ghost-account';
import type { GhostAccountStatus } from '@/types/ghost-account';

export const ghostAccountKeys = {
	all: ['admin', 'ghostAccount'] as const,
	stats: () => [...ghostAccountKeys.all, 'stats'] as const,
	pool: () => [...ghostAccountKeys.all, 'pool'] as const,
	eligibleSources: () => [...ghostAccountKeys.all, 'eligibleSources'] as const,
	candidates: () => [...ghostAccountKeys.all, 'candidates'] as const,
};

export function useGhostAccountStats() {
	return useQuery({
		queryKey: ghostAccountKeys.stats(),
		queryFn: () => ghostAccount.getStats(),
	});
}

export function useGhostAccountPool(params: {
	status?: GhostAccountStatus;
	page?: number;
	limit?: number;
}) {
	return useQuery({
		queryKey: [...ghostAccountKeys.pool(), params],
		queryFn: () => ghostAccount.getPool(params),
	});
}

export function useGhostAccountEligibleSources(params: {
	page?: number;
	limit?: number;
}) {
	return useQuery({
		queryKey: [...ghostAccountKeys.eligibleSources(), params],
		queryFn: () => ghostAccount.getEligibleSources(params),
	});
}

export function useGhostAccountCandidates(params: {
	page?: number;
	limit?: number;
}) {
	return useQuery({
		queryKey: [...ghostAccountKeys.candidates(), params],
		queryFn: () => ghostAccount.getCandidates(params),
	});
}

export function useCreateGhostAccount() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (originalUserId: string) => ghostAccount.create(originalUserId),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ghostAccountKeys.eligibleSources() });
			qc.invalidateQueries({ queryKey: ghostAccountKeys.pool() });
			qc.invalidateQueries({ queryKey: ghostAccountKeys.stats() });
		},
	});
}

export function useUpdateGhostAccountStatus() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({ id, status }: { id: string; status: GhostAccountStatus }) =>
			ghostAccount.updateStatus(id, status),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ghostAccountKeys.pool() });
			qc.invalidateQueries({ queryKey: ghostAccountKeys.stats() });
		},
	});
}

export function useApproveCandidates() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (candidateIds: string[]) => ghostAccount.approveCandidates(candidateIds),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ghostAccountKeys.candidates() });
		},
	});
}

export function useCancelCandidates() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (candidateIds: string[]) => ghostAccount.cancelCandidates(candidateIds),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ghostAccountKeys.candidates() });
		},
	});
}
