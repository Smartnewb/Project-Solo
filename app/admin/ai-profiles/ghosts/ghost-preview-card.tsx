'use client';

import { useEffect, useState } from 'react';
import { ChevronDown, Loader2, RefreshCw, Save } from 'lucide-react';
import type { BatchPreviewItem } from '@/app/types/ghost-injection';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from '@/shared/ui/collapsible';
import { Textarea } from '@/shared/ui/textarea';
import { cn } from '@/shared/utils';
import { RankBadge } from '../_shared/rank-badge';

interface GhostPreviewCardProps {
	item: BatchPreviewItem;
	selected: boolean;
	onToggleSelect: () => void;
	onEditSlot: (slotIndex: 0 | 1 | 2, nextPrompt: string) => void;
	onRegenerate: () => void;
	isSaving?: boolean;
	isRegenerating?: boolean;
}

export function GhostPreviewCard({
	item,
	selected,
	onToggleSelect,
	onEditSlot,
	onRegenerate,
	isSaving = false,
	isRegenerating = false,
}: GhostPreviewCardProps) {
	return (
		<div
			className={cn(
				'flex flex-col gap-3 rounded-xl border bg-white p-4 shadow-sm transition-all',
				selected
					? 'border-slate-900 ring-2 ring-slate-900/10'
					: 'border-slate-200 hover:border-slate-300',
			)}
		>
			<div className="flex items-start justify-between gap-3">
				<div className="flex flex-1 items-start gap-3">
					<input
						type="checkbox"
						checked={selected}
						onChange={onToggleSelect}
						className="mt-1 h-4 w-4 shrink-0 cursor-pointer rounded border-slate-300 text-slate-900 focus:ring-slate-400"
						aria-label="프로필 선택"
					/>
					<div className="min-w-0 flex-1 space-y-1.5">
						<div className="flex flex-wrap items-center gap-2">
							<span className="text-sm font-semibold text-slate-900">
								{item.profile.name}
							</span>
							<span className="text-xs text-slate-500">
								만 {item.profile.age}세
							</span>
							<Badge variant="outline" className="text-[10px]">
								{item.profile.mbti}
							</Badge>
							{item.profile.rank ? (
								<RankBadge rank={item.profile.rank} />
							) : null}
						</div>
						<div className="text-xs text-slate-500">
							<span className="font-medium text-slate-700">
								{item.university.name}
							</span>
							<span className="mx-1 text-slate-300">·</span>
							<span>{item.department.name}</span>
						</div>
						{item.archetype.name ? (
							<div className="text-[11px] text-slate-400">
								아키타입: <span className="text-slate-600">{item.archetype.name}</span>
							</div>
						) : null}
					</div>
				</div>
			</div>

			{item.profile.introduction ? (
				<p className="line-clamp-2 text-xs text-slate-600">
					{item.profile.introduction}
				</p>
			) : null}

			<div className="space-y-2">
				{item.slotPrompts
					.slice()
					.sort((a, b) => a.slotIndex - b.slotIndex)
					.map((slot) => (
						<SlotPromptEditor
							key={slot.slotIndex}
							slotIndex={slot.slotIndex}
							initialPrompt={slot.prompt}
							personaDescriptor={slot.generationContext.personaDescriptor}
							sceneDescriptor={slot.generationContext.sceneDescriptor}
							onSave={(next) => onEditSlot(slot.slotIndex, next)}
							isSaving={isSaving}
						/>
					))}
			</div>

			<div className="flex items-center justify-end border-t pt-3">
				<Button
					size="sm"
					variant="outline"
					disabled={isRegenerating || isSaving}
					onClick={onRegenerate}
				>
					{isRegenerating ? (
						<>
							<Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
							재생성 중…
						</>
					) : (
						<>
							<RefreshCw className="mr-1 h-3.5 w-3.5" />
							전체 재생성
						</>
					)}
				</Button>
			</div>
		</div>
	);
}

interface SlotPromptEditorProps {
	slotIndex: 0 | 1 | 2;
	initialPrompt: string;
	personaDescriptor: string;
	sceneDescriptor: string;
	onSave: (nextPrompt: string) => void;
	isSaving: boolean;
}

function SlotPromptEditor({
	slotIndex,
	initialPrompt,
	personaDescriptor,
	sceneDescriptor,
	onSave,
	isSaving,
}: SlotPromptEditorProps) {
	const [value, setValue] = useState(initialPrompt);
	const [open, setOpen] = useState(false);

	useEffect(() => {
		setValue(initialPrompt);
	}, [initialPrompt]);

	const dirty = value !== initialPrompt;

	return (
		<Collapsible open={open} onOpenChange={setOpen}>
			<div className="rounded-lg border border-slate-200 bg-slate-50">
				<CollapsibleTrigger asChild>
					<button
						type="button"
						className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-100"
					>
						<span className="flex items-center gap-2">
							<Badge variant="secondary" className="text-[10px]">
								Slot {slotIndex + 1}
							</Badge>
							<span className="truncate text-slate-500">
								{sceneDescriptor}
							</span>
						</span>
						<ChevronDown
							className={cn(
								'h-3.5 w-3.5 shrink-0 text-slate-400 transition-transform',
								open && 'rotate-180',
							)}
						/>
					</button>
				</CollapsibleTrigger>
				<CollapsibleContent className="space-y-2 border-t border-slate-200 px-3 py-3">
					<div className="text-[10px] text-slate-400">
						<span className="font-medium text-slate-500">페르소나:</span>{' '}
						{personaDescriptor}
					</div>
					<Textarea
						value={value}
						onChange={(event) => setValue(event.target.value)}
						rows={4}
						className="text-xs"
					/>
					<div className="flex items-center justify-end">
						<Button
							size="sm"
							variant={dirty ? 'default' : 'outline'}
							disabled={!dirty || isSaving}
							onClick={() => onSave(value)}
						>
							{isSaving ? (
								<>
									<Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
									저장 중…
								</>
							) : (
								<>
									<Save className="mr-1 h-3.5 w-3.5" />
									저장
								</>
							)}
						</Button>
					</div>
				</CollapsibleContent>
			</div>
		</Collapsible>
	);
}
