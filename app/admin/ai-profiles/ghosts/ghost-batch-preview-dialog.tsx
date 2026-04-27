'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
	ArrowLeft,
	CheckSquare,
	Loader2,
	Minus,
	Plus,
	Square,
	Trash2,
} from 'lucide-react';
import { ghostInjection } from '@/app/services/admin/ghost-injection';
import type {
	BatchCreateResult,
	BatchPreviewItem,
	BatchPreviewRoot,
	ImageSource,
	ImageVendor,
	PatchBatchPreviewItemBody,
	ReferenceMatch,
	UploadedPhotoMatch,
} from '@/app/types/ghost-injection';
import { AdminApiError, getAdminErrorMessage } from '@/shared/lib/http/admin-fetch';
import { useToast } from '@/shared/ui/admin/toast';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Dialog, DialogContent } from '@/shared/ui/dialog';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { cn } from '@/shared/utils';
import { AgeBucketSelect, ageBucketToHint } from '../_shared/age-bucket-select';
import {
	DEFAULT_VENDOR,
	DEFAULT_VENDOR_ID,
	findVendorOption,
	GHOST_VENDOR_OPTIONS,
} from '../_shared/ghost-vendor-options';
import { ghostInjectionKeys } from '../_shared/query-keys';
import { ReasonInput, isReasonValid } from '../_shared/reason-input';
import { VendorRadioGroup } from '../_shared/vendor-radio-group';
import { AttachSetupPanel } from './_attach/attach-setup-panel';
import { ModeSelectStep } from './_attach/mode-select-step';
import { UploadSlotGrid } from './_attach/upload-slot-grid';
import { UploadZone } from './_attach/upload-zone';
import { useGhostBatchSetup } from './_attach/use-ghost-batch-setup';
import {
	ResultPhase,
	toEditableCard,
	type EditableCard,
} from './ghost-batch-create-dialog';
import { GhostPreviewCard } from './ghost-preview-card';
import { useBatchPreviewStream } from './use-batch-preview-stream';

const STAGE_LABELS: Record<'profile' | 'persona' | 'slot-prompt' | 'attach', string> = {
	profile: '프로필 생성',
	persona: '페르소나 생성',
	'slot-prompt': '슬롯 프롬프트 생성',
	attach: '사진 매칭',
};

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

	const setup = useGhostBatchSetup();
	const { state: setupState, isReady: setupReady, usedPhotoIds } = setup;

	const [phase, setPhase] = useState<Phase>('setup');
	const [vendorId, setVendorId] = useState(DEFAULT_VENDOR_ID);
	const [reason, setReason] = useState('');
	const [previewRoot, setPreviewRoot] = useState<BatchPreviewRoot | null>(null);
	const [previewImageSource, setPreviewImageSource] = useState<ImageSource>('generate');
	const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
	const [pendingItemId, setPendingItemId] = useState<string | null>(null);
	const [pendingAction, setPendingAction] = useState<
		'edit' | 'regenerate' | 'replace-photo' | null
	>(null);
	const [confirmResult, setConfirmResult] = useState<BatchCreateResult | null>(
		null,
	);
	const [resultCards, setResultCards] = useState<EditableCard[]>([]);
	const [expandedIdx, setExpandedIdx] = useState<number | null>(null);
	const lastStreamErrorRef = useRef<string | null>(null);

	useEffect(() => {
		if (open) {
			setPhase('setup');
			setup.reset();
			setVendorId(DEFAULT_VENDOR_ID);
			setReason('');
			setPreviewRoot(null);
			setPreviewImageSource('generate');
			setSelectedIds(new Set());
			setPendingItemId(null);
			setPendingAction(null);
			setConfirmResult(null);
			setResultCards([]);
			setExpandedIdx(null);
			lastStreamErrorRef.current = null;
		}
	}, [open, setup.reset]);

	const createMutation = useMutation({
		mutationFn: () => {
			const ageHint = ageBucketToHint(setupState.ageBucket);
			if (setupState.mode === 'reference-pool') {
				const matches = Array.from(setupState.matches.values()) as ReferenceMatch[];
				return ghostInjection.createBatchPreview({
					count: setupState.count,
					imageSource: 'reference-pool',
					referenceMatches: matches,
					ageHint,
				});
			}
			if (setupState.mode === 'manual-upload') {
				const uploadedPhotos: UploadedPhotoMatch[] = Array.from(
					setupState.uploadAssignments.entries(),
				).map(([itemIndex, s3Urls]) => ({ itemIndex, s3Urls }));
				return ghostInjection.createBatchPreview({
					count: setupState.count,
					imageSource: 'manual-upload',
					uploadedPhotos,
					ageHint,
				});
			}
			const vendor: ImageVendor =
				findVendorOption(vendorId)?.value ?? DEFAULT_VENDOR;
			return ghostInjection.createBatchPreview({
				count: setupState.count,
				imageSource: 'generate',
				vendor,
				ageHint,
			});
		},
		onSuccess: (data) => {
			setPreviewRoot(data);
			setPreviewImageSource(
				(setupState.mode ?? setupState.imageSource) as ImageSource,
			);
			setSelectedIds(new Set(Object.keys(data.items)));
			setPhase('review');
		},
		onError: (error) => toast.error(getAdminErrorMessage(error)),
	});

	const stream = useBatchPreviewStream(previewRoot?.previewId ?? null);

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
		retry: (failureCount, error) => {
			if (failureCount >= 1) return false;
			return error instanceof AdminApiError && error.status === 409;
		},
		retryDelay: 5000,
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

	const handleRestartPreview = () => {
		if (!previewRoot) return;
		ghostInjection.deleteBatchPreview(previewRoot.previewId).catch(() => undefined);
		setPreviewRoot(null);
		setSelectedIds(new Set());
		setPhase('setup');
	};

	useEffect(() => {
		if (!previewRoot) return;
		const expiresAtMs = new Date(previewRoot.expiresAt).getTime();
		if (Number.isNaN(expiresAtMs)) return;
		const check = () => {
			if (Date.now() >= expiresAtMs && phase === 'review') {
				toast.error('미리보기가 만료되었습니다.');
				onOpenChange(false);
			}
		};
		check();
		const id = window.setInterval(check, 1000);
		return () => window.clearInterval(id);
	}, [previewRoot, phase, toast, onOpenChange]);

	const itemsList: BatchPreviewItem[] = useMemo(() => {
		if (!previewRoot) return [];
		const merged: Record<string, BatchPreviewItem> = {
			...previewRoot.items,
			...stream.itemsReady,
		};
		return Object.values(merged);
	}, [previewRoot, stream.itemsReady]);

	useEffect(() => {
		const ids = Object.keys(stream.itemsReady);
		if (ids.length === 0) return;
		setSelectedIds((prev) => {
			const next = new Set(prev);
			let changed = false;
			for (const id of ids) {
				if (!next.has(id)) {
					next.add(id);
					changed = true;
				}
			}
			return changed ? next : prev;
		});
	}, [stream.itemsReady]);

	useEffect(() => {
		if (!stream.error) {
			lastStreamErrorRef.current = null;
			return;
		}
		if (lastStreamErrorRef.current === stream.error) return;
		lastStreamErrorRef.current = stream.error;
		toast.error(stream.error);
	}, [stream.error, toast]);

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

	const handleReplacePhoto = (
		itemId: string,
		slotIndex: 0 | 1 | 2,
		newPhotoId: string,
	) => {
		patchMutation.mutate({
			itemId,
			body: { action: 'replace-photo', slotIndex, newPhotoId },
		});
	};

	const isBusy =
		createMutation.isPending ||
		patchMutation.isPending ||
		confirmMutation.isPending ||
		deleteMutation.isPending;

	const canStartConfirm =
		selectedIds.size > 0 &&
		isReasonValid(reason) &&
		!isBusy &&
		stream.isComplete &&
		!stream.error;

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
						vendorId={vendorId}
						setVendorId={setVendorId}
						setupReady={setupReady}
						setupState={setupState}
						setup={setup}
						usedPhotoIds={usedPhotoIds}
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
									{stream.isComplete
										? `총 ${itemsList.length}개`
										: `${stream.completed}/${stream.total || setupState.count} 생성 중`}
								</Badge>
								{!stream.isComplete && !stream.error ? (
									<Loader2 className="h-3.5 w-3.5 animate-spin text-slate-400" />
								) : null}
								<ExpiryCountdown expiresAt={previewRoot.expiresAt} />
							</div>
							<p className="mt-1 text-sm text-slate-500">
								프롬프트를 수정하거나 개별 항목을 재생성할 수 있습니다. 선택한
								항목만 실제 프로필로 생성됩니다.
							</p>
							{!stream.isComplete && !stream.error ? (
								<div className="mt-3 space-y-1">
									<div className="flex items-center justify-between text-xs text-slate-500">
										<span>
											{stream.stage ? STAGE_LABELS[stream.stage] : '준비 중'}
										</span>
										<span className="tabular-nums">
											{stream.completed}/{stream.total || setupState.count}
										</span>
									</div>
									<div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
										<div
											className="h-full rounded-full bg-slate-900 transition-[width] duration-300"
											style={{
												width: `${
													stream.total > 0
														? Math.min(
																100,
																Math.round(
																	(stream.completed / stream.total) * 100,
																),
															)
														: 0
												}%`,
											}}
										/>
									</div>
								</div>
							) : null}
							{stream.error ? (
								<div className="mt-3 flex items-center justify-between gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
									<span className="truncate">{stream.error}</span>
									{stream.errorRetryable ? (
										<Button
											size="sm"
											variant="outline"
											className="h-7 border-red-300 text-red-700 hover:bg-red-100"
											onClick={handleRestartPreview}
										>
											다시 시작
										</Button>
									) : null}
								</div>
							) : null}
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
							{itemsList.length === 0 && !stream.error ? (
								<div className="flex h-full flex-col items-center justify-center gap-3 py-12 text-slate-500">
									<Loader2 className="h-8 w-8 animate-spin text-slate-400" />
									<p className="text-sm">
										{stream.total > 0
											? `0/${stream.total} 생성 중…`
											: '미리보기를 준비 중입니다…'}
									</p>
								</div>
							) : (
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
											onReplacePhoto={
												previewImageSource === 'reference-pool'
													? (slotIndex, newPhotoId) =>
															handleReplacePhoto(item.itemId, slotIndex, newPhotoId)
													: undefined
											}
											/* manual-upload: re-uploading slots not supported in MVP */
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
							)}
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
							setPreviewImageSource('generate');
							setSelectedIds(new Set());
							setReason('');
							setup.reset();
						}}
					/>
				) : null}
			</DialogContent>
		</Dialog>
	);
}

interface SetupPhaseProps {
	vendorId: string;
	setVendorId: (next: string) => void;
	setupReady: boolean;
	setupState: ReturnType<typeof useGhostBatchSetup>['state'];
	setup: ReturnType<typeof useGhostBatchSetup>;
	usedPhotoIds: Set<string>;
	isPending: boolean;
	onCancel: () => void;
	onSubmit: () => void;
}

function SetupPhase({
	vendorId,
	setVendorId,
	setupReady,
	setupState,
	setup,
	usedPhotoIds,
	isPending,
	onCancel,
	onSubmit,
}: SetupPhaseProps) {
	const { count, mode, step, ageBucket } = setupState;
	const canSubmit = count >= 1 && count <= 50 && !isPending && setupReady;

	const countControl = (
		<div className="space-y-1">
			<Label className="text-sm font-semibold text-slate-800">생성 수량 *</Label>
			<div className="flex items-center gap-2">
				<Button
					variant="outline"
					size="icon"
					className="h-9 w-9"
					disabled={count <= 1}
					onClick={() => setup.setCount(Math.max(1, count - 1))}
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
							setup.setCount(value);
						}
					}}
					className={cn('h-9 w-20 text-center tabular-nums')}
				/>
				<Button
					variant="outline"
					size="icon"
					className="h-9 w-9"
					disabled={count >= 50}
					onClick={() => setup.setCount(Math.min(50, count + 1))}
				>
					<Plus className="h-3 w-3" />
				</Button>
				<span className="text-xs text-slate-500">최대 50개</span>
			</div>
		</div>
	);

	const ageBucketControl = (
		<AgeBucketSelect
			value={ageBucket ?? undefined}
			onChange={(v) => setup.setAgeBucket(v ?? null)}
		/>
	);

	const isStep1 = step === 1 || mode === null;

	return (
		<div className="flex flex-1 flex-col overflow-hidden">
			<div className="border-b px-6 py-4">
				<div className="flex items-center gap-2">
					{!isStep1 ? (
						<Button
							size="sm"
							variant="ghost"
							className="h-7 px-2 text-slate-600"
							onClick={() => setup.goToStep1()}
							disabled={isPending}
						>
							<ArrowLeft className="mr-1 h-3.5 w-3.5" />
							모드 변경
						</Button>
					) : null}
					<h2 className="text-lg font-semibold text-slate-900">
						가상 프로필 미리보기 생성
					</h2>
				</div>
				<p className="mt-1 text-sm text-slate-500">
					{isStep1
						? '먼저 생성 방식을 선택하세요. 다음 단계에서 세부 옵션을 설정합니다.'
						: '프롬프트 검토 후 선택한 항목만 실제 프로필로 생성합니다.'}
				</p>
			</div>

			{isStep1 ? (
				<div className="flex-1 overflow-y-auto px-6 py-6">
					<div className="mx-auto max-w-4xl">
						<ModeSelectStep
							selected={mode}
							onSelect={(next) => {
								setup.setMode(next);
								setup.goToStep2();
							}}
						/>
					</div>
				</div>
			) : mode === 'reference-pool' ? (
				<>
					<div className="border-b px-6 py-4">
						<div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
							{countControl}
							{ageBucketControl}
						</div>
					</div>
					<div className="flex-1 overflow-hidden">
						<AttachSetupPanel
							count={setupState.count}
							ageBucket={setupState.ageBucket}
							matches={setupState.matches}
							usedPhotoIds={usedPhotoIds}
							activeSlotIndex={setupState.activeSlotIndex}
							poolFilter={setupState.poolFilter}
							onPoolFilterChange={setup.setPoolFilter}
							onPickPhoto={(photo) => setup.addPhotoToActiveSlot(photo.id)}
							onActivate={setup.setActiveSlot}
							onRemovePhoto={setup.removePhotoFromSlot}
							onMergeMatches={setup.mergeMatches}
							onResetAll={setup.resetMatches}
						/>
					</div>
				</>
			) : mode === 'manual-upload' ? (
				<div className="flex-1 overflow-y-auto px-6 py-6">
					<div className="mx-auto max-w-4xl space-y-6">
						<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
							{countControl}
							{ageBucketControl}
						</div>
						<div className="border-t pt-5">
							<UploadZone
								uploaded={setupState.uploaded}
								remainingNeeded={Math.max(
									0,
									setupState.count * 3 - setupState.uploaded.length,
								)}
								totalNeeded={setupState.count * 3}
								onUploadComplete={setup.addUploads}
								onRemove={setup.removeUpload}
								onClearAll={setup.clearUploads}
							/>
						</div>
						<div className="border-t pt-5">
							<UploadSlotGrid
								count={setupState.count}
								uploaded={setupState.uploaded}
								assignments={setupState.uploadAssignments}
								onAssign={setup.assignToSlot}
								onClearAssignment={setup.clearAssignment}
								onAutoDistribute={setup.autoDistribute}
							/>
						</div>
					</div>
				</div>
			) : (
				<div className="flex-1 overflow-y-auto px-6 py-6">
					<div className="mx-auto max-w-3xl space-y-6">
						{countControl}
						{ageBucketControl}
						<div className="border-t pt-5">
							<VendorRadioGroup
								selectedId={vendorId}
								onChange={setVendorId}
								columns={2}
							/>
						</div>
					</div>
				</div>
			)}

			<div className="flex items-center justify-between border-t px-6 py-4">
				<p className="text-xs text-slate-500">
					{isStep1
						? '방식을 선택하면 다음 단계로 이동합니다.'
						: mode === 'reference-pool'
							? `참조 풀에서 ${count}개 슬롯에 사진을 부착합니다.`
							: mode === 'manual-upload'
								? `업로드한 이미지를 ${count}개 페르소나에 매핑합니다.`
								: `AI가 ${count}개의 프로필과 각 슬롯의 이미지 프롬프트를 생성합니다.`}
				</p>
				<div className="flex items-center gap-2">
					<Button variant="outline" onClick={onCancel}>
						취소
					</Button>
					{!isStep1 ? (
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
					) : null}
				</div>
			</div>
		</div>
	);
}

function ExpiryCountdown({ expiresAt }: { expiresAt: string }) {
	const [remainingMs, setRemainingMs] = useState(() =>
		Math.max(0, new Date(expiresAt).getTime() - Date.now()),
	);

	useEffect(() => {
		const target = new Date(expiresAt).getTime();
		const id = window.setInterval(() => {
			setRemainingMs(Math.max(0, target - Date.now()));
		}, 1000);
		return () => window.clearInterval(id);
	}, [expiresAt]);

	const totalSec = Math.floor(remainingMs / 1000);
	const mm = String(Math.floor(totalSec / 60)).padStart(2, '0');
	const ss = String(totalSec % 60).padStart(2, '0');

	const tone =
		totalSec <= 60
			? 'border-red-300 bg-red-50 text-red-700'
			: totalSec <= 180
				? 'border-amber-300 bg-amber-50 text-amber-700'
				: 'border-slate-200 bg-white text-slate-600';

	return (
		<span
			className={cn(
				'rounded-md border px-2 py-0.5 text-xs tabular-nums',
				tone,
			)}
			title="미리보기 만료까지 남은 시간"
		>
			만료 {mm}:{ss}
		</span>
	);
}
