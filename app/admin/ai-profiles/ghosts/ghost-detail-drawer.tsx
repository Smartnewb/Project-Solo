'use client';

import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, RefreshCw, Sparkles, Trash2 } from 'lucide-react';
import { ghostInjection } from '@/app/services/admin/ghost-injection';
import type { GhostDetail, ImageVendor, UpdateGhostFields } from '@/app/types/ghost-injection';
import { getAdminErrorMessage } from '@/shared/lib/http/admin-fetch';
import { useConfirm } from '@/shared/ui/admin/confirm-dialog';
import { useToast } from '@/shared/ui/admin/toast';
import { Alert, AlertDescription } from '@/shared/ui/alert';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/shared/ui/select';
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from '@/shared/ui/sheet';
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
import { ReasonInput, isReasonValid } from '../_shared/reason-input';
import { ghostInjectionKeys } from '../_shared/query-keys';
import { GhostPhotoSlot } from './ghost-photo-slot';
import { GhostStatusBadge } from './ghost-status-badge';

const PHOTO_REGEN_REASON = '사진 재생성';

interface GhostDetailDrawerProps {
	ghostAccountId: string | null;
	onClose: () => void;
}

interface FormState {
	name: string;
	age: string;
	mbti: string;
	introduction: string;
	reason: string;
}

function emptyForm(): FormState {
	return { name: '', age: '', mbti: '', introduction: '', reason: '' };
}

function toForm(detail: GhostDetail | undefined): FormState {
	if (!detail) return emptyForm();
	return {
		name: detail.name,
		age: String(detail.age),
		mbti: detail.mbti ?? '',
		introduction: detail.introduction ?? '',
		reason: '',
	};
}

function formatDate(value: string): string {
	try {
		return new Date(value).toLocaleString('ko-KR');
	} catch {
		return value;
	}
}

function buildFieldsToUpdate(
	state: FormState,
	original: GhostDetail,
): UpdateGhostFields {
	const fields: UpdateGhostFields = {};
	if (state.name.trim() && state.name.trim() !== original.name) {
		fields.name = state.name.trim();
	}
	const ageNum = Number(state.age);
	if (Number.isFinite(ageNum) && ageNum !== original.age) {
		fields.age = ageNum;
	}
	if (state.mbti.trim() !== (original.mbti ?? '')) {
		fields.mbti = state.mbti.trim();
	}
	if (state.introduction.trim() !== (original.introduction ?? '')) {
		fields.introduction = state.introduction.trim();
	}
	return fields;
}

const PHOTO_SLOTS = [0, 1, 2];

export function GhostDetailDrawer({ ghostAccountId, onClose }: GhostDetailDrawerProps) {
	const toast = useToast();
	const confirm = useConfirm();
	const queryClient = useQueryClient();
	const [form, setForm] = useState<FormState>(emptyForm);
	const [deleteReason, setDeleteReason] = useState('');

	const detailQuery = useQuery({
		queryKey: ghostInjectionKeys.ghostDetail(ghostAccountId ?? ''),
		queryFn: () => ghostInjection.getGhost(ghostAccountId as string),
		enabled: Boolean(ghostAccountId),
	});

	const detail = detailQuery.data;

	useEffect(() => {
		setForm(detail ? toForm(detail) : emptyForm());
	}, [detail]);

	const fieldsToUpdate = useMemo(
		() => (detail ? buildFieldsToUpdate(form, detail) : {}),
		[form, detail],
	);

	const mutation = useMutation({
		mutationFn: () => {
			if (!ghostAccountId) throw new Error('프로필 ID 없음');
			if (Object.keys(fieldsToUpdate).length === 0) {
				throw new Error('변경된 항목이 없습니다.');
			}
			return ghostInjection.updateGhost(ghostAccountId, {
				fieldsToUpdate,
				reason: form.reason.trim(),
			});
		},
		onSuccess: () => {
			toast.success('가상 프로필이 수정되었습니다.');
			queryClient.invalidateQueries({
				queryKey: ghostInjectionKeys.ghostDetail(ghostAccountId ?? ''),
			});
			queryClient.invalidateQueries({ queryKey: ghostInjectionKeys.ghosts() });
			setForm((prev) => ({ ...prev, reason: '' }));
		},
		onError: (error) => toast.error(getAdminErrorMessage(error)),
	});

	const canSubmit =
		Object.keys(fieldsToUpdate).length > 0 && isReasonValid(form.reason) && !mutation.isPending;

	const deleteMutation = useMutation({
		mutationFn: () => {
			if (!ghostAccountId) throw new Error('프로필 ID 없음');
			return ghostInjection.deleteGhost(ghostAccountId, { reason: deleteReason.trim() });
		},
		onSuccess: () => {
			toast.success('가상 프로필이 삭제되었습니다.');
			queryClient.invalidateQueries({ queryKey: ghostInjectionKeys.ghosts() });
			onClose();
		},
		onError: (error) => toast.error(getAdminErrorMessage(error)),
	});

	const handleDelete = async () => {
		const ok = await confirm({
			title: '가상 프로필 영구 삭제',
			message:
				'삭제하면 복구할 수 없습니다. 이 ghost와 매칭된 실사용자에게는 탈퇴한 사용자로 표시됩니다.',
			severity: 'error',
			confirmText: '영구 삭제',
		});
		if (!ok) return;
		deleteMutation.mutate();
	};

	return (
		<Sheet open={Boolean(ghostAccountId)} onOpenChange={(open) => !open && onClose()}>
			<SheetContent side="right" className="w-full overflow-y-auto sm:max-w-2xl">
				<SheetHeader>
					<SheetTitle>{detail?.name ?? '프로필 상세'}</SheetTitle>
					<SheetDescription>
						{detail ? `ID: ${detail.ghostAccountId}` : '가상 프로필 상세 정보 및 편집'}
					</SheetDescription>
				</SheetHeader>

				<div className="mt-6 space-y-6">
					{detailQuery.isLoading ? (
						<div className="py-12 text-center text-sm text-slate-500">불러오는 중…</div>
					) : detailQuery.isError || !detail ? (
						<Alert variant="destructive">
							<AlertDescription>상세 정보를 불러오지 못했습니다.</AlertDescription>
						</Alert>
					) : (
						<>
							<section className="space-y-2">
								<div className="flex items-center gap-2">
									<h3 className="text-sm font-semibold text-slate-900">프로필 요약</h3>
									<GhostStatusBadge status={detail.status} isExhausted={detail.isExhausted} />
								</div>
								<div className="grid grid-cols-2 gap-2 rounded-md border bg-slate-50 p-3 text-xs">
									<div>
										<span className="text-slate-500">대학</span>
										<div className="font-medium text-slate-800">
											{detail.university?.name ?? '—'}
										</div>
									</div>
									<div>
										<span className="text-slate-500">학과</span>
										<div className="font-medium text-slate-800">
											{detail.department?.name ?? '—'}
										</div>
									</div>
									<div>
										<span className="text-slate-500">등급</span>
										<div className="font-medium text-slate-800">{detail.rank}</div>
									</div>
									<div>
										<span className="text-slate-500">생성일</span>
										<div className="font-medium text-slate-800">{formatDate(detail.createdAt)}</div>
									</div>
								</div>
							</section>

							<section className="space-y-2">
								<h3 className="text-sm font-semibold text-slate-900">노출 통계</h3>
								<div className="grid grid-cols-4 gap-2 rounded-md border bg-slate-50 p-3 text-center text-xs">
									<div>
										<div className="text-slate-500">노출</div>
										<div className="text-base font-semibold tabular-nums text-slate-800">
											{detail.exposureStats.totalShown}
										</div>
									</div>
									<div>
										<div className="text-slate-500">수락</div>
										<div className="text-base font-semibold tabular-nums text-slate-800">
											{detail.exposureStats.totalAccepted}
										</div>
									</div>
									<div>
										<div className="text-slate-500">신고</div>
										<div className="text-base font-semibold tabular-nums text-red-600">
											{detail.exposureStats.totalReported}
										</div>
									</div>
									<div>
										<div className="text-slate-500">최근</div>
										<div className="text-xs text-slate-700">
											{detail.exposureStats.lastShownAt
												? formatDate(detail.exposureStats.lastShownAt)
												: '—'}
										</div>
									</div>
								</div>
							</section>

							{detail.keywords && detail.keywords.length > 0 && (
								<section className="space-y-2">
									<h3 className="text-sm font-semibold text-slate-900">키워드</h3>
									<div className="flex flex-wrap gap-1.5">
										{detail.keywords.map((kw) => (
											<Badge key={kw} variant="outline" className="text-xs">
												{kw}
											</Badge>
										))}
									</div>
								</section>
							)}

							<section className="space-y-3">
								<h3 className="text-sm font-semibold text-slate-900">프로필 편집</h3>
								<div className="grid grid-cols-2 gap-3">
									<div className="space-y-1">
										<Label htmlFor="ghost-name" className="text-xs">
											이름
										</Label>
										<Input
											id="ghost-name"
											value={form.name}
											onChange={(event) => setForm({ ...form, name: event.target.value })}
										/>
									</div>
									<div className="space-y-1">
										<Label htmlFor="ghost-age" className="text-xs">
											나이
										</Label>
										<Input
											id="ghost-age"
											type="number"
											min={18}
											max={60}
											value={form.age}
											onChange={(event) => setForm({ ...form, age: event.target.value })}
										/>
									</div>
									<div className="col-span-2 space-y-1">
										<Label htmlFor="ghost-mbti" className="text-xs">
											MBTI
										</Label>
										<Input
											id="ghost-mbti"
											value={form.mbti}
											onChange={(event) => setForm({ ...form, mbti: event.target.value.toUpperCase() })}
											placeholder="예: ENFP"
											maxLength={4}
										/>
									</div>
									<div className="col-span-2 space-y-1">
										<div className="flex items-center gap-2">
										<Label htmlFor="ghost-intro" className="text-xs">
											자기소개
										</Label>
										{detail.introductionSource === 'ai' && (
											<Badge variant="outline" className="border-violet-200 bg-violet-50 text-[10px] text-violet-700">
												AI 생성
											</Badge>
										)}
									</div>
										<Textarea
											id="ghost-intro"
											rows={3}
											value={form.introduction}
											onChange={(event) => setForm({ ...form, introduction: event.target.value })}
										/>
									</div>
								</div>
								<ReasonInput
									value={form.reason}
									onChange={(value) => setForm({ ...form, reason: value })}
									minLength={10}
									rows={2}
								/>
								<div className="flex justify-end">
									<Button onClick={() => mutation.mutate()} disabled={!canSubmit}>
										{mutation.isPending ? '저장 중…' : '변경 사항 저장'}
									</Button>
								</div>
							</section>

							<section className="space-y-3">
								<h3 className="text-sm font-semibold text-slate-900">사진 슬롯</h3>
								<div className="grid grid-cols-3 gap-3">
									{PHOTO_SLOTS.map((slotIndex) => {
										const photo = detail.photos.find((item) => item.slotIndex === slotIndex);
										return (
											<GhostPhotoSlot
												key={slotIndex}
												ghostAccountId={detail.ghostAccountId}
												slotIndex={slotIndex}
												photo={photo}
												ghostAge={detail.age}
											/>
										);
									})}
								</div>
								<p className="text-xs text-slate-500">
									현재 {detail.photos.length}개 슬롯 사용 중. 슬롯 단위로 이미지 ID를 입력하여 교체합니다.
								</p>
							</section>

							<PhotoRegenerationSection detail={detail} />

							<section className="space-y-2">
								<h3 className="text-sm font-semibold text-slate-900">최근 감사 로그</h3>
								{detail.recentAuditEvents.length === 0 ? (
									<p className="text-xs text-slate-500">기록된 이벤트가 없습니다.</p>
								) : (
									<ul className="space-y-1.5">
										{detail.recentAuditEvents.map((event) => (
											<li
												key={event.id}
												className="rounded-md border bg-slate-50 px-3 py-2 text-xs text-slate-600"
											>
												<div className="flex items-center justify-between">
													<span className="font-medium text-slate-800">{event.actionName}</span>
													<span className="text-slate-500">{formatDate(event.createdAt)}</span>
												</div>
												{event.reason ? (
													<div className="mt-1 text-slate-600">{event.reason}</div>
												) : null}
												<div className="mt-0.5 text-slate-500">by {event.actor ?? '—'}</div>
											</li>
										))}
									</ul>
								)}
							</section>

							<section className="space-y-3 rounded-lg border border-red-200 bg-red-50 p-4">
								<div className="flex items-center gap-2">
									<Trash2 className="h-4 w-4 text-red-600" />
									<h3 className="text-sm font-semibold text-red-700">위험 구역 — 계정 삭제</h3>
								</div>
								<p className="text-xs text-red-600">
									삭제 후 복구 불가. 매칭된 실사용자 앱에서 상대방이 탈퇴한 것으로 표시됩니다.
								</p>
								<ReasonInput
									value={deleteReason}
									onChange={setDeleteReason}
									minLength={10}
									rows={2}
								/>
								<Button
									variant="destructive"
									size="sm"
									className="w-full"
									disabled={!isReasonValid(deleteReason) || deleteMutation.isPending}
									onClick={handleDelete}
								>
									{deleteMutation.isPending ? (
										<><Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> 삭제 중…</>
									) : (
										<><Trash2 className="mr-1 h-3.5 w-3.5" /> 가상 프로필 영구 삭제</>
									)}
								</Button>
							</section>
						</>
					)}
				</div>
			</SheetContent>
		</Sheet>
	);
}

function PhotoRegenerationSection({ detail }: { detail: GhostDetail }) {
	const toast = useToast();
	const queryClient = useQueryClient();
	const [vendorId, setVendorId] = useState(DEFAULT_VENDOR_ID);
	const [prompt, setPrompt] = useState('');
	const [selectedRefs, setSelectedRefs] = useState<Set<string>>(new Set());
	const [reason, setReason] = useState('');

	const vendor: ImageVendor = findVendorOption(vendorId)?.value ?? DEFAULT_VENDOR;
	const canUseReference = vendorSupportsReference(vendor);

	const mutation = useMutation({
		mutationFn: () =>
			ghostInjection.regeneratePhotos(detail.ghostAccountId, {
				prompt: prompt.trim() || undefined,
				referencePhotoUrls: canUseReference && selectedRefs.size > 0 ? Array.from(selectedRefs) : undefined,
				reason: reason.trim() || PHOTO_REGEN_REASON,
				vendor,
			}),
		onSuccess: () => {
			toast.success('사진이 재생성되었습니다.');
			setPrompt('');
			setSelectedRefs(new Set());
			setReason('');
			queryClient.invalidateQueries({ queryKey: ghostInjectionKeys.ghostDetail(detail.ghostAccountId) });
			queryClient.invalidateQueries({ queryKey: ghostInjectionKeys.ghosts() });
		},
		onError: (error) => toast.error(getAdminErrorMessage(error)),
	});

	const toggleRef = (url: string) => {
		setSelectedRefs((prev) => {
			const next = new Set(prev);
			if (next.has(url)) next.delete(url);
			else next.add(url);
			return next;
		});
	};

	const handleVendorChange = (id: string) => {
		setVendorId(id);
		setSelectedRefs(new Set());
	};

	return (
		<section className="space-y-3">
			<div className="flex items-center gap-2">
				<h3 className="text-sm font-semibold text-slate-900">사진 재생성</h3>
				<Sparkles className="h-3.5 w-3.5 text-amber-500" />
			</div>

			<div className="space-y-3 rounded-lg border border-dashed border-slate-200 bg-slate-50 p-3">
				<div className="space-y-1">
					<Label className="text-xs">벤더</Label>
					<Select value={vendorId} onValueChange={handleVendorChange}>
						<SelectTrigger className="h-8 text-xs">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{vendorOptionsForSelect().map((option) => (
								<SelectItem key={option.id} value={option.id}>
									<div className="flex items-center gap-1.5">
										<span>{option.label}</span>
										<span className="text-[10px] text-slate-400">{option.pricePerImage}</span>
									</div>
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>

				{canUseReference && detail.photos.length > 0 && (
					<div className="space-y-1">
						<Label className="text-xs">
							레퍼런스 이미지 ({selectedRefs.size}장 선택)
						</Label>
						<div className="grid grid-cols-3 gap-1.5">
							{detail.photos.map((photo) => {
								const isRef = selectedRefs.has(photo.url);
								return (
									<div
										key={photo.imageId}
										onClick={() => toggleRef(photo.url)}
										className={cn(
											'relative aspect-square cursor-pointer overflow-hidden rounded-md border-2',
											isRef ? 'border-blue-500 ring-1 ring-blue-200' : 'border-transparent hover:border-slate-300',
										)}
									>
										{/* eslint-disable-next-line @next/next/no-img-element */}
										<img src={photo.url} alt={`슬롯 ${photo.slotIndex}`} className="h-full w-full object-cover" />
										{isRef && <div className="absolute inset-0 bg-blue-500/20" />}
									</div>
								);
							})}
						</div>
					</div>
				)}

				<div className="space-y-1">
					<Label className="text-xs">프롬프트 (선택)</Label>
					<Textarea
						value={prompt}
						onChange={(e) => setPrompt(e.target.value)}
						placeholder="비워두면 프로필 정보 기반 기본 프롬프트가 사용됩니다."
						rows={2}
						className="text-xs"
					/>
				</div>

				<ReasonInput value={reason} onChange={setReason} minLength={10} rows={2} />

				{!canUseReference && (
					<p className="text-[11px] text-slate-400">
						{findVendorOption(vendorId)?.label ?? '이 벤더'}는 레퍼런스 이미지(img2img)를 지원하지 않습니다.
					</p>
				)}

				<Button
					size="sm"
					variant="outline"
					className="w-full"
					disabled={mutation.isPending || !isReasonValid(reason)}
					onClick={() => mutation.mutate()}
				>
					{mutation.isPending ? (
						<><Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> 재생성 중…</>
					) : (
						<><RefreshCw className="mr-1 h-3.5 w-3.5" /> 사진 재생성</>
					)}
				</Button>
			</div>
		</section>
	);
}
