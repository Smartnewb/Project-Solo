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
		setState((s) => ({ ...s, imageSource: next }));
	}, []);

	const setAgeBucket = useCallback((next: AgeBucket | null) => {
		setState((s) => ({ ...s, ageBucket: next }));
	}, []);

	const setVendor = useCallback((next: ImageVendor | null) => {
		setState((s) => ({ ...s, vendor: next }));
	}, []);

	const setActiveSlot = useCallback((idx: number) => {
		setState((s) => ({
			...s,
			activeSlotIndex: Math.min(Math.max(0, idx), s.count - 1),
		}));
	}, []);

	const addPhotoToActiveSlot = useCallback((photoId: string) => {
		setState((s) => {
			if (s.imageSource !== 'reference-pool') return s;
			const idx = s.activeSlotIndex;
			const current = s.matches.get(idx);
			const photoIds = current?.photoIds ?? ([] as string[]);
			if (photoIds.includes(photoId)) return s;

			const flatUsed = new Set<string>();
			for (const m of s.matches.values()) for (const id of m.photoIds) flatUsed.add(id);
			if (flatUsed.has(photoId)) return s;

			if (photoIds.length >= 3) return s;
			const nextPhotos = [...photoIds, photoId] as string[];

			let nextActive = idx;
			if (nextPhotos.length === 3) {
				for (let i = 0; i < s.count; i += 1) {
					const candidate = (idx + 1 + i) % s.count;
					const m =
						candidate === idx
							? { itemIndex: idx, photoIds: nextPhotos as ReferenceMatch['photoIds'] }
							: s.matches.get(candidate);
					if (!m || m.photoIds.length < 3) {
						nextActive = candidate;
						break;
					}
				}
			}

			const nextMatches = new Map(s.matches);
			nextMatches.set(idx, {
				itemIndex: idx,
				photoIds: nextPhotos as ReferenceMatch['photoIds'],
			} as ReferenceMatch);
			return { ...s, matches: nextMatches, activeSlotIndex: nextActive };
		});
	}, []);

	const removePhotoFromSlot = useCallback((slotIdx: number, position: 0 | 1 | 2) => {
		setState((s) => {
			const current = s.matches.get(slotIdx);
			if (!current) return s;
			const photos = [...current.photoIds];
			photos.splice(position, 1);
			const nextMatches = new Map(s.matches);
			if (photos.length === 0) nextMatches.delete(slotIdx);
			else
				nextMatches.set(slotIdx, {
					itemIndex: slotIdx,
					photoIds: photos as unknown as ReferenceMatch['photoIds'],
				});
			return { ...s, matches: nextMatches };
		});
	}, []);

	const replaceMatches = useCallback((next: ReferenceMatch[]) => {
		setState((s) => {
			const nextMatches = new Map(s.matches);
			for (const m of next) nextMatches.set(m.itemIndex, m);
			return { ...s, matches: nextMatches };
		});
	}, []);

	const resetMatches = useCallback(() => {
		setState((s) => ({ ...s, matches: new Map(), activeSlotIndex: 0 }));
	}, []);

	const setPoolFilter = useCallback((next: PoolFilterState) => {
		setState((s) => ({ ...s, poolFilter: next }));
	}, []);

	const isReady = useMemo(() => {
		if (state.imageSource === 'generate') return Boolean(state.vendor);
		if (state.matches.size !== state.count) return false;
		const flat = [...state.matches.values()].flatMap((m) => m.photoIds);
		if (flat.length !== state.count * 3) return false;
		if (new Set(flat).size !== flat.length) return false;
		return [...state.matches.values()].every((m) => m.photoIds.length === 3);
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
		replaceMatches,
		resetMatches,
		setPoolFilter,
		reset,
	};
}
