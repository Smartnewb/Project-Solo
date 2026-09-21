'use client';

import { useEffect, useMemo, useState } from 'react';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Check, ChevronLeft, ChevronRight, ImageOff, Loader2, User } from 'lucide-react';
import { ghostReferencePool } from '@/app/services/admin/ghost-reference-pool';
import type {
	AgeBucket,
	PromoteFromUserSelection,
	RealUserListItem,
	RealUserListQuery,
	UserRank,
} from '@/app/types/ghost-injection';
import { getAdminErrorMessage } from '@/shared/lib/http/admin-fetch';
import { useToast } from '@/shared/ui/admin/toast';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import {
	Dialog,
	DialogContent,
} from '@/shared/ui/dialog';
import { Label } from '@/shared/ui/label';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/shared/ui/select';
import { cn } from '@/shared/utils';
import { AGE_BUCKETS } from '../_shared/age-bucket-select';
import { referencePoolKeys } from '../_shared/query-keys';
import { RankToggle } from '../_shared/rank-toggle';
import { ReasonInput, isReasonValid } from '../_shared/reason-input';

interface ImportFromUserSheetProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

const RANK_OPTIONS: UserRank[] = ['S', 'A', 'B', 'C'];
const PAGE_LIMIT = 20;

export function ImportFromUserSheet({ open, onOpenChange }: ImportFromUserSheetProps) {
	const toast = useToast();
	const queryClient = useQueryClient();

	const [ranks, setRanks] = useState<UserRank[]>(['S', 'A']);
	const [ageBucket, setAgeBucket] = useState<AgeBucket | undefined>(undefined);
	const [excludeAlreadyImported, setExcludeAlreadyImported] = useState(true);
	const [page, setPage] = useState(1);
	const [reason, setReason] = useState('');
	const [selected, setSelected] = useState<Map<string, string>>(new Map());

	useEffect(() => {
		if (open) {
			setRanks(['S', 'A']);
			setAgeBucket(undefined);
			setExcludeAlreadyImported(true);
			setPage(1);
			setReason('');
			setSelected(new Map());
		}
	}, [open]);

	const query: RealUserListQuery = useMemo(
		() => ({
			rank: ranks.length > 0 ? ranks : undefined,
			ageBucket,
			excludeAlreadyImported,
			page,
			limit: PAGE_LIMIT,
		}),
		[ranks, ageBucket, excludeAlreadyImported, page],
	);

	const listQuery = useQuery({
		queryKey: referencePoolKeys.realUsers(query),
		queryFn: () => ghostReferencePool.listRealUsers(query),
		placeholderData: keepPreviousData,
		enabled: open,
	});

	const items = listQuery.data?.items ?? [];
	const meta = listQuery.data?.meta;
	const totalItems = meta?.totalItems ?? 0;
	const totalPages = meta ? Math.max(1, Math.ceil(meta.totalItems / meta.itemsPerPage)) : 1;

	const importMutation = useMutation({
		mutationFn: () => {
			const selections: PromoteFromUserSelection[] = Array.from(
				selected,
				([photoUrl, userId]) => ({ userId, photoUrl }),
			);
			return ghostReferencePool.promoteFromUser({
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
			onOpenChange(false);
		},
		onError: (error) => toast.error(getAdminErrorMessage(error)),
	});

	const togglePhoto = (userId: string, photoUrl: string) => {
		setSelected((prev) => {
			const next = new Map(prev);
			if (next.has(photoUrl)) next.delete(photoUrl);
			else next.set(photoUrl, userId);
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
					<div className="flex items-center gap-2">
						<User className="h-5 w-5 text-violet-500" />
						<h2 className="text-lg font-semibold text-slate-900">실제 유저 사진에서 임포트</h2>
					</div>
					<p className="mt-1 text-sm text-slate-500">
						실제 여성 유저의 승인된 사진을 레퍼런스 풀에 추가합니다. 실사 기반으로 가장 자연스러운 결과를 기대할 수 있습니다.
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
							<Label className="text-xs">연령대</Label>
							<Select
								value={ageBucket ?? '__all__'}
								onValueChange={(v) => {
									setAgeBucket(v === '__all__' ? undefined : (v as AgeBucket));
									setPage(1);
								}}
							>
								<SelectTrigger className="h-9 w-28">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="__all__">전체</SelectItem>
									{AGE_BUCKETS.map((b) => (
										<SelectItem key={b} value={b}>{b}세</SelectItem>
									))}
								</SelectContent>
							</Select>
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
							유저 목록을 불러오지 못했습니다.
						</div>
					) : null}

					{listQuery.isLoading ? (
						<div className="flex items-center justify-center py-12 text-slate-400">
							<Loader2 className="h-6 w-6 animate-spin" />
						</div>
					) : items.length === 0 ? (
						<div className="flex flex-col items-center justify-center py-16 text-slate-400">
							<ImageOff className="mb-2 h-10 w-10" />
							<p className="text-sm">조건에 맞는 유저가 없습니다</p>
						</div>
					) : (
						<div className="space-y-3">
							{items.map((item) => (
								<UserRow
									key={item.userId}
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
							전체 <span className="font-semibold text-slate-700">{totalItems}</span>명
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
								placeholder="예: S/A등급 유저 사진 부트스트래핑 임포트"
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

function UserRow({
	item,
	selectedPhotos,
	onToggle,
}: {
	item: RealUserListItem;
	selectedPhotos: Map<string, string>;
	onToggle: (userId: string, photoUrl: string) => void;
}) {
	const importedSet = useMemo(
		() => new Set(item.importedPhotoUrls ?? []),
		[item.importedPhotoUrls],
	);

	return (
		<div className="rounded-lg border bg-white p-3">
			<div className="mb-2 flex items-center gap-2">
				<Badge variant="outline" className="text-[10px] font-semibold">
					{item.rank}
				</Badge>
				<span className="text-sm font-semibold text-slate-900">{item.name}</span>
				<span className="text-xs text-slate-500">{item.age}세</span>
				<span className="ml-auto text-[11px] text-slate-400">사진 {item.photoCount}장</span>
			</div>

			<div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
				{item.photos.map((photo) => {
					const isImported = importedSet.has(photo.s3Url);
					const isSelected = selectedPhotos.has(photo.s3Url);
					const disabled = isImported;

					return (
						<button
							key={photo.imageId}
							type="button"
							disabled={disabled}
							onClick={() => onToggle(item.userId, photo.s3Url)}
							className={cn(
								'relative aspect-[3/4] overflow-hidden rounded-md border-2 transition-all',
								isSelected && 'border-violet-500 ring-2 ring-violet-200',
								!isSelected && !disabled && 'border-transparent hover:border-slate-300',
								disabled && 'cursor-not-allowed border-slate-200',
							)}
						>
							{/* eslint-disable-next-line @next/next/no-img-element */}
							<img
								src={photo.s3Url}
								alt={`${item.name} ${photo.slotIndex + 1}`}
								loading="lazy"
								decoding="async"
								className={cn('h-full w-full object-cover', disabled && 'opacity-30 grayscale')}
							/>
							{isSelected ? (
								<div className="absolute inset-0 flex items-center justify-center bg-violet-500/20">
									<div className="rounded-full bg-violet-500 p-1">
										<Check className="h-3 w-3 text-white" />
									</div>
								</div>
							) : null}
							{photo.isMain ? (
								<div className="absolute left-1 top-1 rounded bg-black/60 px-1 py-0.5 text-[9px] font-medium text-white">
									대표
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
