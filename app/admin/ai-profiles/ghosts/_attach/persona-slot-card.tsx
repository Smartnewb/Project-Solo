'use client';

import Image from 'next/image';
import { Loader2, Sparkles, X } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { cn } from '@/shared/utils';
import type { ReferencePhotoListItem } from '@/app/types/ghost-injection';

interface PersonaSlotCardProps {
	itemIndex: number;
	photoIds: string[];
	photoMap: Map<string, ReferencePhotoListItem>;
	active: boolean;
	autoMatching: boolean;
	onActivate: () => void;
	onAutoFill: () => void;
	onRemovePhoto: (position: 0 | 1 | 2) => void;
}

export function PersonaSlotCard({
	itemIndex,
	photoIds,
	photoMap,
	active,
	autoMatching,
	onActivate,
	onAutoFill,
	onRemovePhoto,
}: PersonaSlotCardProps) {
	const filled = photoIds.length;

	return (
		<button
			type="button"
			onClick={onActivate}
			className={cn(
				'group relative flex w-full flex-col rounded-md border p-3 text-left transition',
				active
					? 'border-emerald-500 bg-emerald-50/40 ring-2 ring-emerald-200'
					: 'border-slate-200 hover:border-slate-400',
			)}
		>
			<div className="mb-2 flex items-center justify-between">
				<div className="flex items-center gap-2">
					<span
						className={cn(
							'inline-flex h-5 min-w-[20px] items-center justify-center rounded-full px-1 text-[10px] font-semibold',
							active ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700',
						)}
					>
						{itemIndex + 1}
					</span>
					<span className="text-xs font-medium text-slate-700">슬롯 {itemIndex + 1}</span>
				</div>
				<span className="text-[10px] text-slate-500 tabular-nums">{filled}/3</span>
			</div>
			<div className="grid grid-cols-3 gap-1.5">
				{[0, 1, 2].map((pos) => {
					const photoId = photoIds[pos];
					const photo = photoId ? photoMap.get(photoId) : undefined;
					return (
						<div
							key={pos}
							className={cn(
								'relative aspect-square overflow-hidden rounded border',
								photo ? 'border-slate-300' : 'border-dashed border-slate-200 bg-slate-50',
							)}
						>
							{photo ? (
								<>
									<Image
										src={photo.thumbnailUrl || photo.s3Url}
										alt=""
										fill
										sizes="120px"
										className="object-cover"
										unoptimized
									/>
									<button
										type="button"
										className="absolute right-0.5 top-0.5 rounded-full bg-white/80 p-0.5 text-slate-700 opacity-0 transition group-hover:opacity-100 hover:bg-white"
										onClick={(e) => {
											e.stopPropagation();
											onRemovePhoto(pos as 0 | 1 | 2);
										}}
										aria-label="사진 제거"
									>
										<X className="h-3 w-3" />
									</button>
								</>
							) : (
								<div className="flex h-full items-center justify-center text-[10px] text-slate-400">
									{pos + 1}
								</div>
							)}
						</div>
					);
				})}
			</div>
			<div className="mt-2 flex items-center justify-end">
				<Button
					size="sm"
					variant="ghost"
					className="h-6 px-2 text-[11px]"
					disabled={autoMatching || filled === 3}
					onClick={(e) => {
						e.stopPropagation();
						onAutoFill();
					}}
				>
					{autoMatching ? (
						<Loader2 className="h-3 w-3 animate-spin" />
					) : (
						<>
							<Sparkles className="mr-1 h-3 w-3" />
							자동
						</>
					)}
				</Button>
			</div>
		</button>
	);
}
