'use client';

import { ImageOff } from 'lucide-react';
import type { GhostListItem } from '@/app/types/ghost-injection';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Card, CardContent } from '@/shared/ui/card';
import { GhostStatusBadge } from './ghost-status-badge';

interface GhostCardViewProps {
	items: GhostListItem[];
	isLoading: boolean;
	onCardClick: (ghost: GhostListItem) => void;
	onToggleStatus: (ghost: GhostListItem) => void;
}

export function GhostCardView({
	items,
	isLoading,
	onCardClick,
	onToggleStatus,
}: GhostCardViewProps) {
	if (isLoading) {
		return (
			<div className="rounded-md border bg-white py-12 text-center text-sm text-slate-500">
				불러오는 중…
			</div>
		);
	}

	if (items.length === 0) {
		return (
			<div className="rounded-md border bg-white py-12 text-center text-sm text-slate-500">
				가상 프로필이 없습니다.
			</div>
		);
	}

	return (
		<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
			{items.map((item) => (
				<Card
					key={item.ghostAccountId}
					className="cursor-pointer overflow-hidden transition-shadow hover:shadow-md"
					onClick={() => onCardClick(item)}
				>
					<div className="relative aspect-[3/4] bg-slate-100">
						{item.primaryPhotoUrl ? (
							// eslint-disable-next-line @next/next/no-img-element
							<img
								src={item.primaryPhotoUrl}
								alt={item.name}
								className="h-full w-full object-cover"
							/>
						) : (
							<div className="flex h-full w-full items-center justify-center text-slate-400">
								<ImageOff className="h-10 w-10" />
							</div>
						)}
						<GhostStatusBadge
							status={item.status}
							isExhausted={item.isExhausted}
							className="absolute left-2 top-2"
						/>
						{item.photoCount > 1 ? (
							<Badge variant="secondary" className="absolute right-2 top-2">
								{item.photoCount} 사진
							</Badge>
						) : null}
					</div>
					<CardContent className="space-y-2 p-3">
						<div className="flex items-baseline justify-between">
							<div className="font-semibold text-slate-900">{item.name}</div>
							<div className="text-xs text-slate-500">만 {item.age}세</div>
						</div>
						<div className="text-xs text-slate-500">
							{item.mbti ?? '—'} · {item.archetype?.name ?? '유형 없음'}
						</div>
						<div className="truncate text-xs text-slate-600">
							{item.university?.name ?? '대학 없음'}
						</div>
						<div className="truncate text-xs text-slate-500">
							{item.department?.name ?? '학과 없음'}
						</div>
						<Button
							variant="outline"
							size="sm"
							className="w-full"
							onClick={(event) => {
								event.stopPropagation();
								onToggleStatus(item);
							}}
						>
							{item.status === 'ACTIVE' ? '비활성화' : '활성화'}
						</Button>
					</CardContent>
				</Card>
			))}
		</div>
	);
}
