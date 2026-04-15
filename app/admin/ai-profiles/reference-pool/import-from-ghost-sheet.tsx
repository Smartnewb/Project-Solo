'use client';

import { useEffect, useMemo, useState } from 'react';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Check, ChevronLeft, ChevronRight, ImageOff, Loader2, Search } from 'lucide-react';
import { ghostInjection } from '@/app/services/admin/ghost-injection';
import { ghostReferencePool } from '@/app/services/admin/ghost-reference-pool';
import type {
	GhostListItem,
	GhostListQuery,
	GhostRank,
	PromoteFromGhostSelection,
} from '@/app/types/ghost-injection';
import { useDebounce } from '@/shared/hooks';
import { getAdminErrorMessage } from '@/shared/lib/http/admin-fetch';
import { useToast } from '@/shared/ui/admin/toast';
import { Button } from '@/shared/ui/button';
import {
	Dialog,
	DialogContent,
} from '@/shared/ui/dialog';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { cn } from '@/shared/utils';
import { ghostInjectionKeys, referencePoolKeys } from '../_shared/query-keys';
import { RankBadge } from '../_shared/rank-badge';
import { RankToggle } from '../_shared/rank-toggle';
import { ReasonInput, isReasonValid } from '../_shared/reason-input';

interface ImportFromGhostSheetProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

const RANK_OPTIONS: GhostRank[] = ['A', 'B', 'C'];
const PAGE_LIMIT = 20;

export function ImportFromGhostSheet({ open, onOpenChange }: ImportFromGhostSheetProps) {
	const toast = useToast();
	const queryClient = useQueryClient();

	const [ranks, setRanks] = useState<GhostRank[]>(['A', 'B']);
	const [minPhotoCount, setMinPhotoCount] = useState(3);
	const [excludeAlreadyImported, setExcludeAlreadyImported] = useState(true);
	const [searchInput, setSearchInput] = useState('');
	const [page, setPage] = useState(1);
	const [reason, setReason] = useState('');
	const [selected, setSelected] = useState<Map<string, string>>(new Map());

	const debouncedSearch = useDebounce(searchInput, 300);

	useEffect(() => {
		if (open) {
			setRanks(['A', 'B']);
			setMinPhotoCount(3);
			setExcludeAlreadyImported(true);
			setSearchInput('');
			setPage(1);
			setReason('');
			setSelected(new Map());
		}
	}, [open]);

	const query: GhostListQuery = useMemo(
		() => ({
			rank: ranks.length > 0 ? ranks : undefined,
			minPhotoCount,
			excludeAlreadyImported,
			q: debouncedSearch.trim() || undefined,
			status: 'ACTIVE',
			sort: 'rank',
			order: 'asc',
			page,
			limit: PAGE_LIMIT,
			includePhotos: true,
		}),
		[ranks, minPhotoCount, excludeAlreadyImported, debouncedSearch, page],
	);

	const listQuery = useQuery({
		queryKey: ghostInjectionKeys.ghostList(query),
		queryFn: () => ghostInjection.listGhosts(query),
		placeholderData: keepPreviousData,
		enabled: open,
	});

	const items = listQuery.data?.items ?? [];
	const total = listQuery.data?.total ?? 0;
	const totalPages = Math.max(1, Math.ceil(total / PAGE_LIMIT));

	const importMutation = useMutation({
		mutationFn: () => {
			const selections: PromoteFromGhostSelection[] = Array.from(
				selected,
				([photoUrl, ghostAccountId]) => ({ ghostAccountId, photoUrl }),
			);
			return ghostReferencePool.promoteFromGhost({
				selections,
				reason: reason.trim(),
			});
		},
		onSuccess: (data) => {
			const importedCount = data?.imported.length ?? 0;
			const skippedCount = data?.skipped.length ?? 0;
			if (skippedCount > 0) {
				toast.success(`${importedCount}장 임포트 완료 · ${skippedCount}장 건너뜀`);
			} else {
				toast.success(`${importedCount}장이 풀에 추가되었습니다.`);
			}
			queryClient.invalidateQueries({ queryKey: referencePoolKeys.all });
			queryClient.invalidateQueries({ queryKey: ghostInjectionKeys.ghosts() });
			onOpenChange(false);
		},
		onError: (error) => toast.error(getAdminErrorMessage(error)),
	});

	const togglePhoto = (ghostAccountId: string, photoUrl: string) => {
		setSelected((prev) => {
			const next = new Map(prev);
			if (next.has(photoUrl)) next.delete(photoUrl);
			else next.set(photoUrl, ghostAccountId);
			return next;
		});
	};

	const isPending = importMutation.isPending;
	const canSubmit = selected.size > 0 && isReasonValid(reason) && !isPending;

	const handleClose = (next: boolean) => {
		if (isPending) return;
		onOpenChange(next);
	};

	return (
		<Dialog open={open} onOpenChange={handleClose}>
			<DialogContent className="flex h-[92vh] max-w-6xl flex-col p-0">
				<div className="border-b px-6 py-4">
					<h2 className="text-lg font-semibold text-slate-900">기존 프로필에서 임포트</h2>
					<p className="mt-1 text-sm text-slate-500">
						이미 검증된 Ghost 사진을 레퍼런스 풀에 즉시 추가합니다. (Seedream 생성 비용 없음)
					</p>
				</div>

				<div className="sticky top-0 z-10 space-y-3 border-b bg-slate-50 px-6 py-3">
					<div className="flex flex-wrap items-end gap-3">
						<RankToggle
							options={RANK_OPTIONS}
							selected={ranks}
							onChange={(next) => { setRanks(next); setPage(1); }}
						/>

						<div className="space-y-1">
							<Label className="text-xs">최소 사진 수</Label>
							<Input
								type="number"
								min={1}
								max={10}
								value={minPhotoCount}
								onChange={(e) => {
									const v = Number(e.target.value);
									if (Number.isFinite(v) && v >= 1 && v <= 10) {
										setMinPhotoCount(v);
										setPage(1);
									}
								}}
								className="h-9 w-20 text-center tabular-nums"
							/>
						</div>

						<div className="space-y-1">
							<Label className="text-xs">검색</Label>
							<div className="relative">
								<Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
								<Input
									placeholder="이름 또는 학교"
									value={searchInput}
									onChange={(e) => {
										setSearchInput(e.target.value);
										setPage(1);
									}}
									className="h-9 w-56 pl-7"
								/>
							</div>
						</div>

						<label className="flex h-9 items-center gap-1.5 text-xs text-slate-600">
							<input
								type="checkbox"
								checked={excludeAlreadyImported}
								onChange={(e) => {
									setExcludeAlreadyImported(e.target.checked);
									setPage(1);
								}}
								className="h-3.5 w-3.5 rounded border-slate-300"
							/>
							이미 임포트된 사진 제외
						</label>
					</div>
				</div>

				<div className="flex-1 overflow-y-auto px-6 py-4">
					{listQuery.isError ? (
						<div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
							<AlertTriangle className="h-4 w-4" />
							프로필 목록을 불러오지 못했습니다.
						</div>
					) : null}

					{listQuery.isLoading ? (
						<div className="flex items-center justify-center py-12 text-slate-400">
							<Loader2 className="h-6 w-6 animate-spin" />
						</div>
					) : items.length === 0 ? (
						<div className="flex flex-col items-center justify-center py-16 text-slate-400">
							<ImageOff className="mb-2 h-10 w-10" />
							<p className="text-sm">조건에 맞는 프로필이 없습니다</p>
						</div>
					) : (
						<div className="space-y-3">
							{items.map((item) => (
								<GhostRow
									key={item.ghostAccountId}
									item={item}
									selectedPhotos={selected}
									onToggle={togglePhoto}
								/>
							))}
						</div>
					)}
				</div>

				<div className="border-t bg-slate-50 px-6 py-3">
					<div className="mb-3 flex items-center justify-between text-xs text-slate-500">
						<span>
							전체 <span className="font-semibold text-slate-700">{total}</span>명
						</span>
						<div className="flex items-center gap-1">
							<Button
								variant="outline"
								size="sm"
								disabled={page <= 1 || listQuery.isFetching}
								onClick={() => setPage((p) => Math.max(1, p - 1))}
							>
								<ChevronLeft className="h-3 w-3" />
							</Button>
							<span className="px-2 tabular-nums">
								{page} / {totalPages}
							</span>
							<Button
								variant="outline"
								size="sm"
								disabled={page >= totalPages || listQuery.isFetching}
								onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
							>
								<ChevronRight className="h-3 w-3" />
							</Button>
						</div>
					</div>

					<div className="flex items-end gap-3">
						<div className="flex-1">
							<ReasonInput
								value={reason}
								onChange={setReason}
								minLength={10}
								rows={2}
								placeholder="예: A등급 부트스트래핑 임포트"
							/>
						</div>
						<div className="flex flex-col items-end gap-1">
							<div className="text-xs text-slate-500">
								선택 <span className="font-semibold text-slate-900">{selected.size}</span>장
							</div>
							<div className="flex items-center gap-2">
								<Button variant="outline" onClick={() => handleClose(false)} disabled={isPending}>
									취소
								</Button>
								<Button onClick={() => importMutation.mutate()} disabled={!canSubmit}>
									{isPending ? (
										<>
											<Loader2 className="mr-1 h-4 w-4 animate-spin" /> 임포트 중…
										</>
									) : (
										`${selected.size}장 임포트`
									)}
								</Button>
							</div>
						</div>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}

function GhostRow({
	item,
	selectedPhotos,
	onToggle,
}: {
	item: GhostListItem;
	selectedPhotos: Map<string, string>;
	onToggle: (ghostAccountId: string, photoUrl: string) => void;
}) {
	const photos =
		item.photoUrls && item.photoUrls.length > 0
			? item.photoUrls
			: item.primaryPhotoUrl
				? [item.primaryPhotoUrl]
				: [];
	const importedSet = useMemo(
		() => new Set(item.importedPhotoUrls ?? []),
		[item.importedPhotoUrls],
	);

	return (
		<div className="rounded-lg border bg-white p-3">
			<div className="mb-2 flex items-center gap-2">
				<RankBadge rank={item.rank} />
				<span className="text-sm font-semibold text-slate-900">{item.name}</span>
				<span className="text-xs text-slate-500">
					{item.age}세 · {item.mbti ?? '—'}
				</span>
				{item.university ? (
					<span className="text-xs text-slate-400">· {item.university.name}</span>
				) : null}
				<span className="ml-auto text-[11px] text-slate-400">사진 {item.photoCount}장</span>
			</div>

			<div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
				{photos.map((photoUrl, idx) => {
					const isImported = importedSet.has(photoUrl);
					const isSelected = selectedPhotos.has(photoUrl);
					const disabled = isImported;

					return (
						<button
							key={`${item.ghostAccountId}-${idx}`}
							type="button"
							disabled={disabled}
							onClick={() => onToggle(item.ghostAccountId, photoUrl)}
							className={cn(
								'relative aspect-[3/4] overflow-hidden rounded-md border-2 transition-all',
								isSelected && 'border-blue-500 ring-2 ring-blue-200',
								!isSelected && !disabled && 'border-transparent hover:border-slate-300',
								disabled && 'cursor-not-allowed border-slate-200',
							)}
						>
							{/* eslint-disable-next-line @next/next/no-img-element */}
							<img
								src={photoUrl}
								alt={`${item.name} ${idx + 1}`}
								loading="lazy"
								decoding="async"
								className={cn('h-full w-full object-cover', disabled && 'opacity-30 grayscale')}
							/>
							{isSelected ? (
								<div className="absolute inset-0 flex items-center justify-center bg-blue-500/20">
									<div className="rounded-full bg-blue-500 p-1">
										<Check className="h-3 w-3 text-white" />
									</div>
								</div>
							) : null}
							{isImported ? (
								<div className="absolute inset-x-0 bottom-0 bg-slate-900/70 px-1 py-0.5 text-center text-[9px] font-medium text-white">
									임포트됨
								</div>
							) : null}
						</button>
					);
				})}
			</div>
		</div>
	);
}
