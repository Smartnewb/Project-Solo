'use client';

import { useCallback, useMemo, useState } from 'react';
import type {
	AgeBucket,
	ImageSource,
	ImageVendor,
	ReferenceMatch,
} from '@/app/types/ghost-injection';

export interface PoolFilterState {
	tagMood?: string;
	tagSetting?: string;
	tagStyle?: string;
	sortBy: 'usage_asc' | 'curated_desc';
}

export interface GhostBatchSetupState {
	count: number;
	ageBucket: AgeBucket | null;
	imageSource: ImageSource;
	vendor: ImageVendor | null;
	matches: Map<number, ReferenceMatch>;
	activeSlotIndex: number;
	poolFilter: PoolFilterState;
}

const INITIAL: GhostBatchSetupState = {
	count: 1,
	ageBucket: null,
	imageSource: 'generate',
	vendor: 'seedream',
	matches: new Map(),
	activeSlotIndex: 0,
	poolFilter: { sortBy: 'usage_asc' },
};

const SLOT_PHOTO_LIMIT = 3;

function asTuple(ids: string[]): ReferenceMatch['photoIds'] {
	return ids as unknown as ReferenceMatch['photoIds'];
}

function pickNextActiveSlot(
	matches: Map<number, ReferenceMatch>,
	count: number,
	currentIdx: number,
	currentPhotos: string[],
): number {
	if (currentPhotos.length < SLOT_PHOTO_LIMIT) return currentIdx;
	for (let i = 1; i <= count; i += 1) {
		const candidate = (currentIdx + i) % count;
		if (candidate === currentIdx) break;
		const len = matches.get(candidate)?.photoIds.length ?? 0;
		if (len < SLOT_PHOTO_LIMIT) return candidate;
	}
	return currentIdx;
}

export function useGhostBatchSetup() {
	const [state, setState] = useState<GhostBatchSetupState>(INITIAL);

	const usedPhotoIds = useMemo(() => {
		const set = new Set<string>();
		for (const match of state.matches.values()) {
			for (const id of match.photoIds) set.add(id);
		}
		return set;
	}, [state.matches]);

	const setCount = useCallback((next: number) => {
		setState((s) => {
			if (next === s.count) return s;
			const trimmed = new Map(s.matches);
			for (const idx of [...trimmed.keys()]) {
				if (idx >= next) trimmed.delete(idx);
			}
			return {
				...s,
				count: next,
				matches: trimmed,
				activeSlotIndex: Math.min(s.activeSlotIndex, Math.max(0, next - 1)),
			};
		});
	}, []);

	const setImageSource = useCallback((next: ImageSource) => {
		setState((s) => (s.imageSource === next ? s : { ...s, imageSource: next }));
	}, []);

	const setAgeBucket = useCallback((next: AgeBucket | null) => {
		setState((s) => (s.ageBucket === next ? s : { ...s, ageBucket: next }));
	}, []);

	const setVendor = useCallback((next: ImageVendor | null) => {
		setState((s) => (s.vendor === next ? s : { ...s, vendor: next }));
	}, []);

	const setActiveSlot = useCallback((idx: number) => {
		setState((s) => {
			const clamped = Math.min(Math.max(0, idx), Math.max(0, s.count - 1));
			return clamped === s.activeSlotIndex ? s : { ...s, activeSlotIndex: clamped };
		});
	}, []);

	const addPhotoToActiveSlot = useCallback((photoId: string) => {
		setState((s) => {
			if (s.imageSource !== 'reference-pool') return s;
			const idx = s.activeSlotIndex;
			const current = s.matches.get(idx)?.photoIds ?? [];
			if (current.length >= SLOT_PHOTO_LIMIT) return s;

			for (const m of s.matches.values()) {
				if (m.photoIds.includes(photoId)) return s;
			}

			const nextPhotos = [...current, photoId];
			const nextMatches = new Map(s.matches);
			nextMatches.set(idx, { itemIndex: idx, photoIds: asTuple(nextPhotos) });
			const nextActive = pickNextActiveSlot(nextMatches, s.count, idx, nextPhotos);
			return { ...s, matches: nextMatches, activeSlotIndex: nextActive };
		});
	}, []);

	const removePhotoFromSlot = useCallback((slotIdx: number, position: 0 | 1 | 2) => {
		setState((s) => {
			const current = s.matches.get(slotIdx);
			if (!current || position >= current.photoIds.length) return s;
			const photos = [...current.photoIds];
			photos.splice(position, 1);
			const nextMatches = new Map(s.matches);
			if (photos.length === 0) nextMatches.delete(slotIdx);
			else
				nextMatches.set(slotIdx, { itemIndex: slotIdx, photoIds: asTuple(photos) });
			return { ...s, matches: nextMatches };
		});
	}, []);

	const mergeMatches = useCallback((next: ReferenceMatch[]) => {
		if (next.length === 0) return;
		setState((s) => {
			const nextMatches = new Map(s.matches);
			for (const m of next) nextMatches.set(m.itemIndex, m);
			return { ...s, matches: nextMatches };
		});
	}, []);

	const resetMatches = useCallback(() => {
		setState((s) =>
			s.matches.size === 0 && s.activeSlotIndex === 0
				? s
				: { ...s, matches: new Map(), activeSlotIndex: 0 },
		);
	}, []);

	const setPoolFilter = useCallback((next: PoolFilterState) => {
		setState((s) => (s.poolFilter === next ? s : { ...s, poolFilter: next }));
	}, []);

	const isReady = useMemo(() => {
		if (state.imageSource === 'generate') return Boolean(state.vendor);
		if (state.matches.size !== state.count) return false;
		const flat = [...state.matches.values()].flatMap((m) => m.photoIds);
		const expected = state.count * SLOT_PHOTO_LIMIT;
		if (flat.length !== expected) return false;
		return new Set(flat).size === flat.length;
	}, [state.imageSource, state.vendor, state.matches, state.count]);

	const reset = useCallback(() => setState(INITIAL), []);

	return {
		state,
		usedPhotoIds,
		isReady,
		setCount,
		setImageSource,
		setAgeBucket,
		setVendor,
		setActiveSlot,
		addPhotoToActiveSlot,
		removePhotoFromSlot,
		mergeMatches,
		resetMatches,
		setPoolFilter,
		reset,
	};
}

export type UseGhostBatchSetup = ReturnType<typeof useGhostBatchSetup>;
