'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { ghostReferencePool } from '@/app/services/admin/ghost-reference-pool';
import type { GhostReferenceImage } from '@/app/types/ghost-injection';
import { getAdminErrorMessage } from '@/shared/lib/http/admin-fetch';
import { useToast } from '@/shared/ui/admin/toast';
import { Badge } from '@/shared/ui/badge';
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
import { referencePoolKeys } from '../_shared/query-keys';

interface DeactivateDialogProps {
	item: GhostReferenceImage | null;
	onClose: () => void;
}

export function DeactivateDialog({ item, onClose }: DeactivateDialogProps) {
	const toast = useToast();
	const queryClient = useQueryClient();
	const [reason, setReason] = useState('');

	useEffect(() => {
		if (item) setReason('');
	}, [item]);

	const mutation = useMutation({
		mutationFn: () => {
			if (!item) throw new Error('아이템 없음');
			return ghostReferencePool.deactivate(item.id, { reason: reason.trim() });
		},
		onSuccess: () => {
			toast.success('레퍼런스를 비활성화했습니다.');
			queryClient.invalidateQueries({ queryKey: referencePoolKeys.all });
			onClose();
		},
		onError: (error) => toast.error(getAdminErrorMessage(error)),
	});

	const open = item !== null;

	return (
		<Dialog open={open} onOpenChange={(v) => { if (!v && !mutation.isPending) onClose(); }}>
			<DialogContent className="max-w-md">
				<DialogHeader>
					<DialogTitle>레퍼런스 비활성화</DialogTitle>
					<DialogDescription>
						이 레퍼런스는 더 이상 Ghost 사진 생성에 사용되지 않습니다. (S3 파일은 보존됩니다)
					</DialogDescription>
				</DialogHeader>

				{item ? (
					<div className="flex gap-3 py-2">
						<div className="aspect-[3/4] w-24 shrink-0 overflow-hidden rounded-md border bg-slate-100">
							{/* eslint-disable-next-line @next/next/no-img-element */}
							<img
								src={item.s3Url}
								alt=""
								loading="lazy"
								decoding="async"
								className="h-full w-full object-cover"
							/>
						</div>
						<div className="flex flex-1 flex-col gap-1.5 text-xs text-slate-600">
							<div className="flex items-center gap-1.5">
								<Badge variant="outline" className="text-[10px]">
									{item.ageBucket}세
								</Badge>
								<span className="text-slate-400">×{item.usageCount} 사용</span>
							</div>
							<div className="text-[11px] text-slate-400">
								큐레이션: {new Date(item.curatedAt).toLocaleDateString('ko-KR')}
							</div>
						</div>
					</div>
				) : null}

				<ReasonInput
					value={reason}
					onChange={setReason}
					minLength={10}
					placeholder="예: 품질 저하, 동일 인물 중복 등"
				/>

				<DialogFooter>
					<Button variant="outline" onClick={onClose} disabled={mutation.isPending}>
						취소
					</Button>
					<Button
						variant="destructive"
						onClick={() => mutation.mutate()}
						disabled={!isReasonValid(reason, 10) || mutation.isPending}
					>
						{mutation.isPending ? (
							<>
								<Loader2 className="mr-1 h-4 w-4 animate-spin" /> 처리 중…
							</>
						) : (
							'비활성화'
						)}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
