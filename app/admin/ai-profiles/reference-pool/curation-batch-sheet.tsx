'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Check, Loader2, Minus, Plus } from 'lucide-react';
import { ghostReferencePool } from '@/app/services/admin/ghost-reference-pool';
import type {
	AgeBucket,
	CurationCandidate,
	GhostReferenceImageTags,
	PromoteCurationSelection,
} from '@/app/types/ghost-injection';
import { getAdminErrorMessage } from '@/shared/lib/http/admin-fetch';
import { useToast } from '@/shared/ui/admin/toast';
import { Button } from '@/shared/ui/button';
import {
	Dialog,
	DialogContent,
} from '@/shared/ui/dialog';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { cn } from '@/shared/utils';
import { AgeBucketSelect } from '../_shared/age-bucket-select';
import { DEFAULT_VENDOR, DEFAULT_VENDOR_ID, findVendorOption } from '../_shared/ghost-vendor-options';
import { referencePoolKeys } from '../_shared/query-keys';
import { ReasonInput, isReasonValid } from '../_shared/reason-input';
import { VendorRadioGroup } from '../_shared/vendor-radio-group';

interface CurationBatchSheetProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

interface CandidateState {
	candidate: CurationCandidate;
	selected: boolean;
	tags: GhostReferenceImageTags;
}

const DEFAULT_AGE_BUCKET: AgeBucket = '23-25';
const DEFAULT_COUNT = 20;
const MAX_COUNT = 50;

export function CurationBatchSheet({ open, onOpenChange }: CurationBatchSheetProps) {
	const toast = useToast();
	const queryClient = useQueryClient();

	const [count, setCount] = useState(DEFAULT_COUNT);
	const [ageBucket, setAgeBucket] = useState<AgeBucket>(DEFAULT_AGE_BUCKET);
	const [vendorId, setVendorId] = useState(DEFAULT_VENDOR_ID);
	const [reason, setReason] = useState('');
	const [candidates, setCandidates] = useState<CandidateState[]>([]);

	useEffect(() => {
		if (open) {
			setCount(DEFAULT_COUNT);
			setAgeBucket(DEFAULT_AGE_BUCKET);
			setVendorId(DEFAULT_VENDOR_ID);
			setReason('');
			setCandidates([]);
		}
	}, [open]);

	const selectedVendorOption = findVendorOption(vendorId);
	const vendor = selectedVendorOption?.value ?? DEFAULT_VENDOR;
	const vendorLabel = selectedVendorOption?.label ?? 'Seedream';

	const generateMutation = useMutation({
		mutationFn: () =>
			ghostReferencePool.generateCurationBatch({
				count,
				ageBucket,
				vendor,
				reason: reason.trim(),
			}),
		onSuccess: (data) => {
			const items = Array.isArray(data) ? data : [];
			if (items.length === 0) {
				toast.error(
					`이미지 생성에 모두 실패했습니다. ${vendorLabel} API 상태를 확인해주세요.`,
				);
				return;
			}
			setCandidates(items.map((c) => ({ candidate: c, selected: true, tags: {} })));
			if (items.length < count) {
				toast.success(
					`${count}장 중 ${items.length}장만 생성 성공. ${count - items.length}장은 실패하여 건너뛰었습니다.`,
				);
			} else {
				toast.success(`${items.length}장의 후보가 생성되었습니다. 선별해주세요.`);
			}
		},
		onError: (error) => toast.error(getAdminErrorMessage(error)),
	});

	const promoteMutation = useMutation({
		mutationFn: () => {
			const selections: PromoteCurationSelection[] = candidates
				.filter((c) => c.selected)
				.map((c) => ({
					s3Key: c.candidate.s3Key,
					s3Url: c.candidate.s3Url,
					ageBucket: c.candidate.ageBucket,
					tags: Object.values(c.tags).some(Boolean) ? c.tags : undefined,
					sourceMeta: {
						vendor: c.candidate.vendor,
						model: c.candidate.model,
						prompt: c.candidate.prompt,
					},
				}));
			return ghostReferencePool.promote({ selections, reason: reason.trim() });
		},
		onSuccess: (data) => {
			const promoted = Array.isArray(data) ? data.length : 0;
			toast.success(`${promoted}장이 풀에 추가되었습니다.`);
			queryClient.invalidateQueries({ queryKey: referencePoolKeys.all });
			onOpenChange(false);
		},
		onError: (error) => toast.error(getAdminErrorMessage(error)),
	});

	const phase: 'form' | 'loading' | 'select' = generateMutation.isPending
		? 'loading'
		: candidates.length > 0
			? 'select'
			: 'form';

	const selectedCount = candidates.filter((c) => c.selected).length;
	const orphanCount = candidates.length - selectedCount;

	const isPending = generateMutation.isPending || promoteMutation.isPending;

	const handleClose = (next: boolean) => {
		if (isPending) return;
		onOpenChange(next);
	};

	return (
		<Dialog open={open} onOpenChange={handleClose}>
			<DialogContent className="flex h-[92vh] max-w-6xl flex-col p-0">
				<div className="border-b px-6 py-4">
					<h2 className="text-lg font-semibold text-slate-900">레퍼런스 풀 큐레이션</h2>
					<p className="mt-1 text-sm text-slate-500">
						{phase === 'form' && 'AI 모델로 후보를 생성한 뒤 선별하여 풀에 추가합니다.'}
						{phase === 'loading' && `${vendorLabel}로 후보 생성 중입니다. 잠시만 기다려주세요.`}
						{phase === 'select' &&
							`후보 ${candidates.length}장 중 ${selectedCount}장 선택됨`}
					</p>
				</div>

				{phase === 'form' && (
					<FormPhase
						count={count}
						setCount={setCount}
						ageBucket={ageBucket}
						setAgeBucket={setAgeBucket}
						vendorId={vendorId}
						setVendorId={setVendorId}
						vendorOption={selectedVendorOption}
						reason={reason}
						setReason={setReason}
						onClose={() => handleClose(false)}
						onSubmit={() => generateMutation.mutate()}
					/>
				)}

				{phase === 'loading' && <LoadingPhase count={count} vendorLabel={vendorLabel} />}

				{phase === 'select' && (
					<SelectPhase
						candidates={candidates}
						setCandidates={setCandidates}
						selectedCount={selectedCount}
						orphanCount={orphanCount}
						onBack={() => setCandidates([])}
						onPromote={() => promoteMutation.mutate()}
						isPending={promoteMutation.isPending}
					/>
				)}
			</DialogContent>
		</Dialog>
	);
}

function FormPhase({
	count,
	setCount,
	ageBucket,
	setAgeBucket,
	vendorId,
	setVendorId,
	vendorOption,
	reason,
	setReason,
	onClose,
	onSubmit,
}: {
	count: number;
	setCount: (v: number) => void;
	ageBucket: AgeBucket;
	setAgeBucket: (v: AgeBucket) => void;
	vendorId: string;
	setVendorId: (v: string) => void;
	vendorOption: ReturnType<typeof findVendorOption>;
	reason: string;
	setReason: (v: string) => void;
	onClose: () => void;
	onSubmit: () => void;
}) {
	const canSubmit = count > 0 && count <= MAX_COUNT && isReasonValid(reason);
	const estimatedSeconds = count * 15;

	return (
		<div className="flex flex-1 flex-col overflow-hidden">
			<div className="flex-1 overflow-y-auto px-6 py-6">
				<div className="mx-auto max-w-2xl space-y-6">
					<div className="space-y-1">
						<Label className="text-sm font-semibold text-slate-800">생성 수량 *</Label>
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
								max={MAX_COUNT}
								value={count}
								onChange={(e) => {
									const v = Number(e.target.value);
									if (Number.isFinite(v) && v >= 1 && v <= MAX_COUNT) setCount(v);
								}}
								className="h-9 w-24 text-center tabular-nums"
							/>
							<Button
								variant="outline"
								size="icon"
								className="h-9 w-9"
								disabled={count >= MAX_COUNT}
								onClick={() => setCount(Math.min(MAX_COUNT, count + 1))}
							>
								<Plus className="h-3 w-3" />
							</Button>
							<span className="text-xs text-slate-500">
								최대 {MAX_COUNT}장 · 예상 소요 약 {Math.ceil(estimatedSeconds / 60)}분
							</span>
						</div>
					</div>

					<AgeBucketSelect
						value={ageBucket}
						onChange={(v) => setAgeBucket(v ?? DEFAULT_AGE_BUCKET)}
						allowAll={false}
					/>

					<ReasonInput value={reason} onChange={setReason} minLength={10} rows={2} />

					<div className="border-t pt-5">
						<VendorRadioGroup selectedId={vendorId} onChange={setVendorId} columns={2} />
					</div>

					<div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
						<div className="mb-1 flex items-center gap-1.5 font-semibold">
							<AlertTriangle className="h-3.5 w-3.5" />
							비용 안내
						</div>
						<p>
							{count}장의 후보가 {vendorOption?.label ?? 'AI'}로 생성됩니다
							({vendorOption?.pricePerImage ?? '—'}/장).
							{vendorOption?.supportsReference
								? ' 이 벤더는 img2img를 지원하므로 풀 레퍼런스로 활용 시 최적입니다.'
								: ' 이 벤더는 img2img 미지원 — 풀 레퍼런스 사용 시 text-to-image로 fallback됩니다.'}
							{' '}선별에서 제외된 후보는 S3에 고아 파일로 남으므로 가능한 많이 선별해주세요.
						</p>
					</div>
				</div>
			</div>

			<div className="flex items-center justify-end gap-2 border-t px-6 py-4">
				<Button variant="outline" onClick={onClose}>
					취소
				</Button>
				<Button onClick={onSubmit} disabled={!canSubmit}>
					{count}장 생성 시작
				</Button>
			</div>
		</div>
	);
}

function LoadingPhase({ count, vendorLabel }: { count: number; vendorLabel: string }) {
	const estimatedSeconds = count * 15;
	const minutes = Math.ceil(estimatedSeconds / 60);

	return (
		<div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-12">
			<Loader2 className="h-12 w-12 animate-spin text-slate-400" />
			<div className="text-center">
				<p className="text-base font-semibold text-slate-800">{count}장 생성 중…</p>
				<p className="mt-1 text-sm text-slate-500">
					{vendorLabel} API 응답 대기 (약 {minutes}분 소요 예상)
				</p>
				<p className="mt-3 text-xs text-slate-400">생성 도중 창을 닫지 마세요</p>
			</div>
		</div>
	);
}

function SelectPhase({
	candidates,
	setCandidates,
	selectedCount,
	orphanCount,
	onBack,
	onPromote,
	isPending,
}: {
	candidates: CandidateState[];
	setCandidates: React.Dispatch<React.SetStateAction<CandidateState[]>>;
	selectedCount: number;
	orphanCount: number;
	onBack: () => void;
	onPromote: () => void;
	isPending: boolean;
}) {
	const toggleAll = (selected: boolean) => {
		setCandidates((prev) => prev.map((c) => ({ ...c, selected })));
	};

	const toggleOne = (idx: number) => {
		setCandidates((prev) => {
			const next = [...prev];
			next[idx] = { ...prev[idx], selected: !prev[idx].selected };
			return next;
		});
	};

	const updateTag = (idx: number, key: keyof GhostReferenceImageTags, value: string) => {
		setCandidates((prev) => {
			const next = [...prev];
			next[idx] = { ...prev[idx], tags: { ...prev[idx].tags, [key]: value || undefined } };
			return next;
		});
	};

	return (
		<div className="flex flex-1 flex-col overflow-hidden">
			<div className="flex items-center justify-between border-b bg-slate-50 px-6 py-3">
				<div className="flex items-center gap-3 text-sm">
					<span className="font-medium text-slate-700">
						선택 <span className="text-slate-900">{selectedCount}</span> /{' '}
						{candidates.length}
					</span>
					<Button variant="ghost" size="sm" onClick={() => toggleAll(true)}>
						전체 선택
					</Button>
					<Button variant="ghost" size="sm" onClick={() => toggleAll(false)}>
						전체 해제
					</Button>
				</div>
				{orphanCount > 0 ? (
					<div className="flex items-center gap-1.5 rounded-md bg-amber-50 px-2 py-1 text-xs text-amber-700">
						<AlertTriangle className="h-3 w-3" />
						미선별 {orphanCount}장은 S3 고아 파일이 됩니다
					</div>
				) : null}
			</div>

			<div className="flex-1 overflow-y-auto px-6 py-4">
				<div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
					{candidates.map((state, idx) => (
						<CandidateCard
							key={state.candidate.s3Key}
							state={state}
							onToggle={() => toggleOne(idx)}
							onTagChange={(key, value) => updateTag(idx, key, value)}
						/>
					))}
				</div>
			</div>

			<div className="flex items-center justify-between border-t px-6 py-4">
				<Button variant="outline" onClick={onBack} disabled={isPending}>
					다시 생성
				</Button>
				<Button onClick={onPromote} disabled={selectedCount === 0 || isPending}>
					{isPending ? (
						<>
							<Loader2 className="mr-1 h-4 w-4 animate-spin" /> 승격 중…
						</>
					) : (
						`${selectedCount}장 풀에 승격`
					)}
				</Button>
			</div>
		</div>
	);
}

function CandidateCard({
	state,
	onToggle,
	onTagChange,
}: {
	state: CandidateState;
	onToggle: () => void;
	onTagChange: (key: keyof GhostReferenceImageTags, value: string) => void;
}) {
	const { candidate, selected, tags } = state;

	return (
		<div
			className={cn(
				'overflow-hidden rounded-lg border transition-all',
				selected ? 'border-blue-500 ring-2 ring-blue-200' : 'border-slate-200 opacity-60',
			)}
		>
			<button
				type="button"
				onClick={onToggle}
				className="relative block aspect-[3/4] w-full bg-slate-100"
			>
				{/* eslint-disable-next-line @next/next/no-img-element */}
				<img
					src={candidate.s3Url}
					alt=""
					loading="lazy"
					decoding="async"
					className="h-full w-full object-cover"
				/>
				<div
					className={cn(
						'absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full border-2 transition-colors',
						selected ? 'border-blue-500 bg-blue-500' : 'border-white bg-white/80',
					)}
				>
					{selected ? <Check className="h-3.5 w-3.5 text-white" /> : null}
				</div>
			</button>

			<div className="space-y-1.5 p-2">
				<Input
					placeholder="mood (예: casual)"
					value={tags.mood ?? ''}
					onChange={(e) => onTagChange('mood', e.target.value)}
					className="h-7 text-[11px]"
					disabled={!selected}
				/>
				<Input
					placeholder="setting (예: cafe)"
					value={tags.setting ?? ''}
					onChange={(e) => onTagChange('setting', e.target.value)}
					className="h-7 text-[11px]"
					disabled={!selected}
				/>
			</div>
		</div>
	);
}
