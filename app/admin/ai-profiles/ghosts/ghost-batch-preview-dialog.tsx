'use client';

import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckSquare, Loader2, Minus, Plus, Square, Trash2 } from 'lucide-react';
import { ghostInjection } from '@/app/services/admin/ghost-injection';
import type {
	BatchCreateResult,
	BatchPreviewItem,
	BatchPreviewRoot,
	ImageVendor,
	PatchBatchPreviewItemBody,
} from '@/app/types/ghost-injection';
import { getAdminErrorMessage } from '@/shared/lib/http/admin-fetch';
import { useToast } from '@/shared/ui/admin/toast';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Dialog, DialogContent } from '@/shared/ui/dialog';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { cn } from '@/shared/utils';
import {
	DEFAULT_VENDOR,
	DEFAULT_VENDOR_ID,
	findVendorOption,
	GHOST_VENDOR_OPTIONS,
} from '../_shared/ghost-vendor-options';
import { ghostInjectionKeys } from '../_shared/query-keys';
import { ReasonInput, isReasonValid } from '../_shared/reason-input';
import { VendorRadioGroup } from '../_shared/vendor-radio-group';
import {
	ResultPhase,
	toEditableCard,
	type EditableCard,
} from './ghost-batch-create-dialog';
import { GhostPreviewCard } from './ghost-preview-card';

type Phase = 'setup' | 'review' | 'confirming' | 'result';

interface GhostBatchPreviewDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function GhostBatchPreviewDialog({
	open,
	onOpenChange,
}: GhostBatchPreviewDialogProps) {
	const toast = useToast();
	const queryClient = useQueryClient();

	const [phase, setPhase] = useState<Phase>('setup');
	const [count, setCount] = useState(1);
	const [vendorId, setVendorId] = useState(DEFAULT_VENDOR_ID);
	const [reason, setReason] = useState('');
	const [previewRoot, setPreviewRoot] = useState<BatchPreviewRoot | null>(null);
	const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
	const [pendingItemId, setPendingItemId] = useState<string | null>(null);
	const [pendingAction, setPendingAction] = useState<'edit' | 'regenerate' | null>(
		null,
	);
	const [confirmResult, setConfirmResult] = useState<BatchCreateResult | null>(
		null,
	);
	const [resultCards, setResultCards] = useState<EditableCard[]>([]);
	const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

	useEffect(() => {
		if (open) {
			setPhase('setup');
			setCount(1);
			setVendorId(DEFAULT_VENDOR_ID);
			setReason('');
			setPreviewRoot(null);
			setSelectedIds(new Set());
			setPendingItemId(null);
			setPendingAction(null);
			setConfirmResult(null);
			setResultCards([]);
			setExpandedIdx(null);
		}
	}, [open]);

	const createMutation = useMutation({
		mutationFn: () => {
			const vendor: ImageVendor =
				findVendorOption(vendorId)?.value ?? DEFAULT_VENDOR;
			return ghostInjection.createBatchPreview({ count, vendor });
		},
		onSuccess: (data) => {
			setPreviewRoot(data);
			setSelectedIds(new Set(Object.keys(data.items)));
			setPhase('review');
		},
		onError: (error) => toast.error(getAdminErrorMessage(error)),
	});

	const patchMutation = useMutation({
		mutationFn: ({
			itemId,
			body,
		}: {
			itemId: string;
			body: PatchBatchPreviewItemBody;
		}) => {
			if (!previewRoot) throw new Error('previewRoot 없음');
			return ghostInjection.patchBatchPreviewItem(
				previewRoot.previewId,
				itemId,
				body,
			);
		},
		onMutate: ({ itemId, body }) => {
			setPendingItemId(itemId);
			setPendingAction(body.action);
		},
		onSuccess: (updated) => {
			setPreviewRoot((prev) => {
				if (!prev) return prev;
				return {
					...prev,
					items: { ...prev.items, [updated.itemId]: updated },
				};
			});
			toast.success('프롬프트가 업데이트되었습니다.');
		},
		onError: (error) => toast.error(getAdminErrorMessage(error)),
		onSettled: () => {
			setPendingItemId(null);
			setPendingAction(null);
		},
	});

	const confirmMutation = useMutation({
		mutationFn: () => {
			if (!previewRoot) throw new Error('previewRoot 없음');
			return ghostInjection.confirmBatchPreview(previewRoot.previewId, {
				itemIds: Array.from(selectedIds),
				reason: reason.trim(),
			});
		},
		onSuccess: (data) => {
			if (!data) return;
			setConfirmResult(data);
			const usedVendorId =
				GHOST_VENDOR_OPTIONS.find(
					(option) => option.value === data.vendor && !option.disabled,
				)?.id ?? DEFAULT_VENDOR_ID;
			setResultCards(
				data.results
					.filter((result) => result.status === 'success')
					.map((result) => toEditableCard(result, usedVendorId)),
			);
			setPhase('result');
			toast.success(`${data.success}개 프로필이 생성되었습니다.`);
			queryClient.invalidateQueries({ queryKey: ghostInjectionKeys.ghosts() });
			queryClient.invalidateQueries({ queryKey: ghostInjectionKeys.status() });
		},
		onError: (error) => {
			toast.error(getAdminErrorMessage(error));
			setPhase('review');
		},
	});

	const deleteMutation = useMutation({
		mutationFn: () => {
			if (!previewRoot) throw new Error('previewRoot 없음');
			return ghostInjection.deleteBatchPreview(previewRoot.previewId);
		},
		onSuccess: () => {
			toast.success('미리보기가 취소되었습니다.');
			onOpenChange(false);
		},
		onError: (error) => toast.error(getAdminErrorMessage(error)),
	});

	const itemsList: BatchPreviewItem[] = useMemo(() => {
		if (!previewRoot) return [];
		return Object.values(previewRoot.items);
	}, [previewRoot]);

	const allSelected =
		itemsList.length > 0 && selectedIds.size === itemsList.length;

	const handleToggleSelect = (itemId: string) => {
		setSelectedIds((prev) => {
			const next = new Set(prev);
			if (next.has(itemId)) next.delete(itemId);
			else next.add(itemId);
			return next;
		});
	};

	const handleToggleSelectAll = () => {
		if (allSelected) {
			setSelectedIds(new Set());
		} else {
			setSelectedIds(new Set(itemsList.map((item) => item.itemId)));
		}
	};

	const handleEditSlot = (
		itemId: string,
		slotIndex: 0 | 1 | 2,
		nextPrompt: string,
	) => {
		patchMutation.mutate({
			itemId,
			body: {
				action: 'edit',
				slotPrompts: [{ slotIndex, prompt: nextPrompt }],
			},
		});
	};

	const handleRegenerateItem = (itemId: string) => {
		patchMutation.mutate({
			itemId,
			body: { action: 'regenerate', preserveProfile: true },
		});
	};

	const isBusy =
		createMutation.isPending ||
		patchMutation.isPending ||
		confirmMutation.isPending ||
		deleteMutation.isPending;

	const canStartConfirm =
		selectedIds.size > 0 && isReasonValid(reason) && !isBusy;

	const handleStartConfirm = () => {
		setPhase('confirming');
		confirmMutation.mutate();
	};

	const handleDialogOpenChange = (next: boolean) => {
		if (!isBusy) onOpenChange(next);
	};

	const failedItems =
		confirmResult?.results.filter((result) => result.status === 'failed') ?? [];

	return (
		<Dialog open={open} onOpenChange={handleDialogOpenChange}>
			<DialogContent className="flex h-[92vh] max-w-7xl flex-col p-0">
				{phase === 'setup' ? (
					<SetupPhase
						count={count}
						setCount={setCount}
						vendorId={vendorId}
						setVendorId={setVendorId}
						isPending={createMutation.isPending}
						onCancel={() => onOpenChange(false)}
						onSubmit={() => createMutation.mutate()}
					/>
				) : null}

				{phase === 'review' && previewRoot ? (
					<div className="flex flex-1 flex-col overflow-hidden">
						<div className="border-b px-6 py-4">
							<div className="flex items-center gap-2">
								<h2 className="text-lg font-semibold text-slate-900">
									프로필 미리보기 검토
								</h2>
								<Badge variant="outline" className="text-xs">
									{previewRoot.vendor}
								</Badge>
								<Badge variant="secondary" className="text-xs">
									총 {itemsList.length}개
								</Badge>
							</div>
							<p className="mt-1 text-sm text-slate-500">
								프롬프트를 수정하거나 개별 항목을 재생성할 수 있습니다. 선택한
								항목만 실제 프로필로 생성됩니다.
							</p>
						</div>

						<div className="border-b bg-slate-50 px-6 py-3">
							<div className="flex items-center justify-between">
								<Button
									size="sm"
									variant="ghost"
									onClick={handleToggleSelectAll}
									disabled={isBusy}
								>
									{allSelected ? (
										<>
											<CheckSquare className="mr-1 h-4 w-4" />
											전체 해제
										</>
									) : (
										<>
											<Square className="mr-1 h-4 w-4" />
											전체 선택
										</>
									)}
								</Button>
								<span className="text-xs text-slate-500">
									<span className="font-semibold text-slate-900">
										{selectedIds.size}
									</span>
									개 선택됨
								</span>
							</div>
						</div>

						<div className="flex-1 overflow-y-auto px-6 py-4">
							<div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
								{itemsList.map((item) => (
									<GhostPreviewCard
										key={item.itemId}
										item={item}
										selected={selectedIds.has(item.itemId)}
										onToggleSelect={() => handleToggleSelect(item.itemId)}
										onEditSlot={(slotIndex, nextPrompt) =>
											handleEditSlot(item.itemId, slotIndex, nextPrompt)
										}
										onRegenerate={() => handleRegenerateItem(item.itemId)}
										isSaving={
											pendingItemId === item.itemId && pendingAction === 'edit'
										}
										isRegenerating={
											pendingItemId === item.itemId &&
											pendingAction === 'regenerate'
										}
									/>
								))}
							</div>
						</div>

						<div className="space-y-3 border-t px-6 py-4">
							<ReasonInput
								value={reason}
								onChange={setReason}
								minLength={10}
								rows={2}
							/>
							<div className="flex items-center justify-between">
								<Button
									variant="ghost"
									className="text-red-600 hover:bg-red-50 hover:text-red-700"
									disabled={isBusy}
									onClick={() => deleteMutation.mutate()}
								>
									<Trash2 className="mr-1 h-4 w-4" />
									취소 (미리보기 삭제)
								</Button>
								<div className="flex items-center gap-2">
									<span className="text-xs text-slate-500">
										선택 {selectedIds.size}개 생성
									</span>
									<Button
										disabled={!canStartConfirm}
										onClick={handleStartConfirm}
									>
										확정 생성
									</Button>
								</div>
							</div>
						</div>
					</div>
				) : null}

				{phase === 'confirming' ? (
					<div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-16">
						<Loader2 className="h-10 w-10 animate-spin text-slate-400" />
						<p className="text-sm text-slate-600">
							선택한 {selectedIds.size}개 프로필을 생성 중입니다…
						</p>
						<p className="text-xs text-slate-400">
							이미지 생성으로 시간이 소요될 수 있습니다.
						</p>
					</div>
				) : null}

				{phase === 'result' && confirmResult ? (
					<ResultPhase
						result={confirmResult}
						cards={resultCards}
						failedItems={failedItems}
						expandedIdx={expandedIdx}
						setExpandedIdx={setExpandedIdx}
						updateCard={(idx, patch) =>
							setResultCards((prev) => {
								const next = [...prev];
								next[idx] = { ...prev[idx], ...patch };
								return next;
							})
						}
						setCards={setResultCards}
						onClose={() => onOpenChange(false)}
						onReset={() => {
							setPhase('setup');
							setConfirmResult(null);
							setResultCards([]);
							setExpandedIdx(null);
							setPreviewRoot(null);
							setSelectedIds(new Set());
							setReason('');
						}}
					/>
				) : null}
			</DialogContent>
		</Dialog>
	);
}

interface SetupPhaseProps {
	count: number;
	setCount: (next: number) => void;
	vendorId: string;
	setVendorId: (next: string) => void;
	isPending: boolean;
	onCancel: () => void;
	onSubmit: () => void;
}

function SetupPhase({
	count,
	setCount,
	vendorId,
	setVendorId,
	isPending,
	onCancel,
	onSubmit,
}: SetupPhaseProps) {
	const canSubmit = count >= 1 && count <= 50 && !isPending;

	return (
		<div className="flex flex-1 flex-col overflow-hidden">
			<div className="border-b px-6 py-4">
				<h2 className="text-lg font-semibold text-slate-900">
					가상 프로필 미리보기 생성
				</h2>
				<p className="mt-1 text-sm text-slate-500">
					프롬프트 검토 후 선택한 항목만 실제 프로필로 생성합니다.
				</p>
			</div>

			<div className="flex-1 overflow-y-auto px-6 py-6">
				<div className="mx-auto max-w-3xl space-y-6">
					<div className="space-y-1">
						<Label className="text-sm font-semibold text-slate-800">
							생성 수량 *
						</Label>
						<div className="flex items-center gap-2">
							<Button
								variant="outline"
								size="icon"
								className="h-9 w-9"
								disabled={count <= 1}
								onClick={() => setCount(Math.max(1, count - 1))}
							>
								<Minus className="h-3 w-3" />
							</Button>
							<Input
								type="number"
								min={1}
								max={50}
								value={count}
								onChange={(event) => {
									const value = Number(event.target.value);
									if (Number.isFinite(value) && value >= 1 && value <= 50) {
										setCount(value);
									}
								}}
								className={cn('h-9 w-20 text-center tabular-nums')}
							/>
							<Button
								variant="outline"
								size="icon"
								className="h-9 w-9"
								disabled={count >= 50}
								onClick={() => setCount(Math.min(50, count + 1))}
							>
								<Plus className="h-3 w-3" />
							</Button>
							<span className="text-xs text-slate-500">최대 50개</span>
						</div>
					</div>

					<div className="border-t pt-5">
						<VendorRadioGroup
							selectedId={vendorId}
							onChange={setVendorId}
							columns={2}
						/>
					</div>
				</div>
			</div>

			<div className="flex items-center justify-between border-t px-6 py-4">
				<p className="text-xs text-slate-500">
					AI가 {count}개의 프로필과 각 슬롯의 이미지 프롬프트를 생성합니다.
				</p>
				<div className="flex items-center gap-2">
					<Button variant="outline" onClick={onCancel}>
						취소
					</Button>
					<Button onClick={onSubmit} disabled={!canSubmit}>
						{isPending ? (
							<>
								<Loader2 className="mr-1 h-4 w-4 animate-spin" />
								생성 중…
							</>
						) : (
							`${count}개 미리보기 생성`
						)}
					</Button>
				</div>
			</div>
		</div>
	);
}
