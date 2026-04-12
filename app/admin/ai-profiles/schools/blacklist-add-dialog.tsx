'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ghostInjection } from '@/app/services/admin/ghost-injection';
import { AdminApiError } from '@/shared/lib/http/admin-fetch';
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
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { ReasonInput, isReasonValid } from '../_shared/reason-input';
import { ghostInjectionKeys } from '../_shared/query-keys';

interface BlacklistAddDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function BlacklistAddDialog({ open, onOpenChange }: BlacklistAddDialogProps) {
	const toast = useToast();
	const queryClient = useQueryClient();
	const [schoolId, setSchoolId] = useState('');
	const [schoolName, setSchoolName] = useState('');
	const [reason, setReason] = useState('');

	useEffect(() => {
		if (open) {
			setSchoolId('');
			setSchoolName('');
			setReason('');
		}
	}, [open]);

	const mutation = useMutation({
		mutationFn: () =>
			ghostInjection.addBlacklist({
				schoolId: schoolId.trim(),
				schoolName: schoolName.trim(),
				reason: reason.trim(),
			}),
		onSuccess: () => {
			toast.success('블랙리스트에 추가되었습니다.');
			queryClient.invalidateQueries({ queryKey: ghostInjectionKeys.blacklist() });
			onOpenChange(false);
		},
		onError: (error) => {
			const msg =
				error instanceof AdminApiError
					? ((error.body as { message?: string } | null)?.message ?? error.message)
					: error instanceof Error
					  ? error.message
					  : '요청 실패';
			toast.error(msg);
		},
	});

	const canSubmit =
		schoolId.trim().length > 0 &&
		schoolName.trim().length >= 2 &&
		isReasonValid(reason) &&
		!mutation.isPending;

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>블랙리스트 추가</DialogTitle>
					<DialogDescription>
						해당 학교에는 즉시 가상 프로필 노출이 차단됩니다.
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-4 py-2">
					<div className="space-y-1">
						<Label htmlFor="blacklist-school-id">학교 ID *</Label>
						<Input
							id="blacklist-school-id"
							value={schoolId}
							onChange={(event) => setSchoolId(event.target.value)}
							placeholder="UUID 형식"
						/>
					</div>
					<div className="space-y-1">
						<Label htmlFor="blacklist-school-name">학교명 *</Label>
						<Input
							id="blacklist-school-name"
							value={schoolName}
							onChange={(event) => setSchoolName(event.target.value)}
							placeholder="예: 한양대학교"
						/>
					</div>
					<ReasonInput value={reason} onChange={setReason} minLength={10} />
				</div>

				<DialogFooter>
					<Button variant="outline" onClick={() => onOpenChange(false)} disabled={mutation.isPending}>
						취소
					</Button>
					<Button onClick={() => mutation.mutate()} disabled={!canSubmit}>
						{mutation.isPending ? '추가 중…' : '추가'}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
