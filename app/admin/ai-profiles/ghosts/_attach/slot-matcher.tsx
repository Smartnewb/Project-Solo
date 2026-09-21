'use client';

import { useMemo } from 'react';
import { Loader2, RefreshCw, Trash2 } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import type { ReferenceMatch, ReferencePhotoListItem } from '@/app/types/ghost-injection';
import { PersonaSlotCard } from './persona-slot-card';

interface SlotMatcherProps {
	count: number;
	matches: Map<number, ReferenceMatch>;
	photoMap: Map<string, ReferencePhotoListItem>;
	activeSlotIndex: number;
	autoMatchingSlot: number | null;
	onActivate: (idx: number) => void;
	onAutoFillSlot: (idx: number) => void;
	onAutoFillAll: () => void;
	onRemovePhoto: (slotIdx: number, position: 0 | 1 | 2) => void;
	onResetAll: () => void;
	autoFillingAll: boolean;
}

export function SlotMatcher({
	count,
	matches,
	photoMap,
	activeSlotIndex,
	autoMatchingSlot,
	onActivate,
	onAutoFillSlot,
	onAutoFillAll,
	onRemovePhoto,
	onResetAll,
	autoFillingAll,
}: SlotMatcherProps) {
	const filledSlots = useMemo(() => {
		let n = 0;
		for (const m of matches.values()) if (m.photoIds.length === 3) n += 1;
		return n;
	}, [matches]);

	return (
		<div className="flex h-full flex-col">
			<div className="flex items-center justify-between border-b px-3 py-2">
				<div className="flex items-center gap-2">
					<h3 className="text-sm font-semibold text-slate-900">슬롯 매칭</h3>
					<span className="text-xs text-slate-500 tabular-nums">
						{filledSlots}/{count} 완료
					</span>
				</div>
				<div className="flex items-center gap-1">
					<Button
						size="sm"
						variant="outline"
						className="h-7 text-xs"
						disabled={autoFillingAll}
						onClick={onAutoFillAll}
					>
						{autoFillingAll ? (
							<Loader2 className="mr-1 h-3 w-3 animate-spin" />
						) : (
							<RefreshCw className="mr-1 h-3 w-3" />
						)}
						전체 자동
					</Button>
					<Button
						size="sm"
						variant="ghost"
						className="h-7 text-xs text-slate-500"
						disabled={matches.size === 0}
						onClick={onResetAll}
					>
						<Trash2 className="mr-1 h-3 w-3" />
						초기화
					</Button>
				</div>
			</div>
			<div className="flex-1 overflow-y-auto p-3">
				<div className="grid grid-cols-1 gap-2 lg:grid-cols-2">
					{Array.from({ length: count }, (_, i) => i).map((idx) => (
						<PersonaSlotCard
							key={idx}
							itemIndex={idx}
							photoIds={matches.get(idx)?.photoIds ?? []}
							photoMap={photoMap}
							active={idx === activeSlotIndex}
							autoMatching={autoMatchingSlot === idx}
							onActivate={() => onActivate(idx)}
							onAutoFill={() => onAutoFillSlot(idx)}
							onRemovePhoto={(pos) => onRemovePhoto(idx, pos)}
						/>
					))}
				</div>
			</div>
		</div>
	);
}
