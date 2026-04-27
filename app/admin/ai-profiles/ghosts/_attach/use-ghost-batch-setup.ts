'use client';

import { useCallback, useMemo, useState } from 'react';
import type {
	AgeBucket,
	ImageSource,
	ImageVendor,
	ReferenceMatch,
} from '@/app/types/ghost-injection';

export type GhostBatchMode = 'generate' | 'reference-pool' | 'manual-upload';

export interface UploadedPhotoLocal {
	s3Url: string;
	filename: string;
	sizeBytes: number;
}

export interface PoolFilterState {
	tagMood?: string;
	tagSetting?: string;
	tagStyle?: string;
	sortBy: 'usage_asc' | 'curated_desc';
}

export interface GhostBatchSetupState {
	step: 1 | 2;
	mode: GhostBatchMode | null;
	count: number;
	ageBucket: AgeBucket | null;
	imageSource: ImageSource;
	vendor: ImageVendor | null;
	matches: Map<number, ReferenceMatch>;
	activeSlotIndex: number;
	poolFilter: PoolFilterState;
	uploaded: UploadedPhotoLocal[];
	uploadAssignments: Map<number, [string, string, string]>;
}

const INITIAL: GhostBatchSetupState = {
	step: 1,
	mode: null,
	count: 1,
	ageBucket: null,
	imageSource: 'generate',
	vendor: 'seedream',
	matches: new Map(),
	activeSlotIndex: 0,
	poolFilter: { sortBy: 'usage_asc' },
	uploaded: [],
	uploadAssignments: new Map(),
};

const SLOT_PHOTO_LIMIT = 3;

function asTuple(ids: string[]): ReferenceMatch['photoIds'] {
	return ids as unknown as ReferenceMatch['photoIds'];
}

function asUploadTuple(urls: string[]): [string, string, string] {
	return urls as unknown as [string, string, string];
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

	const usedUploadUrls = useMemo(() => {
		const set = new Set<string>();
		for (const urls of state.uploadAssignments.values()) {
			for (const url of urls) set.add(url);
		}
		return set;
	}, [state.uploadAssignments]);

	const setCount = useCallback((next: number) => {
		setState((s) => {
			if (next === s.count) return s;
			const trimmed = new Map(s.matches);
			for (const idx of [...trimmed.keys()]) {
				if (idx >= next) trimmed.delete(idx);
			}
			const trimmedUploads = new Map(s.uploadAssignments);
			for (const idx of [...trimmedUploads.keys()]) {
				if (idx >= next) trimmedUploads.delete(idx);
			}
			return {
				...s,
				count: next,
				matches: trimmed,
				uploadAssignments: trimmedUploads,
				activeSlotIndex: Math.min(s.activeSlotIndex, Math.max(0, next - 1)),
			};
		});
	}, []);

	const setImageSource = useCallback((next: ImageSource) => {
		setState((s) => {
			if (s.imageSource === next && s.mode === next) return s;
			return { ...s, imageSource: next, mode: next as GhostBatchMode };
		});
	}, []);

	const setMode = useCallback((next: GhostBatchMode | null) => {
		setState((s) => {
			if (s.mode === next) return s;
			const isolatedVendor =
				next === 'generate' ? (s.vendor ?? 'seedream') : s.vendor;
			return {
				...s,
				mode: next,
				imageSource: (next ?? 'generate') as ImageSource,
				vendor: isolatedVendor,
			};
		});
	}, []);

	const goToStep2 = useCallback(() => {
		setState((s) => {
			if (s.mode === null) return s;
			if (s.step === 2) return s;
			return { ...s, step: 2 };
		});
	}, []);

	const goToStep1 = useCallback(() => {
		setState((s) => (s.step === 1 ? s : { ...s, step: 1 }));
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

	const addUploads = useCallback((items: UploadedPhotoLocal[]) => {
		if (items.length === 0) return;
		setState((s) => {
			const seen = new Set(s.uploaded.map((u) => u.s3Url));
			const fresh = items.filter((it) => !seen.has(it.s3Url));
			if (fresh.length === 0) return s;
			return { ...s, uploaded: [...s.uploaded, ...fresh] };
		});
	}, []);

	const removeUpload = useCallback((s3Url: string) => {
		setState((s) => {
			if (!s.uploaded.some((u) => u.s3Url === s3Url)) return s;
			const nextUploaded = s.uploaded.filter((u) => u.s3Url !== s3Url);
			const nextAssignments = new Map(s.uploadAssignments);
			for (const [idx, urls] of [...nextAssignments.entries()]) {
				if (urls.includes(s3Url)) nextAssignments.delete(idx);
			}
			return { ...s, uploaded: nextUploaded, uploadAssignments: nextAssignments };
		});
	}, []);

	const assignToSlot = useCallback(
		(itemIndex: number, s3Urls: [string, string, string]) => {
			setState((s) => {
				if (itemIndex < 0 || itemIndex >= s.count) return s;
				const uploadedSet = new Set(s.uploaded.map((u) => u.s3Url));
				if (!s3Urls.every((u) => uploadedSet.has(u))) return s;
				const usedElsewhere = new Set<string>();
				for (const [idx, urls] of s.uploadAssignments.entries()) {
					if (idx === itemIndex) continue;
					for (const u of urls) usedElsewhere.add(u);
				}
				if (s3Urls.some((u) => usedElsewhere.has(u))) return s;
				if (new Set(s3Urls).size !== 3) return s;
				const next = new Map(s.uploadAssignments);
				next.set(itemIndex, s3Urls);
				return { ...s, uploadAssignments: next };
			});
		},
		[],
	);

	const clearAssignment = useCallback((itemIndex: number) => {
		setState((s) => {
			if (!s.uploadAssignments.has(itemIndex)) return s;
			const next = new Map(s.uploadAssignments);
			next.delete(itemIndex);
			return { ...s, uploadAssignments: next };
		});
	}, []);

	const autoDistribute = useCallback(() => {
		setState((s) => {
			const next = new Map<number, [string, string, string]>();
			const urls = s.uploaded.map((u) => u.s3Url);
			for (let i = 0; i < s.count; i += 1) {
				const slice = urls.slice(i * 3, i * 3 + 3);
				if (slice.length !== 3) break;
				next.set(i, asUploadTuple(slice));
			}
			return { ...s, uploadAssignments: next };
		});
	}, []);

	const clearUploads = useCallback(() => {
		setState((s) => {
			if (s.uploaded.length === 0 && s.uploadAssignments.size === 0) return s;
			return { ...s, uploaded: [], uploadAssignments: new Map() };
		});
	}, []);

	const isReady = useMemo(() => {
		if (state.mode === null) return false;
		if (state.step !== 2) return false;
		if (state.mode === 'generate') return Boolean(state.vendor);
		if (state.mode === 'reference-pool') {
			if (state.matches.size !== state.count) return false;
			const flat = [...state.matches.values()].flatMap((m) => m.photoIds);
			const expected = state.count * SLOT_PHOTO_LIMIT;
			if (flat.length !== expected) return false;
			return new Set(flat).size === flat.length;
		}
		// manual-upload
		if (state.uploadAssignments.size !== state.count) return false;
		const flat = [...state.uploadAssignments.values()].flat();
		if (flat.length !== state.count * SLOT_PHOTO_LIMIT) return false;
		return new Set(flat).size === flat.length;
	}, [
		state.mode,
		state.step,
		state.vendor,
		state.matches,
		state.count,
		state.uploadAssignments,
	]);

	const reset = useCallback(() => setState(INITIAL), []);

	return {
		state,
		usedPhotoIds,
		usedUploadUrls,
		isReady,
		setCount,
		setImageSource,
		setMode,
		goToStep1,
		goToStep2,
		setAgeBucket,
		setVendor,
		setActiveSlot,
		addPhotoToActiveSlot,
		removePhotoFromSlot,
		mergeMatches,
		resetMatches,
		setPoolFilter,
		addUploads,
		removeUpload,
		assignToSlot,
		clearAssignment,
		autoDistribute,
		clearUploads,
		reset,
	};
}

export type UseGhostBatchSetup = ReturnType<typeof useGhostBatchSetup>;
