'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ghostInjection } from '@/app/services/admin/ghost-injection';
import type {
	ArchetypeListItem,
	ArchetypeTraits,
} from '@/app/types/ghost-injection';
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
import { Textarea } from '@/shared/ui/textarea';
import { ReasonInput, isReasonValid } from '../_shared/reason-input';
import { ghostInjectionKeys } from '../_shared/query-keys';

const MBTI_TYPES = [
	'ISTJ', 'ISFJ', 'INFJ', 'INTJ',
	'ISTP', 'ISFP', 'INFP', 'INTP',
	'ESTP', 'ESFP', 'ENFP', 'ENTP',
	'ESTJ', 'ESFJ', 'ENFJ', 'ENTJ',
];

interface ArchetypeFormDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	editing?: ArchetypeListItem | null;
}

interface FormState {
	name: string;
	description: string;
	minAge: string;
	maxAge: string;
	mbtiPool: string[];
	keywordsRaw: string;
	reason: string;
}

const EMPTY_STATE: FormState = {
	name: '',
	description: '',
	minAge: '20',
	maxAge: '25',
	mbtiPool: [],
	keywordsRaw: '',
	reason: '',
};

function toFormState(source?: ArchetypeListItem | null): FormState {
	if (!source) return { ...EMPTY_STATE };
	return {
		name: source.name,
		description: source.description ?? '',
		minAge: String(source.traits.ageRange.min),
		maxAge: String(source.traits.ageRange.max),
		mbtiPool: [...source.traits.mbtiPool],
		keywordsRaw: source.traits.keywordPool.join(', '),
		reason: '',
	};
}

function parseKeywords(raw: string): string[] {
	return raw
		.split(/[\n,]/)
		.map((item) => item.trim())
		.filter(Boolean);
}

function buildTraits(state: FormState): ArchetypeTraits | null {
	const min = Number(state.minAge);
	const max = Number(state.maxAge);
	if (!Number.isFinite(min) || !Number.isFinite(max) || min < 18 || max < min) {
		return null;
	}
	const keywords = parseKeywords(state.keywordsRaw);
	return {
		ageRange: { min, max },
		mbtiPool: state.mbtiPool,
		keywordPool: keywords,
	};
}

export function ArchetypeFormDialog({
	open,
	onOpenChange,
	editing,
}: ArchetypeFormDialogProps) {
	const toast = useToast();
	const queryClient = useQueryClient();
	const [state, setState] = useState<FormState>(() => toFormState(editing));
	const isEdit = Boolean(editing);

	useEffect(() => {
		if (open) setState(toFormState(editing));
	}, [open, editing]);

	const mutation = useMutation({
		mutationFn: () => {
			const traits = buildTraits(state);
			if (!traits) throw new Error('나이 범위가 올바르지 않습니다.');
			const body = {
				archetypeFields: {
					name: state.name.trim(),
					description: state.description.trim() || undefined,
					traits,
				},
				reason: state.reason.trim(),
			};
			if (isEdit && editing) {
				return ghostInjection.updateArchetype(editing.archetypeId, body);
			}
			return ghostInjection.createArchetype(body);
		},
		onSuccess: () => {
			toast.success(isEdit ? '프로필 유형이 수정되었습니다.' : '프로필 유형이 추가되었습니다.');
			queryClient.invalidateQueries({ queryKey: ghostInjectionKeys.archetypes() });
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

	const traitsValid = buildTraits(state) !== null;
	const canSubmit =
		state.name.trim().length >= 2 &&
		state.mbtiPool.length > 0 &&
		parseKeywords(state.keywordsRaw).length > 0 &&
		traitsValid &&
		isReasonValid(state.reason) &&
		!mutation.isPending;

	const toggleMbti = (mbti: string) => {
		setState((prev) => ({
			...prev,
			mbtiPool: prev.mbtiPool.includes(mbti)
				? prev.mbtiPool.filter((value) => value !== mbti)
				: [...prev.mbtiPool, mbti],
		}));
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-2xl">
				<DialogHeader>
					<DialogTitle>{isEdit ? '프로필 유형 수정' : '프로필 유형 추가'}</DialogTitle>
					<DialogDescription>
						가상 프로필 생성 시 사용할 유형을 정의합니다. 모든 변경 사항은 감사 로그에 기록됩니다.
					</DialogDescription>
				</DialogHeader>

				<div className="grid grid-cols-1 gap-4 py-2 md:grid-cols-2">
					<div className="space-y-1 md:col-span-2">
						<Label htmlFor="archetype-name">이름 *</Label>
						<Input
							id="archetype-name"
							value={state.name}
							onChange={(event) => setState({ ...state, name: event.target.value })}
							placeholder="예: 활발한 대학생"
						/>
					</div>

					<div className="space-y-1 md:col-span-2">
						<Label htmlFor="archetype-description">설명</Label>
						<Textarea
							id="archetype-description"
							rows={2}
							value={state.description}
							onChange={(event) => setState({ ...state, description: event.target.value })}
							placeholder="이 유형에 대한 간단한 설명 (예: 활발하고 사교적인 성격)"
						/>
					</div>

					<div className="space-y-1">
						<Label htmlFor="archetype-min-age">최소 나이 *</Label>
						<Input
							id="archetype-min-age"
							type="number"
							min={18}
							max={60}
							value={state.minAge}
							onChange={(event) => setState({ ...state, minAge: event.target.value })}
						/>
					</div>

					<div className="space-y-1">
						<Label htmlFor="archetype-max-age">최대 나이 *</Label>
						<Input
							id="archetype-max-age"
							type="number"
							min={18}
							max={60}
							value={state.maxAge}
							onChange={(event) => setState({ ...state, maxAge: event.target.value })}
						/>
					</div>

					<div className="space-y-2 md:col-span-2">
						<Label>MBTI Pool * ({state.mbtiPool.length}개 선택)</Label>
						<div className="grid grid-cols-4 gap-2">
							{MBTI_TYPES.map((mbti) => {
								const active = state.mbtiPool.includes(mbti);
								return (
									<button
										key={mbti}
										type="button"
										onClick={() => toggleMbti(mbti)}
										className={`rounded-md border px-2 py-1.5 text-xs font-medium transition-colors ${
											active
												? 'border-primary bg-primary text-white'
												: 'border-slate-200 bg-white text-slate-600 hover:border-primary hover:text-primary'
										}`}
									>
										{mbti}
									</button>
								);
							})}
						</div>
					</div>

					<div className="space-y-1 md:col-span-2">
						<Label htmlFor="archetype-keywords">키워드 Pool *</Label>
						<Textarea
							id="archetype-keywords"
							rows={3}
							value={state.keywordsRaw}
							onChange={(event) => setState({ ...state, keywordsRaw: event.target.value })}
							placeholder="쉼표 또는 줄바꿈으로 구분 (예: 여행, 카페, 독서)"
						/>
						<p className="text-xs text-slate-500">
							현재 {parseKeywords(state.keywordsRaw).length}개 키워드
						</p>
					</div>

					<div className="md:col-span-2">
						<ReasonInput
							value={state.reason}
							onChange={(value) => setState({ ...state, reason: value })}
							minLength={10}
							label="변경 사유"
						/>
					</div>
				</div>

				<DialogFooter>
					<Button variant="outline" onClick={() => onOpenChange(false)} disabled={mutation.isPending}>
						취소
					</Button>
					<Button onClick={() => mutation.mutate()} disabled={!canSubmit}>
						{mutation.isPending ? '저장 중…' : isEdit ? '수정' : '생성'}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
