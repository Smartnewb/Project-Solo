'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import { ghostInjection } from '@/app/services/admin/ghost-injection';
import type {
	UserGhostExposureActionType,
	UserGhostExposureItem,
	UserGhostExposurePath,
	UserGhostExposureQuery,
} from '@/app/types/ghost-injection';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/shared/ui/select';
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
} from '@/shared/ui/sheet';
import { ghostInjectionKeys } from '../_shared/query-keys';

const PATH_LABELS: Record<UserGhostExposurePath, string> = {
	v4_fallback: 'V4 폴백',
	proactive_fill: '선제 채우기',
	scheduled_fill: '스케줄 채우기',
	like_cron: '좋아요 크론',
};

function formatDate(iso: string): string {
	try {
		return new Date(iso).toLocaleString('ko-KR');
	} catch {
		return iso;
	}
}

function SummaryCard({ label, value }: { label: string; value: string | number }) {
	return (
		<div className="rounded-lg border bg-white p-3">
			<p className="text-xs text-gray-500">{label}</p>
			<p className="mt-1 text-lg font-semibold text-gray-900">{value}</p>
		</div>
	);
}

function ExposureRow({
	item,
	onGhostClick,
}: {
	item: UserGhostExposureItem;
	onGhostClick: (ghostAccountId: string) => void;
}) {
	const isExposed = item.actionType === 'GHOST_EXPOSED';
	return (
		<div
			className="flex items-center gap-3 rounded-lg border bg-white p-3 hover:bg-gray-50 transition-colors"
		>
			{item.ghostPrimaryPhotoUrl ? (
				<img
					src={item.ghostPrimaryPhotoUrl}
					alt={item.ghostName}
					className="h-10 w-10 rounded-full object-cover flex-shrink-0"
				/>
			) : (
				<div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0 text-gray-500 text-sm font-medium">
					{item.ghostName.charAt(0)}
				</div>
			)}

			<div className="flex-1 min-w-0">
				<div className="flex items-center gap-2">
					<span className="font-medium text-sm text-gray-900 truncate">{item.ghostName}</span>
					<Badge
						variant={isExposed ? 'outline' : 'default'}
						className={isExposed ? 'text-blue-700 border-blue-300 bg-blue-50' : 'bg-green-600'}
					>
						{isExposed ? '노출' : '수락'}
					</Badge>
					{item.path && (
						<Badge variant="secondary" className="text-xs">
							{PATH_LABELS[item.path]}
						</Badge>
					)}
				</div>
				<p className="text-xs text-gray-400 mt-0.5">{formatDate(item.createdAt)}</p>
			</div>

			<Button
				variant="ghost"
				size="sm"
				className="flex-shrink-0 h-7 w-7 p-0"
				onClick={() => onGhostClick(item.ghostAccountId)}
				title="Ghost 상세 보기"
			>
				<ExternalLink className="h-3.5 w-3.5" />
			</Button>
		</div>
	);
}

interface GhostUserExposureSheetProps {
	userId: string | null;
	userName?: string;
	onClose: () => void;
	onGhostSelect: (ghostAccountId: string) => void;
}

export function GhostUserExposureSheet({
	userId,
	userName,
	onClose,
	onGhostSelect,
}: GhostUserExposureSheetProps) {
	const [query, setQuery] = useState<UserGhostExposureQuery>({ page: 1, limit: 20 });

	const { data, isLoading, isError } = useQuery({
		queryKey: ghostInjectionKeys.userExposures(userId ?? '', query),
		queryFn: () => ghostInjection.getUserExposures(userId as string, query),
		enabled: Boolean(userId),
	});

	const totalPages = data ? Math.ceil(data.total / (query.limit ?? 20)) : 0;

	function setFilter(patch: Partial<UserGhostExposureQuery>) {
		setQuery((prev) => ({ ...prev, ...patch, page: 1 }));
	}

	function handleGhostClick(ghostAccountId: string) {
		onGhostSelect(ghostAccountId);
		onClose();
	}

	return (
		<Sheet open={Boolean(userId)} onOpenChange={(open) => !open && onClose()}>
			<SheetContent className="w-full sm:max-w-xl overflow-y-auto flex flex-col gap-0 p-0">
				<SheetHeader className="px-6 pt-6 pb-4 border-b">
					<SheetTitle className="text-base">
						Ghost 노출 이력
						{userName && (
							<span className="ml-2 text-sm font-normal text-gray-500">— {userName}</span>
						)}
					</SheetTitle>
				</SheetHeader>

				<div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
					{/* Summary */}
					{data?.summary && (
						<div className="grid grid-cols-2 gap-2">
							<SummaryCard label="총 노출" value={data.summary.totalExposures} />
							<SummaryCard label="수락" value={data.summary.totalAccepted} />
							<SummaryCard
								label="마지막 노출"
								value={data.summary.lastExposedAt ? formatDate(data.summary.lastExposedAt) : '없음'}
							/>
							<div className="rounded-lg border bg-white p-3">
								<p className="text-xs text-gray-500 mb-1">경로별</p>
								<div className="space-y-0.5">
									{(Object.entries(data.summary.byPath) as [UserGhostExposurePath, number][])
										.filter(([, count]) => count > 0)
										.map(([path, count]) => (
											<div key={path} className="flex justify-between text-xs">
												<span className="text-gray-600">{PATH_LABELS[path]}</span>
												<span className="font-medium">{count}</span>
											</div>
										))}
								</div>
							</div>
						</div>
					)}

					{/* 필터 */}
					<div className="flex flex-wrap gap-2">
						<div className="w-36">
							<Select
								value={query.path ?? 'all'}
								onValueChange={(v) =>
									setFilter({ path: v === 'all' ? undefined : (v as UserGhostExposurePath) })
								}
							>
								<SelectTrigger className="h-8 text-xs">
									<SelectValue placeholder="경로" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">전체 경로</SelectItem>
									{(Object.entries(PATH_LABELS) as [UserGhostExposurePath, string][]).map(
										([value, label]) => (
											<SelectItem key={value} value={value}>
												{label}
											</SelectItem>
										),
									)}
								</SelectContent>
							</Select>
						</div>

						<div className="w-32">
							<Select
								value={query.actionType ?? 'all'}
								onValueChange={(v) =>
									setFilter({
										actionType:
											v === 'all' ? undefined : (v as UserGhostExposureActionType),
									})
								}
							>
								<SelectTrigger className="h-8 text-xs">
									<SelectValue placeholder="타입" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">전체 타입</SelectItem>
									<SelectItem value="GHOST_EXPOSED">노출</SelectItem>
									<SelectItem value="GHOST_ACCEPTED">수락</SelectItem>
								</SelectContent>
							</Select>
						</div>

						<div className="flex items-center gap-1">
							<Label className="text-xs text-gray-500 whitespace-nowrap">from</Label>
							<Input
								type="datetime-local"
								className="h-8 text-xs w-44"
								value={query.from ?? ''}
								onChange={(e) => setFilter({ from: e.target.value || undefined })}
							/>
						</div>

						<div className="flex items-center gap-1">
							<Label className="text-xs text-gray-500 whitespace-nowrap">to</Label>
							<Input
								type="datetime-local"
								className="h-8 text-xs w-44"
								value={query.to ?? ''}
								onChange={(e) => setFilter({ to: e.target.value || undefined })}
							/>
						</div>
					</div>

					{/* 리스트 */}
					{isLoading && (
						<p className="text-sm text-gray-500 text-center py-8">불러오는 중...</p>
					)}
					{isError && (
						<p className="text-sm text-red-500 text-center py-8">
							데이터를 불러오지 못했습니다.
						</p>
					)}
					{data && data.items.length === 0 && (
						<p className="text-sm text-gray-400 text-center py-8">노출 이력이 없습니다.</p>
					)}
					{data && data.items.length > 0 && (
						<div className="space-y-2">
							{data.items.map((item) => (
								<ExposureRow key={item.id} item={item} onGhostClick={handleGhostClick} />
							))}
						</div>
					)}

					{/* 페이지네이션 */}
					{totalPages > 1 && (
						<div className="flex items-center justify-center gap-2 pt-2">
							<Button
								variant="outline"
								size="sm"
								disabled={!data || (query.page ?? 1) <= 1}
								onClick={() => setQuery((prev) => ({ ...prev, page: (prev.page ?? 1) - 1 }))}
							>
								<ChevronLeft className="h-4 w-4" />
							</Button>
							<span className="text-sm text-gray-600">
								{query.page ?? 1} / {totalPages}
							</span>
							<Button
								variant="outline"
								size="sm"
								disabled={!data || (query.page ?? 1) >= totalPages}
								onClick={() => setQuery((prev) => ({ ...prev, page: (prev.page ?? 1) + 1 }))}
							>
								<ChevronRight className="h-4 w-4" />
							</Button>
						</div>
					)}
				</div>
			</SheetContent>
		</Sheet>
	);
}
