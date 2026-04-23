'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, CheckCircle2, Loader2, Trash2, XCircle } from 'lucide-react';
import { ghostInjection } from '@/app/services/admin/ghost-injection';
import type { GhostListItem } from '@/app/types/ghost-injection';
import { getAdminErrorMessage } from '@/shared/lib/http/admin-fetch';
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

interface GhostBulkDeleteDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	selected: GhostListItem[];
	onComplete: (succeededIds: string[]) => void;
}

interface DeleteResultEntry {
	ghost: GhostListItem;
	status: 'pending' | 'success' | 'failed';
	error?: string;
}

export function GhostBulkDeleteDialog({
	open,
	onOpenChange,
	selected,
	onComplete,
}: GhostBulkDeleteDialogProps) {
	const toast = useToast();
	const queryClient = useQueryClient();
	const [reason, setReason] = useState('');
	const [isRunning, setIsRunning] = useState(false);
	const [results, setResults] = useState<DeleteResultEntry[]>([]);
	const [phase, setPhase] = useState<'input' | 'running' | 'done'>('input');

	const total = selected.length;
	const successCount = results.filter((r) => r.status === 'success').length;
	const failedCount = results.filter((r) => r.status === 'failed').length;
	const pendingCount = total - successCount - failedCount;

	const reset = () => {
		setReason('');
		setResults([]);
		setPhase('input');
		setIsRunning(false);
	};

	const handleOpenChange = (next: boolean) => {
		if (isRunning) return;
		if (!next) reset();
		onOpenChange(next);
	};

	const runBulkDelete = async () => {
		if (!isReasonValid(reason)) {
			toast.error('사유를 10자 이상 입력해주세요.');
			return;
		}

		setIsRunning(true);
		setPhase('running');
		const initialResults: DeleteResultEntry[] = selected.map((ghost) => ({
			ghost,
			status: 'pending',
		}));
		setResults(initialResults);

		const trimmedReason = reason.trim();
		const succeeded: string[] = [];

		for (let i = 0; i < selected.length; i++) {
			const ghost = selected[i];
			try {
				await ghostInjection.deleteGhost(ghost.ghostAccountId, { reason: trimmedReason });
				succeeded.push(ghost.ghostAccountId);
				setResults((prev) =>
					prev.map((entry, idx) => (idx === i ? { ...entry, status: 'success' } : entry)),
				);
			} catch (error) {
				setResults((prev) =>
					prev.map((entry, idx) =>
						idx === i ? { ...entry, status: 'failed', error: getAdminErrorMessage(error) } : entry,
					),
				);
			}
		}

		queryClient.invalidateQueries({ queryKey: ghostInjectionKeys.ghosts() });

		setIsRunning(false);
		setPhase('done');

		if (succeeded.length > 0) {
			onComplete(succeeded);
		}
		if (succeeded.length === total) {
			toast.success(`${total}개 가상 프로필이 모두 삭제되었습니다.`);
		} else if (succeeded.length > 0) {
			toast.error(`${total}개 중 ${succeeded.length}개만 삭제되었습니다. 실패 항목을 확인하세요.`);
		} else {
			toast.error('삭제에 모두 실패했습니다.');
		}
	};

	const handleClose = () => {
		reset();
		onOpenChange(false);
	};

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogContent className="max-w-xl">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2 text-red-700">
						<Trash2 className="h-4 w-4" />
						가상 프로필 일괄 삭제
					</DialogTitle>
					<DialogDescription>
						선택된 {total}개 프로필을 영구 삭제합니다. 복구할 수 없으며 매칭된 실사용자에게는 탈퇴한 사용자로 표시됩니다.
					</DialogDescription>
				</DialogHeader>

				{phase === 'input' && (
					<>
						<Alert variant="destructive">
							<AlertTriangle className="h-4 w-4" />
							<AlertDescription className="text-xs">
								동일한 사유가 모든 선택 항목에 기록됩니다. API는 항목별로 순차 호출되며, 중간 실패 시 이미 삭제된 항목은 되돌릴 수 없습니다.
							</AlertDescription>
						</Alert>

						<div className="max-h-40 overflow-y-auto rounded-md border bg-slate-50 p-2">
							<ul className="space-y-1 text-xs">
								{selected.map((ghost) => (
									<li key={ghost.ghostAccountId} className="flex items-center justify-between gap-2">
										<span className="truncate font-medium text-slate-800">{ghost.name}</span>
										<span className="shrink-0 text-slate-500">
											{ghost.university?.name ?? '—'} · {ghost.age}세
										</span>
									</li>
								))}
							</ul>
						</div>

						<ReasonInput value={reason} onChange={setReason} minLength={10} rows={2} />
					</>
				)}

				{(phase === 'running' || phase === 'done') && (
					<>
						<div className="flex items-center justify-between rounded-md border bg-slate-50 px-3 py-2 text-xs">
							<span className="font-medium text-slate-700">
								진행 {successCount + failedCount} / {total}
							</span>
							<span className="flex items-center gap-3">
								<span className="text-green-700">성공 {successCount}</span>
								<span className="text-red-600">실패 {failedCount}</span>
								{pendingCount > 0 && <span className="text-slate-500">대기 {pendingCount}</span>}
							</span>
						</div>

						<div className="max-h-60 overflow-y-auto rounded-md border">
							<ul className="divide-y text-xs">
								{results.map((entry) => (
									<li
										key={entry.ghost.ghostAccountId}
										className="flex items-center justify-between gap-2 px-3 py-1.5"
									>
										<div className="flex items-center gap-2 truncate">
											{entry.status === 'pending' && (
												<Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-slate-400" />
											)}
											{entry.status === 'success' && (
												<CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-green-600" />
											)}
											{entry.status === 'failed' && (
												<XCircle className="h-3.5 w-3.5 shrink-0 text-red-600" />
											)}
											<span className="truncate text-slate-800">{entry.ghost.name}</span>
										</div>
										{entry.status === 'failed' && entry.error && (
											<span className="shrink-0 truncate text-[11px] text-red-500" title={entry.error}>
												{entry.error}
											</span>
										)}
									</li>
								))}
							</ul>
						</div>
					</>
				)}

				<DialogFooter>
					{phase === 'input' && (
						<>
							<Button variant="outline" onClick={handleClose}>
								취소
							</Button>
							<Button
								variant="destructive"
								onClick={runBulkDelete}
								disabled={!isReasonValid(reason) || total === 0}
							>
								<Trash2 className="mr-1 h-3.5 w-3.5" />
								{total}개 영구 삭제
							</Button>
						</>
					)}
					{phase === 'running' && (
						<Button variant="outline" disabled>
							<Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> 진행 중…
						</Button>
					)}
					{phase === 'done' && (
						<Button onClick={handleClose}>닫기</Button>
					)}
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
