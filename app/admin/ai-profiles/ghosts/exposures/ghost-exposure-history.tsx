'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import { ghostInjection } from '@/app/services/admin/ghost-injection';
import { formatDateTimeKR } from '@/app/utils/formatters';
import type {
	GhostExposureItem,
	GhostExposureQuery,
	UserGhostExposureActionType,
	UserGhostExposurePath,
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
import { ghostInjectionKeys } from '../../_shared/query-keys';
import { PATH_LABELS } from '../ghost-user-exposure-content';

const DEFAULT_LIMIT = 20;

function SummaryCard({ label, value }: { label: string; value: string | number }) {
	return (
		<div className="rounded-lg border bg-white p-3">
			<p className="text-xs text-gray-500">{label}</p>
			<p className="mt-1 text-lg font-semibold text-gray-900">{value}</p>
		</div>
	);
}

function ExposureRow({ item }: { item: GhostExposureItem }) {
	const isExposed = item.actionType === 'GHOST_EXPOSED';
	return (
		<div className="flex items-center gap-3 rounded-lg border bg-white p-3 hover:bg-gray-50 transition-colors">
			{item.userPhotoUrl ? (
				<img
					src={item.userPhotoUrl}
					alt={item.userName ?? ''}
					className="h-10 w-10 rounded-full object-cover flex-shrink-0"
				/>
			) : (
				<div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0 text-gray-500 text-sm font-medium">
					{item.userName?.charAt(0) ?? '?'}
				</div>
			)}

			<div className="flex-1 min-w-0">
				<div className="flex items-center gap-2">
					<span className="font-medium text-sm text-gray-900 truncate">
						{item.userName ?? item.userId}
					</span>
					<Badge
						variant={isExposed ? 'outline' : 'default'}
						className={isExposed ? 'text-[#e00b41] border-[#ffd1da] bg-[#f7f7f7]' : 'bg-[#ff385c]'}
					>
						{isExposed ? '노출' : '수락'}
					</Badge>
					{item.path && (
						<Badge variant="secondary" className="text-xs">
							{PATH_LABELS[item.path]}
						</Badge>
					)}
				</div>
				<p className="text-xs text-gray-400 mt-0.5">{formatDateTimeKR(item.createdAt)}</p>
			</div>

			{item.connectionId && (
				<a
					href={`/admin/matching-management?connectionId=${item.connectionId}`}
					target="_blank"
					rel="noreferrer"
					className="h-7 w-7 flex items-center justify-center rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 flex-shrink-0"
					title="매칭 상세 보기"
				>
					<ExternalLink className="h-3.5 w-3.5" />
				</a>
			)}
		</div>
	);
}

interface GhostExposureHistoryProps {
	ghostAccountId: string;
}

export function GhostExposureHistory({ ghostAccountId }: GhostExposureHistoryProps) {
	const [query, setQuery] = useState<GhostExposureQuery>({ page: 1, limit: DEFAULT_LIMIT });

	const { data, isLoading, isError } = useQuery({
		queryKey: ghostInjectionKeys.ghostExposures(ghostAccountId, query),
		queryFn: () => ghostInjection.getGhostExposures(ghostAccountId, query),
		enabled: Boolean(ghostAccountId),
	});

	const totalPages = data ? Math.ceil(data.total / DEFAULT_LIMIT) : 0;

	const byPathEntries = data?.summary
		? (Object.entries(data.summary.byPath) as [UserGhostExposurePath, number][]).filter(
				([, c]) => c > 0,
			)
		: [];
	const byPathMax = byPathEntries.length > 0 ? Math.max(...byPathEntries.map(([, c]) => c)) : 1;

	function setFilter(patch: Partial<GhostExposureQuery>) {
		setQuery((prev) => ({ ...prev, ...patch, page: 1 }));
	}

	return (
		<div className="space-y-4">
			{data?.summary && (
				<>
					<div className="grid grid-cols-2 gap-2">
						<SummaryCard label="총 노출" value={data.summary.totalExposures} />
						<SummaryCard label="수락" value={data.summary.totalAccepted} />
						<SummaryCard
							label="전환율"
							value={
								data.summary.totalExposures > 0
									? `${((data.summary.totalAccepted / data.summary.totalExposures) * 100).toFixed(1)}%`
									: '—'
							}
						/>
						<SummaryCard
							label="마지막 노출"
							value={
								data.summary.lastExposedAt
									? formatDateTimeKR(data.summary.lastExposedAt)
									: '없음'
							}
						/>
					</div>

					{byPathEntries.length > 0 && (
						<div className="rounded-lg border bg-white p-3">
							<p className="text-xs text-gray-500 mb-2">경로별 분포</p>
							<div className="space-y-1.5">
								{byPathEntries.map(([path, c]) => (
									<div key={path} className="flex items-center gap-2 text-xs">
										<span className="text-gray-600 w-24 shrink-0">{PATH_LABELS[path]}</span>
										<div className="flex-1 bg-gray-100 rounded-full h-1.5 overflow-hidden">
											<div
												className="bg-[#ff385c] h-full rounded-full"
												style={{ width: `${Math.round((c / byPathMax) * 100)}%` }}
											/>
										</div>
										<span className="font-medium w-4 text-right">{c}</span>
									</div>
								))}
							</div>
						</div>
					)}
				</>
			)}

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
								actionType: v === 'all' ? undefined : (v as UserGhostExposureActionType),
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

			{isLoading && <p className="text-sm text-gray-500 text-center py-8">불러오는 중...</p>}
			{isError && (
				<p className="text-sm text-red-500 text-center py-8">데이터를 불러오지 못했습니다.</p>
			)}
			{data?.items.length === 0 && (
				<p className="text-sm text-gray-400 text-center py-8">노출 이력이 없습니다.</p>
			)}
			{!!data?.items.length && (
				<div className="space-y-2">
					{data.items.map((item) => (
						<ExposureRow key={item.id} item={item} />
					))}
				</div>
			)}

			{totalPages > 1 && (
				<div className="flex items-center justify-center gap-2 pt-2">
					<Button
						variant="outline"
						size="sm"
						disabled={(query.page ?? 1) <= 1}
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
						disabled={(query.page ?? 1) >= totalPages}
						onClick={() => setQuery((prev) => ({ ...prev, page: (prev.page ?? 1) + 1 }))}
					>
						<ChevronRight className="h-4 w-4" />
					</Button>
				</div>
			)}
		</div>
	);
}
