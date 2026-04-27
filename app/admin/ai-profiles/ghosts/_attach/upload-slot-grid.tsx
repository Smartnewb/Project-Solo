'use client';

import Image from 'next/image';
import { useMemo, useState } from 'react';
import { Plus, Wand2, X } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover';
import { cn } from '@/shared/utils';
import type { UploadedPhotoLocal } from './use-ghost-batch-setup';

interface UploadSlotGridProps {
	count: number;
	uploaded: UploadedPhotoLocal[];
	assignments: Map<number, [string, string, string]>;
	onAssign: (itemIndex: number, s3Urls: [string, string, string]) => void;
	onClearAssignment: (itemIndex: number) => void;
	onAutoDistribute: () => void;
}

export function UploadSlotGrid({
	count,
	uploaded,
	assignments,
	onAssign,
	onClearAssignment,
	onAutoDistribute,
}: UploadSlotGridProps) {
	const usedUrls = useMemo(() => {
		const set = new Set<string>();
		for (const urls of assignments.values()) {
			for (const u of urls) set.add(u);
		}
		return set;
	}, [assignments]);

	const filledRows = useMemo(() => {
		let n = 0;
		for (let i = 0; i < count; i += 1) {
			if (assignments.get(i)?.length === 3) n += 1;
		}
		return n;
	}, [assignments, count]);

	const canAutoDistribute = uploaded.length >= count * 3;

	return (
		<div className="space-y-3">
			<div className="flex items-center justify-between">
				<div>
					<p className="text-sm font-semibold text-slate-800">슬롯 분배</p>
					<p className="text-xs text-slate-500">
						<span className="font-semibold text-slate-700 tabular-nums">
							{filledRows}
						</span>
						/{count} 페르소나에 사진이 매핑되었습니다.
					</p>
				</div>
				<Button
					type="button"
					size="sm"
					variant="outline"
					onClick={onAutoDistribute}
					disabled={!canAutoDistribute}
				>
					<Wand2 className="mr-1 h-3.5 w-3.5" />
					자동 분배
				</Button>
			</div>

			<div className="space-y-2">
				{Array.from({ length: count }).map((_, itemIndex) => (
					<SlotRow
						key={itemIndex}
						itemIndex={itemIndex}
						uploaded={uploaded}
						usedUrls={usedUrls}
						assignment={assignments.get(itemIndex) ?? null}
						onAssign={onAssign}
						onClearAssignment={onClearAssignment}
					/>
				))}
			</div>
		</div>
	);
}

interface SlotRowProps {
	itemIndex: number;
	uploaded: UploadedPhotoLocal[];
	usedUrls: Set<string>;
	assignment: [string, string, string] | null;
	onAssign: (itemIndex: number, s3Urls: [string, string, string]) => void;
	onClearAssignment: (itemIndex: number) => void;
}

function SlotRow({
	itemIndex,
	uploaded,
	usedUrls,
	assignment,
	onAssign,
	onClearAssignment,
}: SlotRowProps) {
	const [draftPickIndex, setDraftPickIndex] = useState<number | null>(null);
	const [draftSelected, setDraftSelected] = useState<string[]>([]);

	const photoMap = useMemo(() => {
		const m = new Map<string, UploadedPhotoLocal>();
		for (const u of uploaded) m.set(u.s3Url, u);
		return m;
	}, [uploaded]);

	const startPicker = (slotPos: number) => {
		const current = assignment ?? ['', '', ''];
		setDraftSelected([...current]);
		setDraftPickIndex(slotPos);
	};

	const cancelPicker = () => {
		setDraftPickIndex(null);
		setDraftSelected([]);
	};

	const pickPhoto = (s3Url: string, slotPos: number) => {
		const next = [...(draftSelected.length === 3 ? draftSelected : ['', '', ''])];
		next[slotPos] = s3Url;
		setDraftSelected(next);
		// move to next empty slot if exists
		const nextEmpty = next.findIndex((v, i) => i > slotPos && !v);
		if (nextEmpty >= 0) {
			setDraftPickIndex(nextEmpty);
		} else {
			// commit if all 3 filled
			if (next.every(Boolean) && next.length === 3) {
				onAssign(itemIndex, [next[0], next[1], next[2]]);
				setDraftPickIndex(null);
				setDraftSelected([]);
			}
		}
	};

	const slots = assignment ?? draftSelected;
	const displaySlots: (string | null)[] = [
		slots[0] || null,
		slots[1] || null,
		slots[2] || null,
	];

	return (
		<div className="flex items-stretch gap-3 rounded-md border border-slate-200 bg-white p-3">
			<div className="flex w-12 flex-shrink-0 flex-col items-center justify-center">
				<span className="inline-flex h-6 min-w-[24px] items-center justify-center rounded-full bg-slate-100 px-1.5 text-xs font-semibold text-slate-700">
					{itemIndex + 1}
				</span>
				<span className="mt-1 text-[10px] text-slate-500">페르소나</span>
			</div>

			<div className="grid flex-1 grid-cols-3 gap-2">
				{displaySlots.map((url, pos) => {
					const photo = url ? photoMap.get(url) : null;
					const isPickerOpen = draftPickIndex === pos;
					return (
						<Popover
							key={pos}
							open={isPickerOpen}
							onOpenChange={(open) => {
								if (!open) cancelPicker();
							}}
						>
							<PopoverTrigger asChild>
								<button
									type="button"
									onClick={() => startPicker(pos)}
									className={cn(
										'relative flex aspect-[3/4] w-full items-center justify-center overflow-hidden rounded border text-xs transition',
										photo
											? 'border-slate-300'
											: 'border-dashed border-slate-300 bg-slate-50 text-slate-400 hover:border-slate-500 hover:bg-slate-100',
									)}
								>
									{photo ? (
										<>
											<Image
												src={photo.s3Url}
												alt={photo.filename}
												fill
												sizes="160px"
												className="object-cover"
												unoptimized
											/>
											<span className="absolute left-1 top-1 rounded-sm bg-black/60 px-1 py-0.5 text-[10px] text-white">
												{pos + 1}
											</span>
										</>
									) : (
										<div className="flex flex-col items-center gap-1">
											<Plus className="h-4 w-4" />
											<span>슬롯 {pos + 1}</span>
										</div>
									)}
								</button>
							</PopoverTrigger>
							<PopoverContent className="w-80 p-3" align="start">
								<p className="mb-2 text-xs font-semibold text-slate-700">
									페르소나 {itemIndex + 1} · 슬롯 {pos + 1} 사진 선택
								</p>
								{uploaded.length === 0 ? (
									<p className="py-4 text-center text-xs text-slate-500">
										먼저 사진을 업로드하세요.
									</p>
								) : (
									<div className="grid max-h-64 grid-cols-3 gap-1.5 overflow-y-auto">
										{uploaded.map((item) => {
											const inThisRow = displaySlots.includes(item.s3Url);
											const inOtherRow =
												usedUrls.has(item.s3Url) && !inThisRow;
											const disabled = inOtherRow;
											return (
												<button
													key={item.s3Url}
													type="button"
													disabled={disabled}
													onClick={() => pickPhoto(item.s3Url, pos)}
													className={cn(
														'relative aspect-square overflow-hidden rounded border transition',
														disabled
															? 'cursor-not-allowed border-slate-200 opacity-30'
															: 'border-slate-300 hover:border-slate-900',
													)}
												>
													<Image
														src={item.s3Url}
														alt={item.filename}
														fill
														sizes="80px"
														className="object-cover"
														unoptimized
													/>
												</button>
											);
										})}
									</div>
								)}
							</PopoverContent>
						</Popover>
					);
				})}
			</div>

			<div className="flex flex-shrink-0 items-start">
				<Button
					type="button"
					size="icon"
					variant="ghost"
					className="h-8 w-8 text-slate-500 hover:bg-red-50 hover:text-red-600"
					onClick={() => onClearAssignment(itemIndex)}
					disabled={!assignment}
					aria-label="슬롯 비우기"
				>
					<X className="h-4 w-4" />
				</Button>
			</div>
		</div>
	);
}
