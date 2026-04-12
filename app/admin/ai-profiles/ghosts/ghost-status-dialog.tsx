'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ghostInjection } from '@/app/services/admin/ghost-injection';
import type { GhostAccountStatus, GhostListItem } from '@/app/types/ghost-injection';
import { getAdminErrorMessage } from '@/shared/lib/http/admin-fetch';
import { useToast } from '@/shared/ui/admin/toast';
import { Button } from '@/shared/ui/button';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/shared/ui/dialog';
import { ReasonInput, isReasonValid } from '../_shared/reason-input';
import { ghostInjectionKeys } from '../_shared/query-keys';

interface GhostStatusDialogProps {
	ghost: GhostListItem | null;
	onClose: () => void;
}

export function GhostStatusDialog({ ghost, onClose }: GhostStatusDialogProps) {
	const toast = useToast();
	const queryClient = useQueryClient();
	const [reason, setReason] = useState('');

	useEffect(() => {
		if (ghost) setReason('');
	}, [ghost]);

	const nextStatus: GhostAccountStatus = ghost?.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';

	const mutation = useMutation({
		mutationFn: () => {
			if (!ghost) throw new Error('프로필 없음');
			return ghostInjection.toggleGhostStatus(ghost.ghostAccountId, {
				targetStatus: nextStatus,
				reason: reason.trim(),
			});
		},
		onSuccess: () => {
			toast.success(
				nextStatus === 'ACTIVE' ? '가상 프로필이 활성화되었습니다.' : '가상 프로필이 비활성화되었습니다.',
			);
			queryClient.invalidateQueries({ queryKey: ghostInjectionKeys.ghosts() });
			queryClient.invalidateQueries({ queryKey: ghostInjectionKeys.status() });
			onClose();
		},
		onError: (error) => toast.error(getAdminErrorMessage(error)),
	});

	const canSubmit = isReasonValid(reason) && !mutation.isPending;
	const actionLabel = nextStatus === 'ACTIVE' ? '활성화' : '비활성화';

	return (
		<Dialog open={Boolean(ghost)} onOpenChange={(open) => !open && onClose()}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>{actionLabel}하시겠어요?</DialogTitle>
					<DialogDescription>
						{ghost ? `"${ghost.name}" 가상 프로필을 ${nextStatus === 'ACTIVE' ? '활성' : '비활성'} 상태로 전환합니다.` : null}
					</DialogDescription>
				</DialogHeader>

				<ReasonInput value={reason} onChange={setReason} minLength={10} rows={3} />

				<DialogFooter>
					<Button variant="outline" onClick={onClose} disabled={mutation.isPending}>
						취소
					</Button>
					<Button onClick={() => mutation.mutate()} disabled={!canSubmit}>
						{mutation.isPending ? '처리 중…' : actionLabel}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
