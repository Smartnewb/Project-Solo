'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ImageOff, RefreshCw } from 'lucide-react';
import { ghostInjection } from '@/app/services/admin/ghost-injection';
import type { GhostPhotoItem } from '@/app/types/ghost-injection';
import { getAdminErrorMessage } from '@/shared/lib/http/admin-fetch';
import { useToast } from '@/shared/ui/admin/toast';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover';
import { ReasonInput, isReasonValid } from '../_shared/reason-input';
import { ghostInjectionKeys } from '../_shared/query-keys';

interface GhostPhotoSlotProps {
	ghostAccountId: string;
	slotIndex: number;
	photo?: GhostPhotoItem;
}

export function GhostPhotoSlot({ ghostAccountId, slotIndex, photo }: GhostPhotoSlotProps) {
	const toast = useToast();
	const queryClient = useQueryClient();
	const [open, setOpen] = useState(false);
	const [imageId, setImageId] = useState('');
	const [reason, setReason] = useState('');

	const mutation = useMutation({
		mutationFn: () =>
			ghostInjection.replaceGhostPhoto(ghostAccountId, slotIndex, {
				newImageId: imageId.trim(),
				reason: reason.trim(),
			}),
		onSuccess: () => {
			toast.success(`슬롯 ${slotIndex} 사진이 교체되었습니다.`);
			queryClient.invalidateQueries({
				queryKey: ghostInjectionKeys.ghostDetail(ghostAccountId),
			});
			queryClient.invalidateQueries({ queryKey: ghostInjectionKeys.ghosts() });
			setOpen(false);
			setImageId('');
			setReason('');
		},
		onError: (error) => toast.error(getAdminErrorMessage(error)),
	});

	const canSubmit =
		imageId.trim().length > 0 && isReasonValid(reason) && !mutation.isPending;

	return (
		<div className="space-y-2">
			<div className="relative aspect-square overflow-hidden rounded-md border bg-slate-100">
				{photo ? (
					// eslint-disable-next-line @next/next/no-img-element
					<img src={photo.url} alt={`슬롯 ${slotIndex}`} className="h-full w-full object-cover" />
				) : (
					<div className="flex h-full w-full items-center justify-center text-slate-400">
						<ImageOff className="h-6 w-6" />
					</div>
				)}
				<div className="absolute left-1 top-1 rounded bg-black/60 px-1.5 py-0.5 text-xs text-white">
					{slotIndex}
				</div>
			</div>

			<Popover open={open} onOpenChange={setOpen}>
				<PopoverTrigger asChild>
					<Button variant="outline" size="sm" className="w-full text-xs">
						<RefreshCw className="mr-1 h-3 w-3" /> 교체
					</Button>
				</PopoverTrigger>
				<PopoverContent className="w-80" align="start">
					<div className="space-y-3">
						<div>
							<Label className="text-xs">새 Image ID</Label>
							<Input
								value={imageId}
								onChange={(event) => setImageId(event.target.value)}
								placeholder="이미지 UUID 입력"
								className="h-8"
							/>
						</div>
						<ReasonInput value={reason} onChange={setReason} minLength={10} rows={2} />
						<div className="flex justify-end gap-2">
							<Button
								variant="outline"
								size="sm"
								onClick={() => setOpen(false)}
								disabled={mutation.isPending}
							>
								취소
							</Button>
							<Button size="sm" onClick={() => mutation.mutate()} disabled={!canSubmit}>
								{mutation.isPending ? '교체 중…' : '교체'}
							</Button>
						</div>
					</div>
				</PopoverContent>
			</Popover>
		</div>
	);
}
