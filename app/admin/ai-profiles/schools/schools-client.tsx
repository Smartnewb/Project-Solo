'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2 } from 'lucide-react';
import { ghostInjection } from '@/app/services/admin/ghost-injection';
import type {
	BlacklistEntryItem,
	PhaseSchoolItem,
} from '@/app/types/ghost-injection';
import { AdminApiError } from '@/shared/lib/http/admin-fetch';
import { useConfirm } from '@/shared/ui/admin/confirm-dialog';
import { useToast } from '@/shared/ui/admin/toast';
import { Alert, AlertDescription } from '@/shared/ui/alert';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/shared/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs';
import { ghostInjectionKeys } from '../_shared/query-keys';
import { BlacklistAddDialog } from './blacklist-add-dialog';
import { PhaseSchoolEditDialog } from './phase-school-edit-dialog';

function formatDate(value: string): string {
	try {
		return new Date(value).toLocaleString('ko-KR');
	} catch {
		return value;
	}
}

function BlacklistPanel() {
	const toast = useToast();
	const confirm = useConfirm();
	const queryClient = useQueryClient();
	const [dialogOpen, setDialogOpen] = useState(false);

	const { data, isLoading, isError } = useQuery({
		queryKey: ghostInjectionKeys.blacklist(),
		queryFn: () => ghostInjection.listBlacklist(),
	});

	const removeMutation = useMutation({
		mutationFn: ({ schoolId, reason }: { schoolId: string; reason: string }) =>
			ghostInjection.removeBlacklist(schoolId, { reason }),
		onSuccess: () => {
			toast.success('블랙리스트에서 제거되었습니다.');
			queryClient.invalidateQueries({ queryKey: ghostInjectionKeys.blacklist() });
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

	const handleRemove = async (entry: BlacklistEntryItem) => {
		const ok = await confirm({
			title: '블랙리스트 제거',
			message: `${entry.schoolName}을(를) 블랙리스트에서 제거하시겠어요? 해당 학교에 Ghost 주입이 다시 가능해집니다.`,
			confirmText: '제거',
			severity: 'warning',
		});
		if (!ok) return;
		removeMutation.mutate({
			schoolId: entry.schoolId,
			reason: '어드민 수동 제거',
		});
	};

	const items = data?.items ?? [];

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<p className="text-sm text-slate-500">
					신고율이 높거나 문제가 있는 학교를 차단합니다. 즉시 반영(60초 캐시).
				</p>
				<Button onClick={() => setDialogOpen(true)}>
					<Plus className="mr-2 h-4 w-4" /> 블랙리스트 추가
				</Button>
			</div>

			{isError ? (
				<Alert variant="destructive">
					<AlertDescription>블랙리스트를 불러오지 못했습니다.</AlertDescription>
				</Alert>
			) : null}

			<div className="rounded-md border bg-white">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>학교명</TableHead>
							<TableHead>학교 ID</TableHead>
							<TableHead>사유</TableHead>
							<TableHead>등록자</TableHead>
							<TableHead>등록일</TableHead>
							<TableHead className="w-16" />
						</TableRow>
					</TableHeader>
					<TableBody>
						{isLoading ? (
							<TableRow>
								<TableCell colSpan={6} className="py-12 text-center text-sm text-slate-500">
									불러오는 중…
								</TableCell>
							</TableRow>
						) : items.length === 0 ? (
							<TableRow>
								<TableCell colSpan={6} className="py-12 text-center text-sm text-slate-500">
									블랙리스트가 비어 있습니다.
								</TableCell>
							</TableRow>
						) : (
							items.map((entry) => (
								<TableRow key={entry.schoolId}>
									<TableCell className="font-medium">{entry.schoolName}</TableCell>
									<TableCell className="font-mono text-xs text-slate-500">
										{entry.schoolId}
									</TableCell>
									<TableCell className="text-sm text-slate-600">{entry.reason}</TableCell>
									<TableCell className="text-xs text-slate-500">
										{entry.addedBy ?? '—'}
									</TableCell>
									<TableCell className="text-xs text-slate-500">
										{formatDate(entry.addedAt)}
									</TableCell>
									<TableCell>
										<Button
											variant="outline"
											size="icon"
											onClick={() => handleRemove(entry)}
											disabled={removeMutation.isPending}
										>
											<Trash2 className="h-4 w-4" />
										</Button>
									</TableCell>
								</TableRow>
							))
						)}
					</TableBody>
				</Table>
			</div>

			<BlacklistAddDialog open={dialogOpen} onOpenChange={setDialogOpen} />
		</div>
	);
}

function PhaseSchoolsPanel() {
	const [dialogOpen, setDialogOpen] = useState(false);
	const [target, setTarget] = useState<PhaseSchoolItem | null>(null);

	const { data, isLoading, isError } = useQuery({
		queryKey: ghostInjectionKeys.phaseSchoolList({}),
		queryFn: () => ghostInjection.listPhaseSchools({}),
	});

	const items = data?.items ?? [];

	const handleCreate = () => {
		setTarget(null);
		setDialogOpen(true);
	};

	const handleEdit = (item: PhaseSchoolItem) => {
		setTarget(item);
		setDialogOpen(true);
	};

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<p className="text-sm text-slate-500">
					학교를 TREATMENT(Ghost 주입 대상) 또는 CONTROL(대조군) 버킷에 배정합니다.
				</p>
				<Button onClick={handleCreate}>
					<Plus className="mr-2 h-4 w-4" /> Phase-School 등록
				</Button>
			</div>

			{isError ? (
				<Alert variant="destructive">
					<AlertDescription>Phase-School 목록을 불러오지 못했습니다.</AlertDescription>
				</Alert>
			) : null}

			<div className="rounded-md border bg-white">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>학교명</TableHead>
							<TableHead>버킷</TableHead>
							<TableHead>Phase</TableHead>
							<TableHead className="text-right">활성 Ghost</TableHead>
							<TableHead>수정일</TableHead>
							<TableHead className="w-16" />
						</TableRow>
					</TableHeader>
					<TableBody>
						{isLoading ? (
							<TableRow>
								<TableCell colSpan={6} className="py-12 text-center text-sm text-slate-500">
									불러오는 중…
								</TableCell>
							</TableRow>
						) : items.length === 0 ? (
							<TableRow>
								<TableCell colSpan={6} className="py-12 text-center text-sm text-slate-500">
									등록된 Phase-School이 없습니다.
								</TableCell>
							</TableRow>
						) : (
							items.map((item) => (
								<TableRow key={item.schoolId}>
									<TableCell className="font-medium">{item.schoolName}</TableCell>
									<TableCell>
										<Badge
											variant={item.bucket === 'TREATMENT' ? 'default' : 'secondary'}
											className={
												item.bucket === 'TREATMENT'
													? 'bg-emerald-500 hover:bg-emerald-500'
													: undefined
											}
										>
											{item.bucket}
										</Badge>
									</TableCell>
									<TableCell className="tabular-nums">{item.phase}</TableCell>
									<TableCell className="text-right tabular-nums">
										{item.assignedGhostCount}
									</TableCell>
									<TableCell className="text-xs text-slate-500">
										{formatDate(item.updatedAt)}
									</TableCell>
									<TableCell>
										<Button variant="outline" size="sm" onClick={() => handleEdit(item)}>
											수정
										</Button>
									</TableCell>
								</TableRow>
							))
						)}
					</TableBody>
				</Table>
			</div>

			<PhaseSchoolEditDialog open={dialogOpen} onOpenChange={setDialogOpen} target={target} />
		</div>
	);
}

export function SchoolsClient() {
	return (
		<section className="px-6 py-8">
			<header className="mb-6">
				<h1 className="text-2xl font-semibold text-slate-900">학교 관리</h1>
				<p className="mt-1 text-sm text-slate-500">
					블랙리스트와 Phase-School 버킷을 관리합니다.
				</p>
			</header>

			<Tabs defaultValue="blacklist">
				<TabsList>
					<TabsTrigger value="blacklist">블랙리스트</TabsTrigger>
					<TabsTrigger value="phase-schools">Phase-School</TabsTrigger>
				</TabsList>
				<TabsContent value="blacklist" className="mt-4">
					<BlacklistPanel />
				</TabsContent>
				<TabsContent value="phase-schools" className="mt-4">
					<PhaseSchoolsPanel />
				</TabsContent>
			</Tabs>
		</section>
	);
}
