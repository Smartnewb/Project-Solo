'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ghostInjection } from '@/app/services/admin/ghost-injection';
import type { ArchetypeListItem } from '@/app/types/ghost-injection';
import { getAdminErrorMessage } from '@/shared/lib/http/admin-fetch';
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
	code: string;
	name: string;
	description: string;
	minAge: string;
	maxAge: string;
	mbtiPool: string[];
	keywordsRaw: string;
	toneHintsRaw: string;
	reason: string;
}

const EMPTY_STATE: FormState = {
	code: '',
	name: '',
	description: '',
	minAge: '20',
	maxAge: '25',
	mbtiPool: [],
	keywordsRaw: '',
	toneHintsRaw: '',
	reason: '',
};

function toFormState(source?: ArchetypeListItem | null): FormState {
	if (!source) return { ...EMPTY_STATE };
	return {
		code: '',
		name: source.name,
		description: source.description ?? '',
		minAge: String(source.traits.ageRange.min),
		maxAge: String(source.traits.ageRange.max),
		mbtiPool: [...source.traits.mbtiPool],
		keywordsRaw: source.traits.keywordPool.join(', '),
		toneHintsRaw: (source.traits.toneHints ?? []).join(', '),
		reason: '',
	};
}

function parseList(raw: string): string[] {
	return raw
		.split(/[\n,]/)
		.map((item) => item.trim())
		.filter(Boolean);
}

/** name → snake_case code 자동 생성 */
function toCode(name: string): string {
	return name
		.trim()
		.toLowerCase()
		.replace(/[가-힣]+/g, (match) => match)
		.replace(/\s+/g, '_')
		.replace(/[^a-z0-9가-힣_]/g, '')
		.slice(0, 64);
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
			const min = Number(state.minAge);
			const max = Number(state.maxAge);
			if (!Number.isFinite(min) || !Number.isFinite(max) || min < 18 || max < min) {
				throw new Error('나이 범위가 올바르지 않습니다.');
			}

			const keywords = parseList(state.keywordsRaw);
			const toneHints = parseList(state.toneHintsRaw);
			const code = isEdit ? undefined : (state.code.trim() || toCode(state.name));

			const body = {
				archetypeFields: {
					...(code ? { code } : {}),
					name: state.name.trim(),
					description: state.description.trim() || undefined,
					mbtiOptions: state.mbtiPool,
					keywordOptions: keywords,
					...(toneHints.length > 0 ? { introductionTemplates: toneHints } : {}),
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
		onError: (error) => toast.error(getAdminErrorMessage(error)),
	});

	const minAge = Number(state.minAge);
	const maxAge = Number(state.maxAge);
	const ageValid = Number.isFinite(minAge) && Number.isFinite(maxAge) && minAge >= 18 && maxAge >= minAge;

	const canSubmit =
		state.name.trim().length >= 2 &&
		(isEdit || (state.code.trim() || state.name.trim()).length >= 2) &&
		state.mbtiPool.length > 0 &&
		parseList(state.keywordsRaw).length > 0 &&
		ageValid &&
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
					{!isEdit && (
						<div className="space-y-1">
							<Label htmlFor="archetype-code">코드 *</Label>
							<Input
								id="archetype-code"
								value={state.code}
								onChange={(event) => setState({ ...state, code: event.target.value })}
								placeholder={state.name ? toCode(state.name) : '예: active_student'}
							/>
							<p className="text-xs text-slate-500">
								고유 식별자. 비워두면 이름에서 자동 생성됩니다.
							</p>
						</div>
					)}

					<div className={isEdit ? 'space-y-1 md:col-span-2' : 'space-y-1'}>
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
							placeholder="이 유형에 대한 간단한 설명. AI 소개글 생성 실패 시 이 텍스트가 대신 사용됩니다."
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
												? 'border-slate-800 bg-slate-800 text-white'
												: 'border-slate-200 bg-white text-slate-600 hover:border-slate-400'
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
							현재 {parseList(state.keywordsRaw).length}개 키워드 · Ghost 생성 시 이 중 3~5개가 랜덤 선택됩니다.
						</p>
					</div>

					<div className="space-y-1 md:col-span-2">
						<Label htmlFor="archetype-tone">말투 힌트</Label>
						<Input
							id="archetype-tone"
							value={state.toneHintsRaw}
							onChange={(event) => setState({ ...state, toneHintsRaw: event.target.value })}
							placeholder="쉼표로 구분 (예: 자연스러운, 친근한, 밝은)"
						/>
						<p className="text-xs text-slate-500">
							AI 소개글 생성 시 말투를 제어합니다. 비워두면 기본값(자연스러운, 친근한)이 사용됩니다.
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
