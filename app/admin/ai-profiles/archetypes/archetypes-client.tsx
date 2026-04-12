'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, RefreshCw } from 'lucide-react';
import { ghostInjection } from '@/app/services/admin/ghost-injection';
import type { ArchetypeListItem } from '@/app/types/ghost-injection';
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
import { ghostInjectionKeys } from '../_shared/query-keys';
import { ArchetypeFormDialog } from './archetype-form-dialog';
import { BackfillDialog } from './backfill-dialog';

function formatDate(value: string): string {
	try {
		return new Date(value).toLocaleDateString('ko-KR', {
			year: 'numeric',
			month: '2-digit',
			day: '2-digit',
		});
	} catch {
		return value;
	}
}

export function ArchetypesClient() {
	const [dialogOpen, setDialogOpen] = useState(false);
	const [editing, setEditing] = useState<ArchetypeListItem | null>(null);
	const [backfillOpen, setBackfillOpen] = useState(false);
	const [backfillTarget, setBackfillTarget] = useState<ArchetypeListItem | null>(null);

	const { data, isLoading, isError, error } = useQuery({
		queryKey: ghostInjectionKeys.archetypes(),
		queryFn: () => ghostInjection.listArchetypes(),
	});

	const archetypes = useMemo<ArchetypeListItem[]>(() => data?.items ?? [], [data]);

	const handleCreate = () => {
		setEditing(null);
		setDialogOpen(true);
	};

	const handleEdit = (archetype: ArchetypeListItem) => {
		setEditing(archetype);
		setDialogOpen(true);
	};

	return (
		<section className="px-6 py-8">
			<header className="mb-6 flex items-start justify-between">
				<div>
					<h1 className="text-2xl font-semibold text-slate-900">프로필 유형 관리</h1>
					<p className="mt-1 text-sm text-slate-500">
						가상 프로필의 유형을 정의합니다. 나이 범위, MBTI, 관심사 키워드를 설정하면 생성 시 자동으로 랜덤 프로필이 만들어집니다.
					</p>
				</div>
				<div className="flex items-center gap-2">
					<Button variant="outline" onClick={() => { setBackfillTarget(null); setBackfillOpen(true); }}>
						<RefreshCw className="mr-2 h-4 w-4" /> 전체 프로필 재생성
					</Button>
					<Button onClick={handleCreate}>
						<Plus className="mr-2 h-4 w-4" /> 유형 추가
					</Button>
				</div>
			</header>

			{isError ? (
				<Alert variant="destructive" className="mb-4">
					<AlertDescription>
						{error instanceof Error ? error.message : '프로필 유형 목록을 불러오지 못했습니다.'}
					</AlertDescription>
				</Alert>
			) : null}

			<div className="rounded-md border bg-white">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>이름</TableHead>
							<TableHead>나이</TableHead>
							<TableHead>MBTI Pool</TableHead>
							<TableHead>키워드</TableHead>
							<TableHead className="text-right">활성 프로필</TableHead>
							<TableHead>수정일</TableHead>
							<TableHead className="w-16" />
						</TableRow>
					</TableHeader>
					<TableBody>
						{isLoading ? (
							<TableRow>
								<TableCell colSpan={7} className="py-12 text-center text-sm text-slate-500">
									불러오는 중…
								</TableCell>
							</TableRow>
						) : archetypes.length === 0 ? (
							<TableRow>
								<TableCell colSpan={7} className="py-12 text-center text-sm text-slate-500">
									등록된 프로필 유형이 없습니다. 상단 버튼으로 첫 유형을 추가하세요.
								</TableCell>
							</TableRow>
						) : (
							archetypes.map((archetype) => (
								<TableRow key={archetype.archetypeId}>
									<TableCell>
										<div className="font-medium text-slate-800">{archetype.name}</div>
										{archetype.description ? (
											<div className="text-xs text-slate-500">{archetype.description}</div>
										) : null}
									</TableCell>
									<TableCell className="text-sm text-slate-600">
										{archetype.traits.ageRange.min}–{archetype.traits.ageRange.max}
									</TableCell>
									<TableCell>
										<div className="flex flex-wrap gap-1">
											{archetype.traits.mbtiPool.slice(0, 6).map((mbti) => (
												<Badge key={mbti} variant="secondary">
													{mbti}
												</Badge>
											))}
											{archetype.traits.mbtiPool.length > 6 ? (
												<Badge variant="outline">+{archetype.traits.mbtiPool.length - 6}</Badge>
											) : null}
										</div>
									</TableCell>
									<TableCell>
										<div className="flex flex-wrap gap-1">
											{archetype.traits.keywordPool.slice(0, 4).map((keyword) => (
												<Badge key={keyword} variant="outline">
													{keyword}
												</Badge>
											))}
											{archetype.traits.keywordPool.length > 4 ? (
												<Badge variant="outline">+{archetype.traits.keywordPool.length - 4}</Badge>
											) : null}
										</div>
									</TableCell>
									<TableCell className="text-right tabular-nums">
										{archetype.activeGhostCount}
									</TableCell>
									<TableCell className="text-xs text-slate-500">
										{formatDate(archetype.updatedAt)}
									</TableCell>
									<TableCell>
										<div className="flex items-center gap-1">
											<Button
												variant="ghost"
												size="icon"
												className="h-8 w-8"
												title="이 유형의 프로필 재생성"
												onClick={() => { setBackfillTarget(archetype); setBackfillOpen(true); }}
											>
												<RefreshCw className="h-3.5 w-3.5" />
											</Button>
											<Button variant="outline" size="sm" onClick={() => handleEdit(archetype)}>
												수정
											</Button>
										</div>
									</TableCell>
								</TableRow>
							))
						)}
					</TableBody>
				</Table>
			</div>

			<ArchetypeFormDialog open={dialogOpen} onOpenChange={setDialogOpen} editing={editing} />
			<BackfillDialog
				open={backfillOpen}
				onOpenChange={setBackfillOpen}
				archetypeId={backfillTarget?.archetypeId}
				archetypeName={backfillTarget?.name}
			/>
		</section>
	);
}
