'use client';

import Image from 'next/image';
import { Lock } from 'lucide-react';
import { Badge } from '@/shared/ui/badge';
import { cn } from '@/shared/utils';
import type { ReferencePhotoListItem } from '@/app/types/ghost-injection';

interface PoolPhotoCardProps {
	photo: ReferencePhotoListItem;
	disabled?: boolean;
	selected?: boolean;
	onClick?: () => void;
}

export function PoolPhotoCard({ photo, disabled, selected, onClick }: PoolPhotoCardProps) {
	const isLocked = Boolean(photo.lockedBy);
	const blocked = disabled || isLocked;

	return (
		<button
			type="button"
			disabled={blocked}
			onClick={onClick}
			className={cn(
				'group relative aspect-square overflow-hidden rounded-md border bg-slate-50 transition',
				selected
					? 'border-emerald-500 ring-2 ring-emerald-200'
					: 'border-slate-200 hover:border-slate-400',
				blocked && 'cursor-not-allowed opacity-50',
			)}
			title={
				isLocked
					? `다른 어드민이 작업 중 (만료 ${photo.lockedBy?.until ?? ''})`
					: photo.tags
						? Object.entries(photo.tags)
								.filter(([, v]) => v)
								.map(([k, v]) => `${k}:${v}`)
								.join(' · ')
						: undefined
			}
		>
			<Image
				src={photo.thumbnailUrl || photo.s3Url}
				alt=""
				fill
				sizes="180px"
				className="object-cover"
				unoptimized
			/>
			<div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/60 to-transparent px-2 py-1 text-[10px] text-white">
				<span>{photo.ageBucket}</span>
				<span className="tabular-nums">사용 {photo.usageCount}</span>
			</div>
			{isLocked ? (
				<Badge
					variant="secondary"
					className="absolute right-1 top-1 flex items-center gap-1 px-1.5 py-0.5 text-[10px]"
				>
					<Lock className="h-3 w-3" /> 점유
				</Badge>
			) : null}
		</button>
	);
}
