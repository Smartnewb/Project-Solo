'use client';

import { ImageOff } from 'lucide-react';
import type { GhostListItem } from '@/app/types/ghost-injection';
import { Button } from '@/shared/ui/button';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/shared/ui/table';
import { RankBadge } from '../_shared/rank-badge';
import { GhostStatusBadge } from './ghost-status-badge';

interface GhostTableViewProps {
	items: GhostListItem[];
	isLoading: boolean;
	onRowClick: (ghost: GhostListItem) => void;
	onToggleStatus: (ghost: GhostListItem) => void;
}

function formatDate(value: string): string {
	try {
		return new Date(value).toLocaleDateString('ko-KR');
	} catch {
		return value;
	}
}

export function GhostTableView({
	items,
	isLoading,
	onRowClick,
	onToggleStatus,
}: GhostTableViewProps) {
	return (
		<div className="rounded-md border bg-white">
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead className="w-16">사진</TableHead>
						<TableHead>이름 / 나이</TableHead>
						<TableHead>MBTI</TableHead>
						<TableHead>등급</TableHead>
						<TableHead>대학 / 학과</TableHead>
						<TableHead>상태</TableHead>
						<TableHead>수정일</TableHead>
						<TableHead className="text-right">액션</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{isLoading ? (
						<TableRow>
							<TableCell colSpan={8} className="py-12 text-center text-sm text-slate-500">
								불러오는 중…
							</TableCell>
						</TableRow>
					) : items.length === 0 ? (
						<TableRow>
							<TableCell colSpan={8} className="py-12 text-center text-sm text-slate-500">
								가상 프로필이 없습니다.
							</TableCell>
						</TableRow>
					) : (
						items.map((item) => (
							<TableRow
								key={item.ghostAccountId}
								className="cursor-pointer hover:bg-slate-50"
								onClick={() => onRowClick(item)}
							>
								<TableCell>
									{item.primaryPhotoUrl ? (
										// eslint-disable-next-line @next/next/no-img-element
										<img
											src={item.primaryPhotoUrl}
											alt={item.name}
											className="h-10 w-10 rounded-full object-cover"
										/>
									) : (
										<div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-400">
											<ImageOff className="h-4 w-4" />
										</div>
									)}
								</TableCell>
								<TableCell>
									<div className="font-medium text-slate-900">{item.name}</div>
									<div className="text-xs text-slate-500">만 {item.age}세</div>
								</TableCell>
								<TableCell className="text-sm">{item.mbti ?? '—'}</TableCell>
								<TableCell>
									<RankBadge rank={item.rank} />
								</TableCell>
								<TableCell className="text-sm">
									<div>{item.university?.name ?? '—'}</div>
									<div className="text-xs text-slate-500">{item.department?.name ?? '—'}</div>
								</TableCell>
								<TableCell>
									<GhostStatusBadge status={item.status} isExhausted={item.isExhausted} />
								</TableCell>
								<TableCell className="text-xs text-slate-500">
									{formatDate(item.updatedAt)}
								</TableCell>
								<TableCell className="text-right">
									<Button
										variant="outline"
										size="sm"
										onClick={(event) => {
											event.stopPropagation();
											onToggleStatus(item);
										}}
									>
										{item.status === 'ACTIVE' ? '비활성화' : '활성화'}
									</Button>
								</TableCell>
							</TableRow>
						))
					)}
				</TableBody>
			</Table>
		</div>
	);
}
