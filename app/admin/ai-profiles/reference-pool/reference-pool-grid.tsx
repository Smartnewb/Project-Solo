'use client';

import { ImageOff, XCircle } from 'lucide-react';
import type { GhostReferenceImage } from '@/app/types/ghost-injection';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { cn } from '@/shared/utils';

function SourceBadge({ vendor }: { vendor?: string }) {
	const label =
		vendor === 'real-user' ? { text: '유저', cls: 'border-violet-300 bg-violet-50/90 text-violet-700' } :
		vendor === 'unknown' ? { text: 'Ghost', cls: 'border-blue-300 bg-blue-50/90 text-blue-700' } :
		{ text: 'AI', cls: 'border-amber-300 bg-amber-50/90 text-amber-700' };
	return (
		<Badge variant="outline" className={cn('text-[10px] font-semibold backdrop-blur-sm', label.cls)}>
			{label.text}
		</Badge>
	);
}

interface ReferencePoolGridProps {
	items: GhostReferenceImage[];
	isLoading: boolean;
	onDeactivate: (item: GhostReferenceImage) => void;
}

export function ReferencePoolGrid({ items, isLoading, onDeactivate }: ReferencePoolGridProps) {
	if (isLoading) {
		return (
			<div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-5">
				{Array.from({ length: 10 }).map((_, idx) => (
					<div
						key={idx}
						className="aspect-[3/4] animate-pulse rounded-lg border bg-slate-100"
					/>
				))}
			</div>
		);
	}

	if (items.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center rounded-lg border border-dashed bg-white py-16 text-slate-400">
				<ImageOff className="mb-2 h-10 w-10" />
				<p className="text-sm">레퍼런스 풀이 비어있습니다</p>
				<p className="text-xs">"새로 생성" 또는 "기존에서 임포트"로 시작하세요</p>
			</div>
		);
	}

	return (
		<div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-5">
			{items.map((item) => (
				<ReferenceCard key={item.id} item={item} onDeactivate={() => onDeactivate(item)} />
			))}
		</div>
	);
}

function ReferenceCard({
	item,
	onDeactivate,
}: {
	item: GhostReferenceImage;
	onDeactivate: () => void;
}) {
	return (
		<div
			className={cn(
				'group relative overflow-hidden rounded-lg border transition-all',
				item.isActive ? 'bg-white hover:shadow-md' : 'bg-slate-50',
			)}
		>
			<div className="relative aspect-[3/4] bg-slate-100">
				{/* eslint-disable-next-line @next/next/no-img-element */}
				<img
					src={item.s3Url}
					alt={item.s3Key}
					loading="lazy"
					decoding="async"
					className={cn('h-full w-full object-cover', !item.isActive && 'opacity-40 grayscale')}
				/>

				<div className="absolute left-2 top-2 flex flex-col gap-1">
					<Badge variant="outline" className="border-slate-200 bg-white/90 text-[10px] font-semibold backdrop-blur-sm">
						{item.ageBucket}세
					</Badge>
					<SourceBadge vendor={item.sourceMeta?.vendor} />
					{!item.isActive ? (
						<Badge variant="outline" className="border-red-300 bg-red-50/90 text-[10px] text-red-600">
							비활성
						</Badge>
					) : null}
				</div>

				<div className="absolute right-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
					×{item.usageCount}
				</div>

				{item.isActive ? (
					<div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100">
						<div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
						<div className="absolute bottom-2 left-2 right-2 flex justify-end">
							<Button
								size="sm"
								variant="destructive"
								className="h-7 px-2 text-[11px]"
								onClick={onDeactivate}
							>
								<XCircle className="mr-1 h-3 w-3" />
								비활성화
							</Button>
						</div>
					</div>
				) : null}
			</div>
		</div>
	);
}
