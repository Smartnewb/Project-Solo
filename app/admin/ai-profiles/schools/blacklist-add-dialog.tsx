'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, ChevronsUpDown } from 'lucide-react';
import { universities } from '@/app/services/admin';
import { ghostInjection } from '@/app/services/admin/ghost-injection';
import { useDebounce } from '@/shared/hooks';
import { AdminApiError } from '@/shared/lib/http/admin-fetch';
import { useToast } from '@/shared/ui/admin/toast';
import { Button } from '@/shared/ui/button';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/shared/ui/dialog';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover';
import { cn } from '@/shared/utils';
import { ReasonInput, isReasonValid } from '../_shared/reason-input';
import { ghostInjectionKeys } from '../_shared/query-keys';

interface BlacklistAddDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

interface SchoolOption {
	id: string;
	name: string;
}

export function BlacklistAddDialog({ open, onOpenChange }: BlacklistAddDialogProps) {
	const toast = useToast();
	const queryClient = useQueryClient();
	const [school, setSchool] = useState<SchoolOption | null>(null);
	const [reason, setReason] = useState('');
	const [schoolSearch, setSchoolSearch] = useState('');
	const debouncedSearch = useDebounce(schoolSearch, 300);
	const [popoverOpen, setPopoverOpen] = useState(false);

	useEffect(() => {
		if (open) {
			setSchool(null);
			setReason('');
			setSchoolSearch('');
		}
	}, [open]);

	const schoolsQuery = useQuery({
		queryKey: ['admin', 'universities', 'list', debouncedSearch],
		queryFn: async () => {
			const result = await universities.getList({
				page: 1,
				limit: 30,
				name: debouncedSearch || undefined,
				isActive: true,
			});
			return result as { items: Array<{ id: string; name: string }> };
		},
		enabled: open && popoverOpen,
		staleTime: 5 * 60 * 1000,
	});

	const schoolItems = schoolsQuery.data?.items ?? [];

	const mutation = useMutation({
		mutationFn: () => {
			if (!school) throw new Error('학교를 선택해주세요.');
			return ghostInjection.addBlacklist({
				schoolId: school.id,
				schoolName: school.name,
				reason: reason.trim(),
			});
		},
		onSuccess: () => {
			toast.success('차단 목록에 추가되었습니다.');
			queryClient.invalidateQueries({ queryKey: ghostInjectionKeys.blacklist() });
			onOpenChange(false);
		},
		onError: (error) => {
			const msg =
				error instanceof AdminApiError
					? ((error.body as { message?: string } | null)?.message ?? error.message)
					: error instanceof Error
					  ? error.message
					  : '요청 실패';
			toast.error(msg);
		},
	});

	const canSubmit = Boolean(school) && isReasonValid(reason) && !mutation.isPending;

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>차단 학교 추가</DialogTitle>
					<DialogDescription>
						해당 학교에는 즉시 가상 프로필 노출이 차단됩니다.
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-4 py-2">
					<div className="space-y-1">
						<Label>학교 *</Label>
						<Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
							<PopoverTrigger asChild>
								<Button
									variant="outline"
									role="combobox"
									className="w-full justify-between font-normal"
								>
									<span className={cn(!school && 'text-slate-400')}>
										{school?.name ?? '학교를 선택하세요'}
									</span>
									<ChevronsUpDown className="h-4 w-4 opacity-50" />
								</Button>
							</PopoverTrigger>
							<PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
								<div className="border-b p-2">
									<Input
										placeholder="학교명 검색"
										value={schoolSearch}
										onChange={(event) => setSchoolSearch(event.target.value)}
										className="h-8"
									/>
								</div>
								<div className="max-h-60 overflow-y-auto py-1">
									{schoolsQuery.isLoading ? (
										<div className="px-3 py-2 text-xs text-slate-500">불러오는 중…</div>
									) : schoolItems.length === 0 ? (
										<div className="px-3 py-2 text-xs text-slate-500">결과가 없습니다.</div>
									) : (
										schoolItems.map((item) => (
											<button
												key={item.id}
												type="button"
												className="flex w-full items-center justify-between px-3 py-1.5 text-sm hover:bg-slate-100"
												onClick={() => {
													setSchool({ id: item.id, name: item.name });
													setPopoverOpen(false);
												}}
											>
												<span>{item.name}</span>
												{school?.id === item.id ? <Check className="h-4 w-4" /> : null}
											</button>
										))
									)}
								</div>
							</PopoverContent>
						</Popover>
					</div>

					<ReasonInput value={reason} onChange={setReason} minLength={10} />
				</div>

				<DialogFooter>
					<Button variant="outline" onClick={() => onOpenChange(false)} disabled={mutation.isPending}>
						취소
					</Button>
					<Button onClick={() => mutation.mutate()} disabled={!canSubmit}>
						{mutation.isPending ? '추가 중…' : '추가'}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
