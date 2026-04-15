'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ghostInjection } from '@/app/services/admin/ghost-injection';
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
import { DEFAULT_VENDOR, DEFAULT_VENDOR_ID, findVendorOption } from '../_shared/ghost-vendor-options';
import { ReasonInput, isReasonValid } from '../_shared/reason-input';
import { ghostInjectionKeys } from '../_shared/query-keys';
import { VendorRadioGroup } from '../_shared/vendor-radio-group';

interface GhostCreateDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}



export function GhostCreateDialog({ open, onOpenChange }: GhostCreateDialogProps) {
	const toast = useToast();
	const queryClient = useQueryClient();
	const [reason, setReason] = useState('');
	const [vendorId, setVendorId] = useState(DEFAULT_VENDOR_ID);

	useEffect(() => {
		if (open) {
			setReason('');
			setVendorId(DEFAULT_VENDOR_ID);
		}
	}, [open]);

	const mutation = useMutation({
		mutationFn: () => {
			const vendor = findVendorOption(vendorId)?.value ?? DEFAULT_VENDOR;
			return ghostInjection.createGhost({ reason: reason.trim(), vendor });
		},
		onSuccess: () => {
			toast.success('가상 프로필이 생성되었습니다.');
			queryClient.invalidateQueries({ queryKey: ghostInjectionKeys.ghosts() });
			queryClient.invalidateQueries({ queryKey: ghostInjectionKeys.status() });
			onOpenChange(false);
		},
		onError: (error) => toast.error(getAdminErrorMessage(error)),
	});

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-lg">
				<DialogHeader>
					<DialogTitle>가상 프로필 생성</DialogTitle>
					<DialogDescription>
						랜덤 프로필이 자동 생성됩니다. 이름, 나이, MBTI, 학교, 사진이 모두 자동으로 배정됩니다.
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-4 py-2">
					<ReasonInput value={reason} onChange={setReason} minLength={10} />
					<VendorRadioGroup selectedId={vendorId} onChange={setVendorId} />
				</div>

				<DialogFooter>
					<Button variant="outline" onClick={() => onOpenChange(false)} disabled={mutation.isPending}>
						취소
					</Button>
					<Button
						onClick={() => mutation.mutate()}
						disabled={!isReasonValid(reason) || mutation.isPending}
					>
						{mutation.isPending ? '생성 중…' : '생성'}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
