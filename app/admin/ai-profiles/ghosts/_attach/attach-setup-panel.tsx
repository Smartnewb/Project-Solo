'use client';

import { useMemo, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { aiProfileReferences } from '@/app/services/admin/ai-profile-references';
import { getAdminErrorMessage } from '@/shared/lib/http/admin-fetch';
import { useToast } from '@/shared/ui/admin/toast';
import type {
	AgeBucket,
	ReferenceMatch,
	ReferencePhotoListItem,
} from '@/app/types/ghost-injection';
import { PoolBrowser } from './pool-browser';
import { SlotMatcher } from './slot-matcher';
import type { PoolFilterState } from './use-ghost-batch-setup';

interface AttachSetupPanelProps {
	count: number;
	ageBucket: AgeBucket | null;
	matches: Map<number, ReferenceMatch>;
	usedPhotoIds: Set<string>;
	activeSlotIndex: number;
	poolFilter: PoolFilterState;
	onPoolFilterChange: (next: PoolFilterState) => void;
	onPickPhoto: (photo: ReferencePhotoListItem) => void;
	onActivate: (idx: number) => void;
	onRemovePhoto: (slotIdx: number, pos: 0 | 1 | 2) => void;
	onReplaceMatches: (next: ReferenceMatch[]) => void;
	onResetAll: () => void;
}

export function AttachSetupPanel({
	count,
	ageBucket,
	matches,
	usedPhotoIds,
	activeSlotIndex,
	poolFilter,
	onPoolFilterChange,
	onPickPhoto,
	onActivate,
	onRemovePhoto,
	onReplaceMatches,
	onResetAll,
}: AttachSetupPanelProps) {
	const toast = useToast();
	const [photoMap, setPhotoMap] = useState<Map<string, ReferencePhotoListItem>>(new Map());
	const [autoMatchingSlot, setAutoMatchingSlot] = useState<number | null>(null);

	const handlePick = (photo: ReferencePhotoListItem) => {
		setPhotoMap((m) => {
			if (m.has(photo.id)) return m;
			const next = new Map(m);
			next.set(photo.id, photo);
			return next;
		});
		onPickPhoto(photo);
	};

	const autoMatchMutation = useMutation({
		mutationFn: (vars: { targetSlots?: number[] }) =>
			aiProfileReferences.autoMatch({
				count,
				ageBucket: ageBucket ?? undefined,
				excludePhotoIds: [...usedPhotoIds],
				cohesion: 'strict',
				targetSlots: vars.targetSlots,
				tagFilter: {
					mood: poolFilter.tagMood,
					setting: poolFilter.tagSetting,
					style: poolFilter.tagStyle,
				},
			}),
		onSuccess: (data) => {
			onReplaceMatches(data.matches);
			if (data.warnings.length > 0) {
				toast.info(data.warnings.join(', '));
			}
		},
		onError: (error) => toast.error(getAdminErrorMessage(error)),
		onSettled: () => setAutoMatchingSlot(null),
	});

	const handleAutoFillSlot = (idx: number) => {
		setAutoMatchingSlot(idx);
		autoMatchMutation.mutate({ targetSlots: [idx] });
	};

	const handleAutoFillAll = () => {
		autoMatchMutation.mutate({});
	};

	const slotEnabled = useMemo(() => count > 0, [count]);

	return (
		<div className="grid h-full grid-cols-[1fr_minmax(360px,420px)]">
			<PoolBrowser
				ageBucket={ageBucket}
				filter={poolFilter}
				onFilterChange={onPoolFilterChange}
				usedPhotoIds={usedPhotoIds}
				onPickPhoto={handlePick}
				enabled={slotEnabled}
			/>
			<SlotMatcher
				count={count}
				matches={matches}
				photoMap={photoMap}
				activeSlotIndex={activeSlotIndex}
				autoMatchingSlot={autoMatchingSlot}
				onActivate={onActivate}
				onAutoFillSlot={handleAutoFillSlot}
				onAutoFillAll={handleAutoFillAll}
				onRemovePhoto={onRemovePhoto}
				onResetAll={onResetAll}
				autoFillingAll={autoMatchMutation.isPending && autoMatchingSlot === null}
			/>
		</div>
	);
}
