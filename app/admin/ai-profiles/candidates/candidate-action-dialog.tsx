'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ghostInjection } from '@/app/services/admin/ghost-injection';
import { getAdminErrorMessage } from '@/shared/lib/http/admin-fetch';
import { useConfirm } from '@/shared/ui/admin/confirm-dialog';
import { useToast } from '@/shared/ui/admin/toast';
import { Alert, AlertDescription } from '@/shared/ui/alert';
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

export type CandidateAction = 'approve' | 'cancel';

interface CandidateActionDialogProps {
	open: boolean;
	action: CandidateAction;
	candidateIds: string[];
	onClose: () => void;
}

interface ActionConfig {
	title: string;
	description: string;
	confirmTitle: string;
	confirmMessage: (count: number) => string;
	confirmSeverity: 'info' | 'warning' | 'error';
	confirmText: string;
	successMessage: string;
	submitLabel: string;
	submitVariant: 'default' | 'destructive';
}

const ACTION_CONFIG: Record<CandidateAction, ActionConfig> = {
	approve: {
		title: '후보 승인',
		description: '선택한 후보를 승인하고 발송 큐에 등록합니다.',
		confirmTitle: '선택한 후보를 승인할까요?',
		confirmMessage: (count) => `${count}건의 후보가 발송 큐에 등록됩니다.`,
		confirmSeverity: 'info',
		confirmText: '승인 및 큐 등록',
		successMessage: '선택한 후보를 승인하고 발송 큐에 등록했습니다.',
		submitLabel: '승인 및 큐 등록',
		submitVariant: 'default',
	},
	cancel: {
		title: '후보 취소',
		description: '선택한 후보를 취소합니다.',
		confirmTitle: '선택한 후보를 취소할까요?',
		confirmMessage: (count) => `${count}건의 후보가 취소 처리됩니다.`,
		confirmSeverity: 'error',
		confirmText: '후보 취소',
		successMessage: '선택한 후보를 취소했습니다.',
		submitLabel: '후보 취소',
		submitVariant: 'destructive',
	},
};

export function CandidateActionDialog({
	open,
	action,
	candidateIds,
	onClose,
}: CandidateActionDialogProps) {
	const toast = useToast();
	const confirm = useConfirm();
	const queryClient = useQueryClient();
	const [reason, setReason] = useState('');
	const config = ACTION_CONFIG[action];
	const count = candidateIds.length;

	useEffect(() => {
		if (!open) setReason('');
	}, [open]);

	const mutation = useMutation({
		mutationFn: () => {
			const body = { candidateIds, reason: reason.trim() };
			return action === 'approve'
				? ghostInjection.approveCandidates(body)
				: ghostInjection.cancelCandidates(body);
		},
		onSuccess: () => {
			toast.success(config.successMessage);
			queryClient.invalidateQueries({ queryKey: ghostInjectionKeys.candidates() });
			queryClient.invalidateQueries({ queryKey: ghostInjectionKeys.status() });
			setReason('');
			onClose();
		},
		onError: (error) => toast.error(getAdminErrorMessage(error)),
	});

	const handleSubmit = async () => {
		if (count === 0) {
			toast.error('선택한 후보가 없습니다.');
			return;
		}
		if (!isReasonValid(reason)) {
			toast.error('사유를 10자 이상 입력해주세요.');
			return;
		}
		const ok = await confirm({
			title: config.confirmTitle,
			message: config.confirmMessage(count),
			severity: config.confirmSeverity,
			confirmText: config.confirmText,
		});
		if (!ok) return;
		mutation.mutate();
	};

	return (
		<Dialog
			open={open}
			onOpenChange={(next) => {
				if (!next) onClose();
			}}
		>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>{config.title}</DialogTitle>
					<DialogDescription>{config.description}</DialogDescription>
				</DialogHeader>

				<Alert>
					<AlertDescription>
						선택 <strong>{count}</strong>건
					</AlertDescription>
				</Alert>

				<ReasonInput
					value={reason}
					onChange={setReason}
					minLength={10}
					disabled={mutation.isPending}
				/>

				<DialogFooter>
					<Button
						variant="outline"
						onClick={onClose}
						disabled={mutation.isPending}
					>
						취소
					</Button>
					<Button
						variant={config.submitVariant}
						onClick={handleSubmit}
						disabled={mutation.isPending || count === 0}
					>
						{mutation.isPending ? '처리 중…' : config.submitLabel}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
