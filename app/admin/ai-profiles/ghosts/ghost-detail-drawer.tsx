'use client';

import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ghostInjection } from '@/app/services/admin/ghost-injection';
import type { GhostDetail, UpdateGhostFields } from '@/app/types/ghost-injection';
import { getAdminErrorMessage } from '@/shared/lib/http/admin-fetch';
import { useToast } from '@/shared/ui/admin/toast';
import { Alert, AlertDescription } from '@/shared/ui/alert';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from '@/shared/ui/sheet';
import { Textarea } from '@/shared/ui/textarea';
import { ReasonInput, isReasonValid } from '../_shared/reason-input';
import { ghostInjectionKeys } from '../_shared/query-keys';
import { GhostPhotoSlot } from './ghost-photo-slot';
import { GhostStatusBadge } from './ghost-status-badge';

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

const PHOTO_SLOTS = [0, 1, 2, 3, 4, 5];

export function GhostDetailDrawer({ ghostAccountId, onClose }: GhostDetailDrawerProps) {
	const toast = useToast();
	const queryClient = useQueryClient();
	const [form, setForm] = useState<FormState>(emptyForm);

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
										<span className="text-slate-500">프로필 유형</span>
										<div className="font-medium text-slate-800">
											{detail.archetype?.name ?? '—'}
										</div>
									</div>
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
										<Label htmlFor="ghost-intro" className="text-xs">
											자기소개
										</Label>
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
											/>
										);
									})}
								</div>
								<p className="text-xs text-slate-500">
									현재 {detail.photos.length}개 슬롯 사용 중. 슬롯 단위로 이미지 ID를 입력하여 교체합니다.
								</p>
							</section>

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
						</>
					)}
				</div>
			</SheetContent>
		</Sheet>
	);
}
