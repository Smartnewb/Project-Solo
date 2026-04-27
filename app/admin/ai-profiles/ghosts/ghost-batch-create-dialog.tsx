'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
	Check,
	ChevronLeft,
	ChevronRight,
	ImageOff,
	Loader2,
	Minus,
	Pencil,
	Plus,
	RefreshCw,
	Sparkles,
	XCircle,
} from 'lucide-react';
import { ghostInjection } from '@/app/services/admin/ghost-injection';
import type { BatchCreateResult, BatchCreateResultItem, ImageSource, ImageVendor } from '@/app/types/ghost-injection';
import { getAdminErrorMessage } from '@/shared/lib/http/admin-fetch';
import { useToast } from '@/shared/ui/admin/toast';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import {
	Dialog,
	DialogContent,
} from '@/shared/ui/dialog';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/shared/ui/select';
import { Textarea } from '@/shared/ui/textarea';
import { cn } from '@/shared/utils';
import {
	DEFAULT_VENDOR,
	DEFAULT_VENDOR_ID,
	findVendorOption,
	GHOST_VENDOR_OPTIONS,
	vendorOptionsForSelect,
	vendorSupportsReference,
} from '../_shared/ghost-vendor-options';
import { RankBadge } from '../_shared/rank-badge';
import { ReasonInput, isReasonValid } from '../_shared/reason-input';
import { ghostInjectionKeys } from '../_shared/query-keys';
import { VendorRadioGroup } from '../_shared/vendor-radio-group';
import { GhostPromptPreviewModal } from './ghost-prompt-preview-modal';

const BATCH_EDIT_REASON = '일괄 생성 후 어드민 수정';
const PHOTO_REGEN_REASON = '사진 재생성';
const BATCH_RETRY_REASON = '배치 실패 항목 재시도';

interface GhostBatchCreateDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export interface EditableCard {
	item: BatchCreateResultItem;
	nameEdit: string;
	ageEdit: string;
	mbtiEdit: string;
	introEdit: string;
	currentPhotos: string[];
	photoRegen: {
		selectedRefs: Set<number>;
		prompt: string;
		vendorId: string;
	};
	isSaved: boolean;
}

export function toEditableCard(item: BatchCreateResultItem, defaultVendorId: string): EditableCard {
	return {
		item,
		nameEdit: item.name,
		ageEdit: String(item.age),
		mbtiEdit: item.mbti ?? '',
		introEdit: item.introduction ?? '',
		currentPhotos: [...item.photoUrls],
		photoRegen: { selectedRefs: new Set(), prompt: '', vendorId: defaultVendorId },
		isSaved: false,
	};
}

function isCardDirty(card: EditableCard): boolean {
	return (
		card.nameEdit !== card.item.name ||
		card.ageEdit !== String(card.item.age) ||
		card.mbtiEdit !== (card.item.mbti ?? '') ||
		card.introEdit !== (card.item.introduction ?? '')
	);
}

/** Splice-based single-card update to avoid recreating all card objects */
function patchCard(
	setCards: React.Dispatch<React.SetStateAction<EditableCard[]>>,
	idx: number,
	patcher: (card: EditableCard) => EditableCard,
) {
	setCards((prev) => {
		const next = [...prev];
		next[idx] = patcher(prev[idx]);
		return next;
	});
}

export function GhostBatchCreateDialog({ open, onOpenChange }: GhostBatchCreateDialogProps) {
	const toast = useToast();
	const queryClient = useQueryClient();

	const [reason, setReason] = useState('');
	const [count, setCount] = useState(1);
	const [vendorId, setVendorId] = useState(DEFAULT_VENDOR_ID);
	const [result, setResult] = useState<BatchCreateResult | null>(null);
	const [cards, setCards] = useState<EditableCard[]>([]);
	const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

	useEffect(() => {
		if (open) {
			setReason('');
			setCount(1);
			setVendorId(DEFAULT_VENDOR_ID);
			setResult(null);
			setCards([]);
			setExpandedIdx(null);
		}
	}, [open]);

	const mutation = useMutation({
		mutationFn: () => {
			const vendor = findVendorOption(vendorId)?.value ?? DEFAULT_VENDOR;
			return ghostInjection.createBatch({ count, reason: reason.trim(), vendor });
		},
		onSuccess: (data) => {
			if (data) {
				setResult(data);
				const usedVendorId = GHOST_VENDOR_OPTIONS.find((o) => o.value === data.vendor && !o.disabled)?.id ?? DEFAULT_VENDOR_ID;
				setCards(data.results.filter((r) => r.status === 'success').map((r) => toEditableCard(r, usedVendorId)));
				toast.success(`${data.success}개 프로필이 생성되었습니다.`);
			}
			queryClient.invalidateQueries({ queryKey: ghostInjectionKeys.ghosts() });
			queryClient.invalidateQueries({ queryKey: ghostInjectionKeys.status() });
		},
		onError: (error) => toast.error(getAdminErrorMessage(error)),
	});

	const canSubmit = count > 0 && isReasonValid(reason) && !mutation.isPending;

	const updateCard = (idx: number, patch: Partial<EditableCard>) => {
		patchCard(setCards, idx, (c) => ({ ...c, ...patch }));
	};

	const failedItems = result?.results.filter((r) => r.status === 'failed') ?? [];

	return (
		<Dialog open={open} onOpenChange={(v) => { if (!mutation.isPending) onOpenChange(v); }}>
			<DialogContent className="flex h-[92vh] max-w-7xl flex-col p-0">
				{result ? (
					<ResultPhase
						result={result}
						cards={cards}
						failedItems={failedItems}
						expandedIdx={expandedIdx}
						setExpandedIdx={setExpandedIdx}
						updateCard={updateCard}
						setCards={setCards}
						onClose={() => onOpenChange(false)}
						onReset={() => { setResult(null); setCards([]); setExpandedIdx(null); }}
					/>
				) : (
					<FormPhase
						count={count}
						setCount={setCount}
						reason={reason}
						setReason={setReason}
						vendorId={vendorId}
						setVendorId={setVendorId}
						canSubmit={canSubmit}
						isPending={mutation.isPending}
						onSubmit={() => mutation.mutate()}
						onClose={() => onOpenChange(false)}
					/>
				)}
			</DialogContent>
		</Dialog>
	);
}

function FormPhase({
	count, setCount, reason, setReason, vendorId, setVendorId, canSubmit, isPending, onSubmit, onClose,
}: {
	count: number;
	setCount: (v: number) => void;
	reason: string;
	setReason: (v: string) => void;
	vendorId: string;
	setVendorId: (v: string) => void;
	canSubmit: boolean;
	isPending: boolean;
	onSubmit: () => void;
	onClose: () => void;
}) {
	return (
		<div className="flex flex-1 flex-col overflow-hidden">
			<div className="border-b px-6 py-4">
				<h2 className="text-lg font-semibold text-slate-900">가상 프로필 일괄 생성</h2>
				<p className="mt-1 text-sm text-slate-500">
					수량을 지정하면 이름, 나이, MBTI, 학교, 사진이 모두 자동으로 랜덤 생성됩니다.
				</p>
			</div>

			<div className="flex-1 overflow-y-auto px-6 py-6">
				<div className="mx-auto max-w-3xl space-y-6">
					<div className="grid grid-cols-1 gap-5 md:grid-cols-[auto_1fr]">
						<div className="space-y-1">
							<Label className="text-sm font-semibold text-slate-800">생성 수량 *</Label>
							<div className="flex items-center gap-2">
								<Button variant="outline" size="icon" className="h-9 w-9" disabled={count <= 1} onClick={() => setCount(Math.max(1, count - 1))}>
									<Minus className="h-3 w-3" />
								</Button>
								<Input
									type="number" min={1} max={50} value={count}
									onChange={(e) => { const v = Number(e.target.value); if (Number.isFinite(v) && v >= 1 && v <= 50) setCount(v); }}
									className="h-9 w-20 text-center tabular-nums"
								/>
								<Button variant="outline" size="icon" className="h-9 w-9" disabled={count >= 50} onClick={() => setCount(Math.min(50, count + 1))}>
									<Plus className="h-3 w-3" />
								</Button>
								<span className="text-xs text-slate-500">최대 50개</span>
							</div>
						</div>
						<ReasonInput value={reason} onChange={setReason} minLength={10} rows={2} />
					</div>

					<div className="border-t pt-5">
						<VendorRadioGroup selectedId={vendorId} onChange={setVendorId} columns={2} />
					</div>
				</div>
			</div>

			<div className="flex items-center justify-between border-t px-6 py-4">
				<p className="text-xs text-slate-500">
					{count}개 프로필이 랜덤으로 생성됩니다. AI 소개글 + 사진 생성으로 시간이 소요될 수 있습니다.
				</p>
				<div className="flex items-center gap-2">
					<Button variant="outline" onClick={onClose}>취소</Button>
					<Button onClick={onSubmit} disabled={!canSubmit}>
						{isPending ? <><Loader2 className="mr-1 h-4 w-4 animate-spin" /> 생성 중…</> : `${count}개 생성`}
					</Button>
				</div>
			</div>
		</div>
	);
}

export function ResultPhase({
	result, cards, failedItems, expandedIdx, setExpandedIdx, updateCard, setCards, onClose, onReset, imageSource,
}: {
	result: BatchCreateResult;
	cards: EditableCard[];
	failedItems: BatchCreateResultItem[];
	expandedIdx: number | null;
	setExpandedIdx: (v: number | null) => void;
	updateCard: (idx: number, patch: Partial<EditableCard>) => void;
	setCards: React.Dispatch<React.SetStateAction<EditableCard[]>>;
	onClose: () => void;
	onReset: () => void;
	imageSource?: ImageSource;
}) {
	const toast = useToast();
	const queryClient = useQueryClient();
	const [remainingFailed, setRemainingFailed] = useState<BatchCreateResultItem[]>(failedItems);

	useEffect(() => {
		setRemainingFailed(failedItems);
	}, [failedItems]);

	const retryMutation = useMutation({
		mutationFn: () => {
			if (remainingFailed.length === 0) throw new Error('재시도할 항목이 없습니다.');
			return ghostInjection.createBatch({
				count: remainingFailed.length,
				reason: BATCH_RETRY_REASON,
				vendor: result.vendor,
			});
		},
		onSuccess: (data) => {
			if (!data) return;
			const usedVendorId =
				GHOST_VENDOR_OPTIONS.find((o) => o.value === data.vendor && !o.disabled)?.id ??
				DEFAULT_VENDOR_ID;
			const newCards = data.results
				.filter((r) => r.status === 'success')
				.map((r) => toEditableCard(r, usedVendorId));
			setCards((prev) => [...prev, ...newCards]);
			setRemainingFailed(data.results.filter((r) => r.status === 'failed'));
			toast.success(
				`재시도 완료: 성공 ${data.success}개${data.failed > 0 ? ` / 실패 ${data.failed}개` : ''}`,
			);
			queryClient.invalidateQueries({ queryKey: ghostInjectionKeys.ghosts() });
			queryClient.invalidateQueries({ queryKey: ghostInjectionKeys.status() });
		},
		onError: (error) => toast.error(getAdminErrorMessage(error)),
	});

	return (
		<div className="flex flex-1 flex-col overflow-hidden">
			<div className="border-b px-6 py-4">
				<div className="flex items-center gap-2">
					<h2 className="text-lg font-semibold text-slate-900">생성 결과</h2>
					<Badge variant="outline" className="text-xs">
						{result.vendor}
					</Badge>
				</div>
				<p className="mt-1 text-sm text-slate-500">
					성공 <span className="font-medium text-emerald-600">{result.success}</span>
					{result.failed > 0 && <> / 실패 <span className="font-medium text-red-600">{result.failed}</span></>}
					{' '}/ 전체 {result.total}
					<span className="ml-3 text-slate-400">카드를 클릭하여 프로필을 수정하거나 사진을 재생성할 수 있습니다.</span>
				</p>
			</div>

			<div className="flex flex-1 overflow-hidden">
				<div className={cn(
					'overflow-y-auto p-4 transition-all',
					expandedIdx !== null ? 'w-1/2 border-r' : 'w-full',
				)}>
					{remainingFailed.length > 0 && (
						<div className="mb-4 space-y-1.5">
							<div className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 px-3 py-2">
								<div className="flex items-center gap-2 text-xs text-red-700">
									<XCircle className="h-4 w-4 shrink-0" />
									<span className="font-medium">
										실패 {remainingFailed.length}개
									</span>
								</div>
								<Button
									size="sm"
									variant="outline"
									className="h-7 border-red-300 text-xs text-red-700 hover:bg-red-100"
									disabled={retryMutation.isPending}
									onClick={() => retryMutation.mutate()}
								>
									{retryMutation.isPending ? (
										<><Loader2 className="mr-1 h-3 w-3 animate-spin" /> 재시도 중…</>
									) : (
										<><RefreshCw className="mr-1 h-3 w-3" /> 실패 {remainingFailed.length}개 재시도</>
									)}
								</Button>
							</div>
							{remainingFailed.map((item, idx) => (
								<div key={`fail-${idx}`} className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
									<XCircle className="h-4 w-4 shrink-0" />
									<span>{item.error ?? '생성 실패'}</span>
								</div>
							))}
						</div>
					)}

					<div className={cn(
						'grid gap-3',
						expandedIdx !== null ? 'grid-cols-2' : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4',
					)}>
						{cards.map((card, idx) => (
							<ProfileCard
								key={card.item.ghostAccountId ?? idx}
								card={card}
								isExpanded={expandedIdx === idx}
								onClick={() => setExpandedIdx(expandedIdx === idx ? null : idx)}
							/>
						))}
					</div>
				</div>

				{expandedIdx !== null && cards[expandedIdx] && (
					<EditPanel
						card={cards[expandedIdx]}
						cardIdx={expandedIdx}
						totalCards={cards.length}
						updateCard={updateCard}
						setCards={setCards}
						onNavigate={(dir) => {
							const next = expandedIdx + dir;
							if (next >= 0 && next < cards.length) setExpandedIdx(next);
						}}
						onClose={() => setExpandedIdx(null)}
						imageSource={imageSource}
					/>
				)}
			</div>

			<div className="flex items-center justify-end gap-2 border-t px-6 py-4">
				<Button variant="outline" onClick={onReset}>추가 생성</Button>
				<Button onClick={onClose}>닫기</Button>
			</div>
		</div>
	);
}

function ProfileCard({ card, isExpanded, onClick }: {
	card: EditableCard;
	isExpanded: boolean;
	onClick: () => void;
}) {
	const { item, currentPhotos, isSaved } = card;
	const mainPhoto = currentPhotos[0] ?? null;
	const dirty = isCardDirty(card);

	return (
		<div
			className={cn(
				'group cursor-pointer overflow-hidden rounded-xl border transition-all hover:shadow-md',
				isExpanded ? 'ring-2 ring-slate-900 ring-offset-1' : 'hover:border-slate-300',
				isSaved && 'border-emerald-300',
			)}
			onClick={onClick}
		>
			<div className="relative aspect-[3/4] bg-slate-100">
				{mainPhoto ? (
					// eslint-disable-next-line @next/next/no-img-element
					<img src={mainPhoto} alt={item.name} className="h-full w-full object-cover" />
				) : (
					<div className="flex h-full w-full items-center justify-center text-slate-300">
						<ImageOff className="h-10 w-10" />
					</div>
				)}

				<RankBadge rank={item.rank} className="absolute left-2 top-2 backdrop-blur-sm" />

				{currentPhotos.length > 1 && (
					<div className="absolute right-2 top-2 rounded-full bg-black/50 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
						{currentPhotos.length}장
					</div>
				)}

				{dirty && !isSaved && (
					<div className="absolute bottom-2 right-2 rounded-full bg-amber-500 p-1.5">
						<Pencil className="h-3 w-3 text-white" />
					</div>
				)}
				{isSaved && (
					<div className="absolute bottom-2 right-2 rounded-full bg-emerald-500 p-1.5">
						<Check className="h-3 w-3 text-white" />
					</div>
				)}
			</div>

			<div className="space-y-1 p-2.5">
				<div className="flex items-baseline justify-between">
					<span className="text-sm font-semibold text-slate-900">{card.nameEdit || item.name}</span>
					<span className="text-[11px] text-slate-500">만 {card.ageEdit || item.age}세</span>
				</div>
				<div className="flex items-center gap-1.5">
					<span className="text-xs text-slate-500">{card.mbtiEdit || item.mbti}</span>
					{item.university && (
						<span className="truncate text-xs text-slate-400">{item.university.name}</span>
					)}
				</div>
			</div>
		</div>
	);
}

function EditPanel({ card, cardIdx, totalCards, updateCard, setCards, onNavigate, onClose, imageSource }: {
	card: EditableCard;
	cardIdx: number;
	totalCards: number;
	updateCard: (idx: number, patch: Partial<EditableCard>) => void;
	setCards: React.Dispatch<React.SetStateAction<EditableCard[]>>;
	onNavigate: (dir: -1 | 1) => void;
	onClose: () => void;
	imageSource?: ImageSource;
}) {
	const toast = useToast();
	const queryClient = useQueryClient();
	const { item } = card;
	const ghostAccountId = item.ghostAccountId;
	const dirty = isCardDirty(card);

	const saveMutation = useMutation({
		mutationFn: () => {
			if (!ghostAccountId) throw new Error('ghostAccountId 없음');
			const fields: Record<string, unknown> = {};
			if (card.nameEdit !== item.name) fields.name = card.nameEdit.trim();
			if (card.ageEdit !== String(item.age)) fields.age = Number(card.ageEdit);
			if (card.mbtiEdit !== (item.mbti ?? '')) fields.mbti = card.mbtiEdit.trim();
			if (card.introEdit !== (item.introduction ?? '')) fields.introduction = card.introEdit.trim();
			if (Object.keys(fields).length === 0) throw new Error('변경된 항목이 없습니다.');
			return ghostInjection.updateGhost(ghostAccountId, {
				fieldsToUpdate: fields as { name?: string; age?: number; mbti?: string; introduction?: string },
				reason: BATCH_EDIT_REASON,
			});
		},
		onSuccess: () => {
			toast.success('프로필이 수정되었습니다.');
			updateCard(cardIdx, { isSaved: true });
			queryClient.invalidateQueries({ queryKey: ghostInjectionKeys.ghosts() });
		},
		onError: (error) => toast.error(getAdminErrorMessage(error)),
	});

	const regenVendor: ImageVendor = findVendorOption(card.photoRegen.vendorId)?.value ?? DEFAULT_VENDOR;
	const canUseReference = vendorSupportsReference(regenVendor);

	const regenMutation = useMutation({
		mutationFn: () => {
			if (!ghostAccountId) throw new Error('ghostAccountId 없음');
			const refs = canUseReference
				? Array.from(card.photoRegen.selectedRefs).map((i) => card.currentPhotos[i]).filter(Boolean)
				: [];
			return ghostInjection.regeneratePhotos(ghostAccountId, {
				prompt: card.photoRegen.prompt.trim() || undefined,
				referencePhotoUrls: refs.length > 0 ? refs : undefined,
				reason: PHOTO_REGEN_REASON,
				vendor: regenVendor,
			});
		},
		onSuccess: (data) => {
			if (data) {
				patchCard(setCards, cardIdx, (c) => ({
					...c,
					currentPhotos: data.photos.map((p) => p.url),
					photoRegen: { ...c.photoRegen, selectedRefs: new Set(), prompt: '' },
				}));
				toast.success('사진이 재생성되었습니다.');
			}
			queryClient.invalidateQueries({ queryKey: ghostInjectionKeys.ghosts() });
		},
		onError: (error) => toast.error(getAdminErrorMessage(error)),
	});

	const setRegenVendorId = (id: string) => {
		patchCard(setCards, cardIdx, (c) => ({
			...c,
			photoRegen: { ...c.photoRegen, vendorId: id, selectedRefs: new Set() },
		}));
	};

	const togglePhotoRef = (photoIdx: number) => {
		patchCard(setCards, cardIdx, (c) => {
			const next = new Set(c.photoRegen.selectedRefs);
			if (next.has(photoIdx)) next.delete(photoIdx);
			else next.add(photoIdx);
			return { ...c, photoRegen: { ...c.photoRegen, selectedRefs: next } };
		});
	};

	const setRegenPrompt = (prompt: string) => {
		patchCard(setCards, cardIdx, (c) => ({
			...c,
			photoRegen: { ...c.photoRegen, prompt },
		}));
	};

	return (
		<div className="flex w-1/2 flex-col overflow-hidden">
			<div className="flex items-center justify-between border-b px-4 py-3">
				<div className="flex items-center gap-2">
					<Button variant="ghost" size="icon" className="h-7 w-7" disabled={cardIdx <= 0} onClick={() => onNavigate(-1)}>
						<ChevronLeft className="h-4 w-4" />
					</Button>
					<span className="text-sm font-medium text-slate-700">
						{cardIdx + 1} / {totalCards}
					</span>
					<Button variant="ghost" size="icon" className="h-7 w-7" disabled={cardIdx >= totalCards - 1} onClick={() => onNavigate(1)}>
						<ChevronRight className="h-4 w-4" />
					</Button>
				</div>
				<Button variant="ghost" size="sm" onClick={onClose}>닫기</Button>
			</div>

			<div className="flex-1 space-y-5 overflow-y-auto px-4 py-4">
				<section className="space-y-3">
					<h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">사진</h4>
					<div className="grid grid-cols-3 gap-2">
						{card.currentPhotos.map((url, photoIdx) => {
							const isRef = canUseReference && card.photoRegen.selectedRefs.has(photoIdx);
							return (
								<div
									key={photoIdx}
									className={cn(
										'relative aspect-[3/4] overflow-hidden rounded-lg border-2 transition-all',
										canUseReference ? 'cursor-pointer' : 'cursor-default',
										isRef ? 'border-blue-500 ring-2 ring-blue-200' : 'border-transparent',
										canUseReference && !isRef && 'hover:border-slate-300',
									)}
									onClick={() => canUseReference && togglePhotoRef(photoIdx)}
								>
									{/* eslint-disable-next-line @next/next/no-img-element */}
									<img src={url} alt={`사진 ${photoIdx + 1}`} className="h-full w-full object-cover" />
									{isRef && (
										<div className="absolute inset-0 flex items-center justify-center bg-blue-500/20">
											<div className="rounded-full bg-blue-500 p-1">
												<Check className="h-3.5 w-3.5 text-white" />
											</div>
										</div>
									)}
									<div className="absolute bottom-1 left-1 rounded bg-black/60 px-1 py-0.5 text-[10px] text-white">
										{photoIdx + 1}
									</div>
								</div>
							);
						})}
						{card.currentPhotos.length === 0 && (
							<div className="col-span-3 flex aspect-[3/4] items-center justify-center rounded-lg border-2 border-dashed border-slate-200 text-slate-400">
								<ImageOff className="h-8 w-8" />
							</div>
						)}
					</div>

					{imageSource === 'manual-upload' ? (
						<div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-500">
							외부 업로드 이미지입니다. 사진 재생성은 지원되지 않습니다. 사진을 변경하려면 미리보기 단계로 돌아가 다시 업로드하세요.
						</div>
					) : (
						<div className="space-y-3 rounded-lg border border-blue-200 bg-blue-50/50 p-3">
							<div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
								<Sparkles className="h-3.5 w-3.5 text-blue-500" />
								<span>사진 재생성</span>
								{canUseReference && card.photoRegen.selectedRefs.size > 0 && (
									<Badge variant="secondary" className="text-[10px]">
										레퍼런스 {card.photoRegen.selectedRefs.size}장 선택
									</Badge>
								)}
							</div>

							<div className="space-y-1">
								<Label className="text-[11px] font-semibold text-slate-600">이미지 모델</Label>
								<Select value={card.photoRegen.vendorId} onValueChange={setRegenVendorId}>
									<SelectTrigger className="h-9 text-xs">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										{vendorOptionsForSelect().map((option) => (
											<SelectItem key={option.id} value={option.id}>
												<div className="flex items-center gap-1.5">
													<span className="font-medium">{option.label}</span>
													<span className="text-[10px] text-slate-400">{option.pricePerImage}</span>
													{option.supportsReference && (
														<span className="text-[10px] text-blue-600">img2img</span>
													)}
												</div>
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>

							<div className="space-y-1">
								<div className="flex items-center justify-between">
									<Label className="text-[11px] font-semibold text-slate-600">프롬프트 (선택)</Label>
									<GhostPromptPreviewModal
										age={item.age}
										vendor={regenVendor}
										trigger={
											<Button variant="ghost" size="sm" className="h-6 px-2 text-[10px] text-slate-500">
												프롬프트 미리보기
											</Button>
										}
									/>
								</div>
								<Textarea
									value={card.photoRegen.prompt}
									onChange={(e) => setRegenPrompt(e.target.value)}
									placeholder="예: 자연스러운 셀카, 밝은 조명. 비워두면 기본 프롬프트가 사용됩니다."
									rows={2}
									className="text-xs"
								/>
							</div>

							<p className="text-[11px] text-slate-500">
								{canUseReference
									? '위 사진을 클릭하면 레퍼런스로 선택됩니다. 선택된 사진의 분위기/스타일을 참고하여 재생성합니다.'
									: `${findVendorOption(card.photoRegen.vendorId)?.label ?? '이 모델'}은 레퍼런스 이미지(img2img)를 지원하지 않습니다.`}
							</p>

							<Button
								size="sm"
								className="w-full"
								disabled={regenMutation.isPending || !ghostAccountId}
								onClick={() => regenMutation.mutate()}
							>
								{regenMutation.isPending ? (
									<><Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> 재생성 중…</>
								) : (
									<><RefreshCw className="mr-1 h-3.5 w-3.5" /> 사진 재생성</>
								)}
							</Button>
						</div>
					)}
				</section>

				<section className="space-y-3">
					<h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">프로필 수정</h4>

					<div className="grid grid-cols-2 gap-3">
						<div className="space-y-1">
							<Label className="text-xs">이름</Label>
							<Input
								value={card.nameEdit}
								onChange={(e) => updateCard(cardIdx, { nameEdit: e.target.value })}
								className="h-8 text-sm"
							/>
						</div>
						<div className="space-y-1">
							<Label className="text-xs">나이</Label>
							<Input
								type="number" min={18} max={60}
								value={card.ageEdit}
								onChange={(e) => updateCard(cardIdx, { ageEdit: e.target.value })}
								className="h-8 text-sm"
							/>
						</div>
						<div className="space-y-1">
							<Label className="text-xs">MBTI</Label>
							<Input
								value={card.mbtiEdit}
								onChange={(e) => updateCard(cardIdx, { mbtiEdit: e.target.value.toUpperCase() })}
								maxLength={4}
								className="h-8 text-sm"
								placeholder="예: ENFP"
							/>
						</div>
						<div className="space-y-1">
							<Label className="text-xs">등급</Label>
							<div className="flex h-8 items-center">
								<RankBadge rank={item.rank} className="text-xs" />
							</div>
						</div>
					</div>

					<div className="space-y-1">
						<Label className="text-xs">자기소개</Label>
						<Textarea
							value={card.introEdit}
							onChange={(e) => updateCard(cardIdx, { introEdit: e.target.value })}
							rows={3}
							className="text-sm"
						/>
					</div>

					<div className="grid grid-cols-2 gap-2 rounded-md border bg-slate-50 p-2.5 text-xs">
						<div>
							<span className="text-slate-400">대학</span>
							<div className="font-medium text-slate-700">{item.university?.name ?? '—'}</div>
						</div>
						<div>
							<span className="text-slate-400">학과</span>
							<div className="font-medium text-slate-700">{item.department?.name ?? '—'}</div>
						</div>
					</div>
				</section>
			</div>

			<div className="flex items-center justify-between border-t px-4 py-3">
				<div className="text-xs text-slate-400">
					{card.isSaved && <span className="text-emerald-600">저장됨</span>}
					{dirty && !card.isSaved && <span className="text-amber-600">수정됨 (미저장)</span>}
				</div>
				<Button
					size="sm"
					disabled={!dirty || saveMutation.isPending || !ghostAccountId}
					onClick={() => saveMutation.mutate()}
				>
					{saveMutation.isPending ? (
						<><Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> 저장 중…</>
					) : (
						'변경 저장'
					)}
				</Button>
			</div>
		</div>
	);
}
