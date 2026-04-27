'use client';

import { Library, Sparkles, Upload } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/shared/utils';
import type { GhostBatchMode } from './use-ghost-batch-setup';

interface ModeOption {
	value: GhostBatchMode;
	title: string;
	subtitle: string;
	durationLabel: string;
	costLabel: string;
	whenToUse: string;
	icon: LucideIcon;
}

export const MODE_OPTIONS: ReadonlyArray<ModeOption> = [
	{
		value: 'generate',
		title: 'AI 자동 생성',
		subtitle: '텍스트와 이미지를 모두 LLM 으로 생성합니다.',
		durationLabel: '약 30초/명',
		costLabel: '약 $0.05/명',
		whenToUse: '빠른 일괄 생성, 텍스트+이미지 일관성 우선',
		icon: Sparkles,
	},
	{
		value: 'reference-pool',
		title: '참조 풀 사용',
		subtitle: '큐레이션된 풀에서 슬롯에 사진을 부착합니다.',
		durationLabel: '약 3초',
		costLabel: '무료 (사전 큐레이션)',
		whenToUse: '검수된 사진 풀이 충분할 때',
		icon: Library,
	},
	{
		value: 'manual-upload',
		title: '이미지 업로드',
		subtitle: '외부 이미지를 첨부하고 메타만 자동 생성합니다.',
		durationLabel: '약 5초',
		costLabel: '무료 (S3 저장만)',
		whenToUse: '외부 스톡/직접 생성 이미지를 활용할 때',
		icon: Upload,
	},
];

interface ModeSelectStepProps {
	selected: GhostBatchMode | null;
	onSelect: (mode: GhostBatchMode) => void;
}

export function ModeSelectStep({ selected, onSelect }: ModeSelectStepProps) {
	return (
		<div className="grid gap-3 md:grid-cols-3">
			{MODE_OPTIONS.map((option) => {
				const Icon = option.icon;
				const isActive = selected === option.value;
				return (
					<button
						key={option.value}
						type="button"
						onClick={() => onSelect(option.value)}
						className={cn(
							'flex h-full flex-col items-start gap-3 rounded-lg border p-4 text-left transition',
							isActive
								? 'border-slate-900 bg-slate-50 ring-2 ring-slate-200'
								: 'border-slate-200 bg-white hover:border-slate-400 hover:bg-slate-50/40',
						)}
					>
						<div
							className={cn(
								'flex h-10 w-10 items-center justify-center rounded-md border',
								isActive
									? 'border-slate-900 bg-white text-slate-900'
									: 'border-slate-200 bg-slate-50 text-slate-600',
							)}
						>
							<Icon className="h-5 w-5" />
						</div>
						<div className="space-y-1">
							<p className="text-sm font-semibold text-slate-900">{option.title}</p>
							<p className="text-xs leading-relaxed text-slate-500">
								{option.subtitle}
							</p>
						</div>
						<p className="text-[11px] leading-relaxed text-slate-500">
							<span className="font-medium text-slate-600">사용 시점</span> ·{' '}
							{option.whenToUse}
						</p>
						<div className="mt-auto flex flex-wrap gap-1.5">
							<span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-medium text-slate-600">
								{option.durationLabel}
							</span>
							<span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-600">
								{option.costLabel}
							</span>
						</div>
					</button>
				);
			})}
		</div>
	);
}
